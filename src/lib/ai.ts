const KEY_STORE = 'mr-pos-ai-key'
const MODEL = 'llama-3.3-70b-versatile'

export function getAiKey(): string {
  return localStorage.getItem(KEY_STORE) ?? ''
}

export function setAiKey(key: string) {
  if (key.trim()) localStorage.setItem(KEY_STORE, key.trim())
  else localStorage.removeItem(KEY_STORE)
}

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }

export async function askAi(messages: ChatMsg[]): Promise<string> {
  const key = getAiKey()
  if (!key) throw new Error('no groq key set')
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.4, max_tokens: 700 }),
  })
  if (!res.ok) throw new Error(`groq ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

export function isAiReady(): boolean {
  return getAiKey().length > 0
}
