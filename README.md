# Next.js + Vercel AI SDK + PostHog (OpenTelemetry) repro

Minimal Next.js 16 app that sends Vercel AI SDK spans to PostHog LLM
analytics, using the setup from
[PostHog's Vercel AI SDK installation docs](https://posthog.com/docs/llm-analytics/installation/vercel-ai).

## Run

```bash
pnpm install
cp .env.example .env.local    # fill in POSTHOG_PROJECT_API_KEY and OPENAI_API_KEY
./scripts/smoke.sh
```

The script boots `next dev`, POSTs once to `/api/chat`, waits for the span
batch to flush, then shuts the server down. A `$ai_generation` event
should appear in PostHog → **LLM analytics** within ~30s.

For EU projects, set `POSTHOG_HOST=https://eu.i.posthog.com` in
`.env.local`.
