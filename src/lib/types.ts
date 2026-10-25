export type Product = {
  id: string
  name: string
  cost: number
  price: number
  stock: number
  emoji: string
}

export type SaleItem = { name: string; qty: number; price: number; cost: number }
export type Sale = { id: string; at: string; method: 'cash' | 'transfer'; items: SaleItem[] }
export type CartLine = { product: Product; qty: number }
