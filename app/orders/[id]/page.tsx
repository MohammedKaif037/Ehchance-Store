"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, FileText, ArrowLeft } from "lucide-react"

type Order = {
  id: string
  created_at: string
  total: number
  status: string
  items: {
    id: string
    quantity: number
    price: number
    product: {
      id: string
      name: string
    }
  }[]
}

export default function OrderPage() {
  const params = useParams()
  const router = useRouter()
  const { supabase, session } = useSupabase()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!session || !params.id) {
        setLoading(false)
        return
      }

      // Get order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", params.id)
        .eq("user_id", session.user.id)
        .single()

      if (orderError || !orderData) {
        console.error("Error fetching order:", orderError)
        router.push("/account")
        return
      }

      // Get order items
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          id,
          quantity,
          price,
          products (
            id,
            name
          )
        `)
        .eq("order_id", params.id)

      if (itemsError) {
        console.error("Error fetching order items:", itemsError)
        return
      }

      setOrder({
        ...orderData,
        items: itemsData.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          product: item.products,
        })),
      })

      setLoading(false)
    }

    fetchOrder()
  }, [supabase, session, params.id, router])

  const handleDownloadInvoice = async () => {
    if (!order) return

    try {
      await supabase.functions.invoke("generate-invoice", {
        body: { orderId: order.id },
      })

      alert("Invoice has been sent to your email!")
    } catch (error) {
      console.error("Error generating invoice:", error)
      alert("Failed to generate invoice. Please try again later.")
    }
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Order Details</h1>
        <p className="mb-6">Please sign in to view your order</p>
        <Button onClick={() => router.push("/login")}>Sign In</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <p className="mb-6">We couldn't find the order you're looking for</p>
        <Button onClick={() => router.push("/account")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Account
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
          <Button variant="outline" onClick={() => router.push("/account")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Account
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Order Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date</span>
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Status</span>
                <span className="capitalize">{order.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{session.user.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <span className="font-medium">{item.product.name}</span>
                    <div className="text-sm text-muted-foreground">Quantity: {item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div>${item.price.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                </div>
              ))}

              <Separator className="my-4" />

              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button onClick={handleDownloadInvoice} className="gap-2">
            <FileText className="h-4 w-4" />
            Send Invoice to Email
          </Button>
        </div>
      </div>
    </div>
  )
}

