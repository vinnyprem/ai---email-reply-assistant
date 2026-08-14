# AI Email Reply Assistant

A production-ready SaaS application that helps users generate professional email replies using AI. Sign in with Google, browse your Gmail inbox, pick a tone, and let AI draft a polished reply you can edit and send — all in one premium dark-themed dashboard.

Built as a portfolio-ready project for students, professionals, recruiters, and support teams.

## Features

- **Google OAuth 2.0** sign-in (plus email/password fallback)
- **Gmail integration** — inbox, search, read, send, star, mark read/unread, delete
- **AI replies** in 7 tones: Professional, Friendly, Formal, Casual, Thank You, Apology, Follow Up
- **AI tools** — Summarize, Improve, Shorter, Longer, Grammar, Translate, Friendly Rewrite, Formal Rewrite, Suggested Subject
- **AI analysis** — Intent detection, Priority detection, Sentiment detection, Action item extraction
- **History** — every reply saved with original email, tone, status, analysis
- **Statistics dashboard** — replies generated, sent today, total sent, drafts, most used tone, average response time, 7-day activity chart, tone distribution donut chart
- **Settings** — default tone, AI model, theme, auto-save, auto-reply, notifications, signature
- **Profile** — Google photo, name, email, auth provider, account status, Gmail connection status
- **Responsive** — desktop, tablet, mobile with drawer navigation
- **Polish** — rounded cards, smooth animations, loading skeletons, toast notifications

## Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, lucide-react |
| Backend / Auth / DB | Supabase (Postgres + Auth + Row Level Security + Edge Functions) |
| AI | OpenAI-compatible API via Supabase Edge Function |
| Email | Gmail API via Supabase Edge Function |

## Quick Start

```bash
npm install
npm run dev      # start dev server
npm run build    # production build
npm run typecheck
```

Environment variables (pre-provisioned in `.env`):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Database

Supabase handles auth and persistence. Tables (created via migrations):

- `email_history` — generated replies, original email, tone, status, important flag, response time, AI analysis
- `user_settings` — default tone, AI model, theme, auto-save, auto-reply, notifications, signature
- `profiles` — cached Google profile, avatar, provider, Gmail connection status, account status
- `google_tokens` — Google OAuth access/refresh tokens for Gmail API access

All tables have Row Level Security enabled with owner-scoped policies (`auth.uid() = user_id`).

## Manual Configuration Required

### 1. Google Cloud Project + OAuth (for Google Sign-in + Gmail)

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Go to **APIs & Services → OAuth consent screen**:
   - Choose **External**, fill in app name, your email, and developer contact.
   - Add scopes: `openid`, `email`, `profile`, and `https://www.googleapis.com/auth/gmail.readonly`, `https://www.googleapis.com/auth/gmail.send`.
   - Save and publish (for testing, add your email as a test user).
4. Go to **APIs & Services → Library** and **enable the Gmail API**.
5. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Add the authorized redirect URI:
     ```
     https://<your-supabase-project>.supabase.co/auth/v1/callback
     ```
6. Copy the **Client ID** and **Client Secret**.
7. In your Supabase dashboard, go to **Authentication → Providers → Google**:
   - Enable it.
   - Paste the Client ID and Client Secret.
   - Save.

### 2. OpenAI API Key (for real AI replies)

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys).
2. Set it as a Supabase edge function secret:
   ```bash
   OPENAI_API_KEY=sk-...
   AI_MODEL=gpt-4o-mini   # optional, defaults to gpt-4o-mini
   ```

## Edge Functions

| Function | Purpose |
| --- | --- |
| `ai-assistant` | AI reply generation, summarize, improve, rewrite, grammar, translate, subject, intent, priority, sentiment, action items |
| `gmail-proxy` | Gmail list, get, send, star, mark read/unread, delete |

Both include CORS headers, try/catch error handling, and graceful fallbacks.

## Project Structure

```
src/
  components/      # Layout, sidebar, topbar, toast, skeletons, reply editor
  lib/              # supabase client, auth, ai, gmail, history, settings, profile, types, format
  pages/            # Login, Inbox, EmailView, History, Sent, Settings, Profile, Stats
  App.tsx           # Routes
  main.tsx          # Entry
supabase/
  functions/
    ai-assistant/   # AI edge function
    gmail-proxy/    # Gmail edge function
  migrations/       # SQL migrations
```

## Deployment

The frontend is a Vite SPA — deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build-time env vars. Edge functions deploy through Supabase.

## License

MIT — free to use for portfolios and learning.
