import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}))
    const prompt: string = body?.prompt ?? 'Tell me a fun fact about hedgehogs.'

    const result = streamText({
        model: openai('gpt-5-mini'),
        prompt,
        experimental_telemetry: {
            isEnabled: true,
            functionId: 'chat-stream-route',
            metadata: {
                posthog_distinct_id: 'repro-user-stream',
            },
        },
    })

    return result.toUIMessageStreamResponse()
}
