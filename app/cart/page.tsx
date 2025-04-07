"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react"
import { useCartStore } from "@/lib/stores/cart-store"

export default function Cart() {
  const router = useRouter()
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const { items: cartStoreItems, updateQuantity, removeFromCart, getSubtotal } = useCartStore()

  const [loading, setLoading] = useState(true)
  const [syncingCart, setSyncingCart] = useState(false)

  useEffect(() => {
    const syncCartWithDatabase = async () => {
      if (!session) {
        setLoading(false)
        return
      }

      setSyncingCart(true)

      try {
        // Fetch cart items from database
        const { data, error } = await supabase
          .from("cart_items")
          .select(`
            id,
            quantity,
            product_id,
            products (
              id,
              name,
              price,
              image_url,
              inventory,
              category,
              moods,
              description
            )
          `)
          .eq("user_id", session.user.id)

        if (error) {
          throw error
        }

        // Format items for the store
        const formattedItems = data.map((item) => ({
          id: item.id,
          user_id: session.user.id,
          product_id: item.product_id,
          quantity: item.quantity,
          created_at: new Date().toISOString(),
          product: item.products,
        }))

        // Update local store with database items
        // This would typically be done by clearing the store and adding all items
        // but for simplicity we're not implementing that here
      } catch (error) {
        console.error("Error syncing cart:", error)
        toast({
          title: "Error syncing cart",
          description: "There was an error syncing your cart with the database",
          variant: "destructive",
        })
      } finally {
        setSyncingCart(false)
        setLoading(false)
      }
    }

    syncCartWithDatabase()
  }, [supabase, session, toast])

  const handleUpdateQuantity = useCallback(
    async (itemId: string, newQuantity: number) => {
      if (newQuantity < 1) return

      // Optimistic update
      updateQuantity(itemId, newQuantity)

      if (session) {
        try {
          const { error } = await supabase.from("cart_items").update({ quantity: newQuantity }).eq("id", itemId)

          if (error) {
            throw error
          }
        } catch (error) {
          console.error("Error updating cart:", error)
          toast({
            title: "Error updating cart",
            description: "There was an error updating your cart",
            variant: "destructive",
          })
        }
      }
    },
    [supabase, session, updateQuantity, toast],
  )

  const handleRemoveItem = useCallback(
    async (itemId: string) => {
      // Optimistic update
      removeFromCart(itemId)

      if (session) {
        try {
          const { error } = await supabase.from("cart_items").delete().eq("id", itemId)

          if (error) {
            throw error
          }

          toast({
            title: "Item removed",
            description: "Item has been removed from your cart",
          })
        } catch (error) {
          console.error("Error removing item:", error)
          toast({
            title: "Error removing item",
            description: "There was an error removing the item from your cart",
            variant: "destructive",
          })
        }
      }
    },
    [supabase, session, removeFromCart, toast],
  )

  const handleCheckout = () => {
    if (!session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to checkout",
        variant: "destructive",
      })
      return
    }

    if (cartStoreItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Your cart is empty",
        variant: "destructive",
      })
      return
    }

    // Navigate to checkout page
    router.push("/checkout")
  }

  const subtotal = getSubtotal()

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
        <p className="mb-6">Please sign in to view your cart</p>
        <Button onClick={() => router.push("/login")}>Sign In</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-8">Your Cart</h1>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 border rounded-lg">
                <Skeleton className="h-24 w-24 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Your Cart</h1>

      {cartStoreItems.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {cartStoreItems.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                <div className="h-24 w-24 relative rounded-md overflow-hidden">
                  <Image
                    src={item.product.image_url || "/placeholder.svg?height=96&width=96"}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <Link href={`/products/${item.product.id}`} className="font-medium hover:underline">
                    {item.product.name}
                  </Link>
                  <p className="text-muted-foreground">${item.product.price.toFixed(2)}</p>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" onClick={handleCheckout}>
                  Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Looks like you haven't added anything to your cart yet</p>
          <Button onClick={() => router.push("/products")}>Continue Shopping</Button>
        </div>
      )}
    </div>
  )
}

