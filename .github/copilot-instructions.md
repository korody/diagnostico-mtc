## Quick context for AI contributors

This repo implements a small Node/React project that collects quiz answers, calculates a Traditional Chinese Medicine (TCM) style diagnosis and sends WhatsApp messages via an external Unnichat gateway. The API is an Express app (server.js) plus several Vercel-style serverless handlers in `api/`.

Key responsibilities an AI helper will frequently touch:
- Identify and normalize leads (phone/email) in `server.js` and `api/webhook/unnichat/ver-resultados.js`.
- Compute diagnosis & lead scoring in `api/submit.js` (MAPEAMENTO_ELEMENTOS, calcularLeadScore, determinarQuadrante).
- Send messages via Unnichat in `server.js`, `api/send-bulk-referral.js` and webhook handlers (POST to `${UNNICHAT_API_URL}/meta/messages`).
- Persist logs and state to Supabase tables like `quiz_leads`, `whatsapp_logs`, and `whatsapp_messages`.

Run / build / debug commands (from `package.json`)
- Start API only (dev/test/prod): `npm run api` / `npm run api:test` / `npm run api:prod`
- Full dev (api + react): `npm run dev`
- Mass-send scripts: `npm run send:test` / `npm run send:prod`

Environment and secrets
- The app requires Supabase credentials and Unnichat tokens. Files used in this repo: `.env.local` (dev), `.env.production` and `.env.test` (example attached). See `server.js` and top of `api/*` for which vars are expected:
  - SUPABASE_URL, SUPABASE_KEY (or REACT_APP_SUPABASE_* in serverless functions)
  - UNNICHAT_ACCESS_TOKEN / UNNICHAT_API_URL
  - WHATSAPP_* and cron/admin secrets in `.env.test` (use for local testing only)
- Never commit .env files; follow `readme-producao.md` for production checklist.

Project-specific conventions and patterns
- Phone handling: Normalization and multi-step lookup are central. Follow the existing pattern (strip non-digits, drop leading 55, then try exact -> last 9 digits -> last 8 digits) — see `server.js` webhook and `api/webhook/unnichat/ver-resultados.js` for implementation.
- Lead scoring: Multiple weighted rules live in `api/submit.js`. If you change scoring weights, update both `server.js` (API) and Vercel handler copies in `api/`.
- Text templating: diagnostics are stored in `api/diagnosticos.json` and patched into messages via simple .replace(/{NOME}/g,...). Keep templates plain-text and escape markdown consistently before sending.
- Rate limiting: Bulk senders use fixed delays (DELAY_BETWEEN_MESSAGES, DELAY_BETWEEN_LEADS). Prefer these constants to avoid rate-limits by Unnichat/Meta.

Integration points to watch
- Supabase: CRUD operations on `quiz_leads`, `whatsapp_logs`, `whatsapp_messages`.
- Unnichat: endpoints used: `/meta/messages` and `/contact` (see webhook & send scripts). Responses sometimes include `code` and `message` fields — code !== '200' indicates failure.

Small contract for quick tasks (what AI should preserve)
- Inputs: request body shapes used by handlers (e.g. `{ lead, respostas }` for /api/submit, webhook payloads with `phone|from|contact` fields).
- Outputs: JSON with `{ success: true|false, message?, error? }` and appropriate HTTP status codes (400 for client errors, 404 when lead not found, 500 for server errors).
- Error modes: invalid phone format, missing env vars, external API failures (Unnichat, Supabase). Log details and avoid leaking secrets.

Examples worth reusing in edits
- To find a lead from webhook payload prefer the three-stage phone lookup used in `server.js` (exact -> last 9 -> last 8) and fallback to email/name.
- To send a WhatsApp message reuse the fetch POST shape used in `server.js` (headers Authorization Bearer, Content-Type: application/json, body { phone, messageText }).

Where to look for follow-ups
- `server.js` — the canonical runtime API and source of truth for routes and message logic.
- `api/submit.js`, `api/webhook-ver-resultados` — serverless variants; mirror logic if you change behavior.
- `api/diagnosticos.json` — contains message templates and profile data.
- `readme-producao.md` — production runbook and checklist.

If something is unclear
- Ask which environment (dev/test/prod) to target. Note: `.env.test` in the repo contains useful example values but must not be used in production.

Finally — when editing code:
- Keep message templates/diagnostics and DB field names unchanged unless you're migrating the DB.
- Preserve phone normalization and fallback lookup order.
- Add/update small unit tests for any normalization or scoring change (example test suggestion: normalizePhone with/without country code, and scoring boundary at 70 and 80).

If you'd like, I can now:
- (A) Add this file to the repo (I will) and run a quick smoke check (start the API with `npm run api:test`) or
- (B) Expand this into a longer CONTRIBUTORS.md with code pointers and suggested tests.

Please tell me which option you prefer or suggest changes to the instructions above.
