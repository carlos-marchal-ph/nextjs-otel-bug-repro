import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}))
    const prompt: string = body?.prompt ?? 'Tell me a fun fact about hedgehogs.'

    const result = await generateText({
        model: openai('gpt-5-mini'),
        prompt,
        experimental_telemetry: {
            isEnabled: true,
            functionId: 'chat-route',
            metadata: {
                posthog_distinct_id: 'repro-user-123',
                conversation_id: 'repro-conversation-abc',
            },
        },
    })

    return NextResponse.json({ text: result.text, usage: result.usage })
}
