import { NodeSDK } from '@opentelemetry/sdk-node'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { PostHogSpanProcessor } from '@posthog/ai/otel'

export function register() {
    if (process.env.NEXT_RUNTIME !== 'nodejs') {
        return
    }

    const apiKey = process.env.POSTHOG_PROJECT_API_KEY
    const host = process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com'

    if (!apiKey) {
        console.warn('[instrumentation] POSTHOG_PROJECT_API_KEY missing; skipping OTel setup')
        return
    }

    const sdk = new NodeSDK({
        resource: resourceFromAttributes({
            'service.name': 'nextjs-otel-bug-repro',
        }),
        spanProcessors: [new PostHogSpanProcessor({ apiKey, host })],
    })

    sdk.start()
    console.log(`[instrumentation] NodeSDK started (host=${host})`)
}
