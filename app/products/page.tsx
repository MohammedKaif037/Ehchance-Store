"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import ProductCard from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Database } from "@/lib/database.types"

type Product = Database["public"]["Tables"]["products"]["Row"]

export default function Products() {
  const searchParams = useSearchParams()
  const moodParam = searchParams.get("mood")
  const { supabase } = useSupabase()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMood, setSelectedMood] = useState<string | null>(moodParam)

  const moods = [
    { emoji: "😴", name: "Tired" },
    { emoji: "🎉", name: "Celebrating" },
    { emoji: "🌱", name: "Chill" },
    { emoji: "😊", name: "Happy" },
    { emoji: "💪", name: "Energetic" },
    { emoji: "🧠", name: "Focused" },
  ]

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)

      let query = supabase.from("products").select("*")

      if (selectedMood) {
        query = query.contains("moods", [selectedMood])
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching products:", error)
      } else {
        setProducts(data || [])
      }

      setLoading(false)
    }

    fetchProducts()
  }, [supabase, selectedMood])

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {selectedMood ? `${selectedMood} Products` : "All Products"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {selectedMood
              ? `Products perfect for when you're feeling ${selectedMood.toLowerCase()}`
              : "Browse our complete collection"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant={!selectedMood ? "default" : "outline"} onClick={() => setSelectedMood(null)} size="sm">
            All
          </Button>
          {moods.map((mood) => (
            <Button
              key={mood.name}
              variant={selectedMood === mood.name ? "default" : "outline"}
              onClick={() => setSelectedMood(mood.name)}
              size="sm"
            >
              {mood.emoji} {mood.name}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No products found</h3>
          <p className="text-muted-foreground mt-1">Try selecting a different mood or browse all products</p>
        </div>
      )}
    </div>
  )
}

