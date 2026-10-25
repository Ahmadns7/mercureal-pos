import type { Product } from './types'
import { loadInventory } from './store'

type SR = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((e: { results: { transcript: string }[][] }) => void) | null
  onerror: ((e: unknown) => void) | null
  onend: (() => void) | null
}

export function voiceSupported(): boolean {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
}

function getSR(): (new () => SR) | null {
  if (typeof window === 'undefined') return null
  return (window as unknown as Record<string, unknown>)['SpeechRecognition'] as (new () => SR) | null ||
    (window as unknown as Record<string, unknown>)['webkitSpeechRecognition'] as (new () => SR) | null
}

// parse spoken/typed commands like "sold 2 bread and 3 milk" or "two bread"
const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }

export type ParsedItem = { product: Product; qty: number }
export function parseSaleCommand(text: string, products: Product[] = loadInventory()): ParsedItem[] {
  const clean = text.toLowerCase().replace(/[.,]/g, ' ')
  const out: ParsedItem[] = []
  // number-then-item and item-then-number
  const re = /(\d+|one|two|three|four|five|six|seven|eight|nine|ten)?\s*([a-z][a-z ]{1,25}?)(?=\s+(?:and|plus|\d|one|two|three|four|five|six|seven|eight|nine|ten)|$)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(clean)) !== null) {
    const rawQty = m[1]
    const name = m[2].trim()
    if (!name) continue
    const qty = rawQty ? NUMBER_WORDS[rawQty] ?? parseInt(rawQty, 10) : 1
    const product = products.find((p) => {
      const pn = p.name.toLowerCase()
      return pn.includes(name) || name.includes(pn.split(' ')[0])
    })
    if (product && qty > 0) out.push({ product, qty })
  }
  return out
}

export function listenOnce(onText: (t: string) => void, onError: (why: string) => void): () => void {
  const SRC = getSR()
  if (!SRC) {
    onError('voice not supported in this browser')
    return () => {}
  }
  const sr = new SRC()
  sr.lang = 'en-NG'
  sr.continuous = false
  sr.interimResults = false
  sr.onresult = (e) => onText(e.results[0][0].transcript)
  sr.onerror = () => onError('didnt catch that, try again')
  sr.start()
  return () => sr.stop()
}
