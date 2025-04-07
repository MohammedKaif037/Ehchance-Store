"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { useCartStore } from "@/lib/stores/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, CreditCard, Truck, MapPin, ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function Checkout() {
  const router = useRouter()
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const { items, getSubtotal, clearCart } = useCartStore()

  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("credit-card")
  const [shippingMethod, setShippingMethod] = useState("standard")
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
  })

  useEffect(() => {
    // Redirect if not logged in
    if (!session) {
      router.push("/login")
      return
    }

    // Redirect if cart is empty
    if (items.length === 0 && !orderComplete) {
      router.push("/cart")
      return
    }

    // Pre-fill email if available
    if (session.user.email) {
      setFormData((prev) => ({
        ...prev,
        email: session.user.email || "",
      }))
    }
  }, [session, items, router, orderComplete])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const subtotal = getSubtotal()
  const shipping = shippingMethod === "express" ? 9.99 : 0
  const total = subtotal + shipping

  const handleSubmitOrder = async () => {
    if (!session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to place an order",
        variant: "destructive",
      })
      return
    }

    // Basic form validation
    const requiredFields = ["name", "email", "address", "city", "state", "zip"]
    if (paymentMethod === "credit-card") {
      requiredFields.push("cardNumber", "cardExpiry", "cardCvc")
    }

    const missingFields = requiredFields.filter((field) => !formData[field as keyof typeof formData])
    if (missingFields.length > 0) {
      toast({
        title: "Missing information",
        description: `Please fill in all required fields: ${missingFields.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: session.user.id,
          total: total,
          status: "pending",
        })
        .select()
        .single()

      if (orderError) {
        throw orderError
      }

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.price,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) {
        throw itemsError
      }

      // Clear cart
      const { error: clearCartError } = await supabase.from("cart_items").delete().eq("user_id", session.user.id)

      if (clearCartError) {
        console.error("Error clearing cart:", clearCartError)
      }

      // Generate and send invoice
      await supabase.functions.invoke("generate-invoice", {
        body: { orderId: order.id },
      })

      // Clear local cart
      clearCart()

      // Show success
      setOrderId(order.id)
      setOrderComplete(true)

      toast({
        title: "Order placed successfully!",
        description: "Your order has been placed and will be processed soon.",
      })
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Error placing order",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (orderComplete) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for your order. We've sent a confirmation email with all the details.
          </p>

          <Card className="mb-8 text-left">
            <CardHeader>
              <CardTitle>Order #{orderId?.slice(0, 8)}</CardTitle>
              <CardDescription>Order details and tracking information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Shipping Address</h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.name}
                    <br />
                    {formData.address}
                    <br />
                    {formData.city}, {formData.state} {formData.zip}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Shipping Method</h3>
                  <p className="text-sm text-muted-foreground">
                    {shippingMethod === "express" ? "Express (1-2 business days)" : "Standard (3-5 business days)"}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Payment Method</h3>
                  <p className="text-sm text-muted-foreground">
                    {paymentMethod === "credit-card"
                      ? `Credit Card (ending in ${formData.cardNumber.slice(-4)})`
                      : "PayPal"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push(`/orders/${orderId}`)}>View Order Details</Button>
            <Button variant="outline" onClick={() => router.push("/products")}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => router.push("/cart")} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Button>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleInputChange} required />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" value={formData.state} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input id="zip" name="zip" value={formData.zip} onChange={handleInputChange} required />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="space-y-3">
                <div className="flex items-center justify-between space-x-2 border p-4 rounded-md">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="standard" id="standard" />
                    <Label htmlFor="standard" className="font-medium">
                      Standard Shipping
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <span className="text-muted-foreground mr-2">3-5 business days</span>
                    <span className="font-medium">Free</span>
                  </div>
                </div>

                <div className="flex items-center justify-between space-x-2 border p-4 rounded-md">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="express" id="express" />
                    <Label htmlFor="express" className="font-medium">
                      Express Shipping
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <span className="text-muted-foreground mr-2">1-2 business days</span>
                    <span className="font-medium">$9.99</span>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="credit-card">Credit Card</TabsTrigger>
                  <TabsTrigger value="paypal">PayPal</TabsTrigger>
                </TabsList>

                <TabsContent value="credit-card" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      name="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardExpiry">Expiration Date</Label>
                      <Input
                        id="cardExpiry"
                        name="cardExpiry"
                        placeholder="MM/YY"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardCvc">CVC</Label>
                      <Input
                        id="cardCvc"
                        name="cardCvc"
                        placeholder="123"
                        value={formData.cardCvc}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="paypal">
                  <div className="text-center py-8">
                    <p className="mb-4">You will be redirected to PayPal to complete your payment.</p>
                    <Image
                      src="/placeholder.svg?text=PayPal+Logo&width=200&height=80"
                      alt="PayPal"
                      width={200}
                      height={80}
                      className="mx-auto"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.quantity} × {item.product.name}
                    </span>
                    <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" onClick={handleSubmitOrder} disabled={loading}>
                {loading ? "Processing..." : "Place Order"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

