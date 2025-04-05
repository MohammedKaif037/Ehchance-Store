"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Check, Package } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const subscriptionPlans = [
  {
    id: "monthly",
    name: "Monthly Mood Box",
    description: "A curated box of mood-enhancing products delivered monthly",
    price: 29.99,
    features: [
      "5-7 mood-enhancing products each month",
      "Personalized to your mood preferences",
      "Free shipping",
      "Cancel anytime",
    ],
    popular: false,
  },
  {
    id: "quarterly",
    name: "Quarterly Mood Box",
    description: "A seasonal box of premium mood products every 3 months",
    price: 79.99,
    features: [
      "7-10 premium mood products each quarter",
      "Personalized to your mood preferences",
      "Free shipping",
      "Exclusive seasonal items",
      "Save 10% compared to monthly",
    ],
    popular: true,
  },
  {
    id: "annual",
    name: "Annual Mood Box",
    description: "Our best value subscription with a full year of mood boxes",
    price: 299.99,
    features: [
      "Quarterly deliveries (4 boxes per year)",
      "Premium mood products",
      "Free shipping",
      "Exclusive seasonal items",
      "Save 15% compared to quarterly",
      "Free mood consultation",
    ],
    popular: false,
  },
]

export default function Subscription() {
  const router = useRouter()
  const { session } = useSupabase()
  const { toast } = useToast()
  const [selectedPlan, setSelectedPlan] = useState("quarterly")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubscribe = async () => {
    if (!session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to subscribe",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    setIsProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast({
      title: "Subscription successful!",
      description: "Your first mood box will ship soon",
    })

    setIsProcessing(false)
    router.push("/account")
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Mood Box Subscription</h1>
        <p className="text-xl text-muted-foreground">
          Get a curated box of mood-enhancing products delivered to your door
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {subscriptionPlans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.popular ? "border-primary shadow-md" : ""}`}>
            {plan.popular && <Badge className="absolute top-4 right-4">Most Popular</Badge>}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                {plan.id === "monthly" && <span className="text-muted-foreground"> /month</span>}
                {plan.id === "quarterly" && <span className="text-muted-foreground"> /quarter</span>}
                {plan.id === "annual" && <span className="text-muted-foreground"> /year</span>}
              </div>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="mb-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={plan.id} id={`plan-${plan.id}`} />
                  <Label htmlFor={`plan-${plan.id}`}>Select</Label>
                </div>
              </RadioGroup>

              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className={`w-full ${selectedPlan === plan.id ? "" : "hidden"}`}
                onClick={handleSubscribe}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Subscribe Now"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="max-w-3xl mx-auto mt-16">
        <h2 className="text-2xl font-bold mb-6">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Choose Your Plan</h3>
            <p className="text-muted-foreground">Select the subscription plan that works best for you</p>
          </div>

          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Set Your Mood Preferences</h3>
            <p className="text-muted-foreground">Tell us which moods you want to enhance in your daily life</p>
          </div>

          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Receive Your Mood Box</h3>
            <p className="text-muted-foreground">Get a curated box of products tailored to your mood preferences</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-16 text-center">
        <div className="bg-muted p-8 rounded-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Satisfaction Guaranteed</h2>
          <p className="text-muted-foreground mb-6">
            If you're not completely satisfied with your Mood Box, we'll make it right or give you a full refund.
          </p>
          <Button variant="outline" onClick={() => router.push("/products")}>
            Explore Individual Products
          </Button>
        </div>
      </div>
    </div>
  )
}

