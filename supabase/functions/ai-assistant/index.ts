const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Body {
  action: string;
  email?: {
    sender?: string;
    senderEmail?: string;
    recipient?: string;
    subject?: string;
    body?: string;
  };
  reply?: string;
  tone?: string;
  instruction?: string;
  language?: string;
  text?: string;
}

const SYSTEM_PROMPT = `You are an expert email assistant. You help users write, refine, and analyze professional emails. Always be concise, clear, and helpful. Respond ONLY with the requested content, no preface or explanation unless explicitly asked.`;

function buildPrompt(body: Body): string {
  const e = body.email ?? {};
  const sender = e.sender ?? "the sender";
  const subject = e.subject ?? "";
  const emailBody = e.body ?? "";

  switch (body.action) {
    case "reply": {
      const tone = body.tone ?? "Professional";
      return `Write a ${tone.toLowerCase()} email reply to this message.
Analyze the intent, context, tone, and sender relationship.

From: ${sender}
Subject: ${subject}
Message: ${emailBody}

Write only the reply body (no subject line). Use a natural greeting addressed to ${sender.split(" ")[0]}.`;
    }
    case "improve":
      return `Improve this email reply for clarity, professionalism, and flow. Keep the meaning. Return only the improved text:\n\n${body.reply ?? ""}`;
    case "shorter":
      return `Make this email reply shorter while keeping the key points. Return only the text:\n\n${body.reply ?? ""}`;
    case "longer":
      return `Expand this email reply with more detail and context. Return only the text:\n\n${body.reply ?? ""}`;
    case "rewrite_friendly":
      return `Rewrite this email in a warm, friendly tone. Return only the text:\n\n${body.reply ?? ""}`;
    case "rewrite_formal":
      return `Rewrite this email in a formal, business tone. Return only the text:\n\n${body.reply ?? ""}`;
    case "grammar":
      return `Correct any grammar and spelling issues in this text. Return only the corrected text:\n\n${body.text ?? body.reply ?? ""}`;
    case "translate":
      return `Translate this email reply to ${body.language ?? "Spanish"}. Return only the translated text:\n\n${body.reply ?? ""}`;
    case "summarize":
      return `Summarize this email as concise bullet points. Return only the bullets:\n\nSubject: ${subject}\nFrom: ${sender}\n${emailBody}`;
    case "subject":
      return `Suggest a single concise reply subject line for this email thread. Return only the subject (no "Re:" prefix):\n\n${subject}`;
    case "intent":
      return `Analyze this email and respond with a single short phrase describing the sender's intent (e.g. "scheduling an interview", "requesting payment"). Return only the intent phrase:\n\nSubject: ${subject}\n${emailBody}`;
    case "priority":
      return `Classify the priority of this email as exactly one of: High, Medium, Low. Return only the single word:\n\nSubject: ${subject}\n${emailBody}`;
    case "sentiment":
      return `Classify the sentiment of this email as exactly one of: Positive, Neutral, Negative. Return only the single word:\n\nSubject: ${subject}\n${emailBody}`;
    case "action_items":
      return `Extract action items from this email as a JSON array of strings. Return only the JSON array:\n\nSubject: ${subject}\n${emailBody}`;
    default:
      return "Unknown action.";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: Body = await req.json();
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const model = Deno.env.get("AI_MODEL") ?? "gpt-4o-mini";

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured. Add OPENAI_API_KEY as an edge function secret in your Supabase dashboard." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = buildPrompt(body);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(
        JSON.stringify({ error: `AI provider error ${res.status}: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    const result = data?.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
