import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Database } from "@/lib/database.types"

type Product = Database["public"]["Tables"]["products"]["Row"]

export type CartItem = {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  product: Product
}

type CartStore = {
  items: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getSubtotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (item) => {
        const items = get().items
        const existingItem = items.find((i) => i.product_id === item.product_id)

        if (existingItem) {
          // Update quantity if item already exists
          set({
            items: items.map((i) =>
              i.product_id === item.product_id ? { ...i, quantity: i.quantity + item.quantity } : i,
            ),
          })
        } else {
          // Add new item
          set({ items: [...items, item] })
        }
      },

      removeFromCart: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) })
      },

      updateQuantity: (id, quantity) => {
        set({
          items: get().items.map((item) => (item.id === id ? { ...item, quantity } : item)),
        })
      },

      clearCart: () => {
        set({ items: [] })
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      },
    }),
    {
      name: "cart-storage",
      // Only persist for the current user
      partialize: (state) => ({
        items: state.items,
      }),
    },
  ),
)

