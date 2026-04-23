'use client'

import { useState } from 'react'

export default function Home() {
    const [text, setText] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const runChat = async () => {
        setLoading(true)
        setError(null)
        setText('')
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ prompt: 'Tell me a fun fact about hedgehogs.' }),
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.error ?? `status ${res.status}`)
            }
            setText(data.text)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e))
        } finally {
            setLoading(false)
        }
    }

    return (
        <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
            <h1>Next.js + Vercel AI SDK + PostHog OTel repro</h1>
            <button onClick={runChat} disabled={loading} style={{ padding: '8px 16px', fontSize: 16 }}>
                {loading ? 'Running…' : 'Call /api/chat'}
            </button>
            {error && <pre style={{ color: 'crimson' }}>{error}</pre>}
            {text && <pre style={{ whiteSpace: 'pre-wrap', marginTop: 16 }}>{text}</pre>}
        </main>
    )
}
