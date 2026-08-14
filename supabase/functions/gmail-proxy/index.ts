import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "";

const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

interface GmailMessage {
  id: string;
  threadId?: string;
  sender: string;
  senderEmail: string;
  recipient: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  read: boolean;
  important: boolean;
  label?: string;
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  try {
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "";
  }
}

function encodeBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function getHeader(headers: any[], name: string): string {
  const h = headers?.find((x: any) => x.name?.toLowerCase() === name.toLowerCase());
  return h?.value ?? "";
}

function extractBody(payload: any): string {
  if (!payload) return "";
  if (payload.body?.data) return decodeBase64Url(payload.body.data);
  if (payload.parts) {
    const plain = payload.parts.find((p: any) => p.mimeType === "text/plain");
    if (plain?.body?.data) return decodeBase64Url(plain.body.data);
    const html = payload.parts.find((p: any) => p.mimeType === "text/html");
    if (html?.body?.data) {
      const raw = decodeBase64Url(html.body.data);
      return raw.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    }
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }
  return "";
}

function parseMessage(msg: any): GmailMessage {
  const headers = msg.payload?.headers ?? [];
  const from = getHeader(headers, "From");
  const fromMatch = from.match(/^(.*?)\s*<(.+)>$/) ?? [null, from, from];
  const sender = (fromMatch[1] ?? from).replace(/"/g, "").trim() || from;
  const senderEmail = fromMatch[2] ?? from;
  const subject = getHeader(headers, "Subject") || "(no subject)";
  const date = msg.internalDate
    ? new Date(parseInt(msg.internalDate, 10)).toISOString()
    : new Date().toISOString();
  const labels = msg.labelIds ?? [];
  const read = !labels.includes("UNREAD");
  const important = labels.includes("STARRED") || labels.includes("IMPORTANT");
  const body = extractBody(msg.payload);
  const preview = body.slice(0, 200).replace(/\s+/g, " ").trim();

  let label: string | undefined;
  if (labels.includes("INBOX")) label = "Inbox";
  const customLabel = labels.find((l: string) => l.startsWith("Label_"));
  if (customLabel) label = customLabel;

  return {
    id: msg.id,
    threadId: msg.threadId,
    sender,
    senderEmail,
    recipient: getHeader(headers, "To"),
    subject,
    preview,
    body,
    date,
    read,
    important,
    label,
  };
}

function makeAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function getAccessToken(userJwt: string): Promise<string | null> {
  const supabaseAdmin = makeAdminClient();

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(userJwt);
  if (userErr || !userData?.user) {
    console.error("Failed to resolve user from JWT:", userErr?.message);
    return null;
  }
  const userId = userData.user.id;

  const { data: tokenRow, error: tokenErr } = await supabaseAdmin
    .from("google_tokens")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (tokenErr) {
    console.error("Error querying google_tokens:", tokenErr.message);
    return null;
  }
  if (!tokenRow) {
    console.error("No google_tokens row found for user:", userId);
    return null;
  }

  const now = Date.now();
  const expiresAt = tokenRow.expires_at ? new Date(tokenRow.expires_at).getTime() : 0;

  if (tokenRow.access_token && expiresAt > now + 60_000) {
    return tokenRow.access_token;
  }

  if (!tokenRow.refresh_token) {
    console.error("No refresh token stored — cannot refresh access token");
    return null;
  }
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured");
    return null;
  }

  try {
    const refreshRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: tokenRow.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!refreshRes.ok) {
      const errText = await refreshRes.text();
      console.error("Token refresh failed:", refreshRes.status, errText);
      return null;
    }

    const refreshed = await refreshRes.json();
    const newExpiresAt = new Date(now + (refreshed.expires_in ?? 3600) * 1000).toISOString();

    await supabaseAdmin
      .from("google_tokens")
      .update({
        access_token: refreshed.access_token,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return refreshed.access_token;
  } catch (err) {
    console.error("Token refresh error:", err);
    return null;
  }
}

async function gmailFetch(path: string, accessToken: string, init?: RequestInit) {
  const res = await fetch(`${GMAIL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail API error ${res.status}: ${text}`);
  }
  return res.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, query, messageId, to, subject, body: text, threadId } = body;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userToken = authHeader.replace("Bearer ", "");

    const accessToken = await getAccessToken(userToken);

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          gmailConnected: false,
          error: "Gmail not connected. Click Connect Gmail to sign in with Google and grant inbox access.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case "status": {
        return new Response(
          JSON.stringify({ gmailConnected: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list": {
        const maxResults = body.maxResults ?? 20;
        const qParam = query ? `&q=${encodeURIComponent(query)}` : "";
        const list = await gmailFetch(
          `/messages?maxResults=${maxResults}${qParam}`,
          accessToken
        );
        const ids: { id: string; threadId: string }[] = list.messages ?? [];
        const messages: GmailMessage[] = [];
        for (const m of ids.slice(0, maxResults)) {
          const full = await gmailFetch(`/messages/${m.id}?format=full`, accessToken);
          messages.push(parseMessage(full));
        }
        return new Response(
          JSON.stringify({ gmailConnected: true, messages }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get": {
        const full = await gmailFetch(`/messages/${messageId}?format=full`, accessToken);
        return new Response(
          JSON.stringify({ gmailConnected: true, message: parseMessage(full) }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "send": {
        const emailLines: string[] = [
          `To: ${to}`,
          `Subject: ${subject}`,
        ];
        if (threadId) {
          emailLines.push(`In-Reply-To: ${threadId}`);
          emailLines.push(`References: ${threadId}`);
        }
        emailLines.push("Content-Type: text/plain; charset=UTF-8");
        emailLines.push("MIME-Version: 1.0");
        emailLines.push("");
        emailLines.push(text ?? "");

        const encoded = encodeBase64Url(emailLines.join("\r\n"));
        const sendBody: Record<string, unknown> = { raw: encoded };
        if (threadId) sendBody.threadId = threadId;

        const result = await gmailFetch(`/messages/send`, accessToken, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sendBody),
        });
        return new Response(
          JSON.stringify({ gmailConnected: true, sent: true, id: result.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "star": {
        await gmailFetch(`/messages/${messageId}/modify`, accessToken, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addLabelIds: ["STARRED"] }),
        });
        return new Response(
          JSON.stringify({ gmailConnected: true, starred: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "markRead": {
        await gmailFetch(`/messages/${messageId}/modify`, accessToken, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
        });
        return new Response(
          JSON.stringify({ gmailConnected: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "markUnread": {
        await gmailFetch(`/messages/${messageId}/modify`, accessToken, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addLabelIds: ["UNREAD"] }),
        });
        return new Response(
          JSON.stringify({ gmailConnected: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        await gmailFetch(`/messages/${messageId}`, accessToken, { method: "DELETE" });
        return new Response(
          JSON.stringify({ gmailConnected: true, deleted: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const needsReauth = msg.includes("403") || msg.includes("insufficient") || msg.includes("invalid_grant");
    return new Response(
      JSON.stringify({
        error: needsReauth ? "Gmail access not granted. Click Connect Gmail to re-authorize with inbox permissions." : msg,
        gmailConnected: false,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
