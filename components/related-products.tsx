"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import ProductCard from "@/components/product-card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Database } from "@/lib/database.types"

type Product = Database["public"]["Tables"]["products"]["Row"]

interface RelatedProductsProps {
  productId: string
  moods: string[]
  category: string
}

export default function RelatedProducts({ productId, moods, category }: RelatedProductsProps) {
  const { supabase } = useSupabase()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      setLoading(true)

      // First try to get products in the same category
      const { data: categoryProducts, error: categoryError } = await supabase
        .from("products")
        .select("*")
        .eq("category", category)
        .neq("id", productId)
        .limit(4)

      if (categoryError || !categoryProducts || categoryProducts.length < 4) {
        // If not enough category products, get products with similar moods
        const { data: moodProducts, error: moodError } = await supabase
          .from("products")
          .select("*")
          .contains("moods", moods)
          .neq("id", productId)
          .limit(4)

        if (!moodError && moodProducts) {
          // Combine unique products from both queries
          const allProducts = [...(categoryProducts || []), ...moodProducts]
          const uniqueProducts = allProducts.filter(
            (product, index, self) => index === self.findIndex((p) => p.id === product.id),
          )

          setProducts(uniqueProducts.slice(0, 4))
        }
      } else {
        setProducts(categoryProducts)
      }

      setLoading(false)
    }

    fetchRelatedProducts()
  }, [supabase, productId, category, moods])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

