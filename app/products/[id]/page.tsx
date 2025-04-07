"use client"

import { useEffect, useState, Suspense, useCallback } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Heart, Share2, Star, ArrowLeft, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import EmojiReactions from "@/components/emoji-reactions"
import ProductReviews from "@/components/product-reviews"
import RelatedProducts from "@/components/related-products"
import ProductAR from "@/components/product-ar"
import { useCartStore } from "@/lib/stores/cart-store"
import type { Database } from "@/lib/database.types"

type Product = Database["public"]["Tables"]["products"]["Row"]

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const { addToCart } = useCartStore()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // In a real app, you would have multiple product images
  const productImages = [
    { url: "/placeholder.svg?height=600&width=600", alt: "Product image 1" },
    { url: "/placeholder.svg?height=600&width=600", alt: "Product image 2" },
    { url: "/placeholder.svg?height=600&width=600", alt: "Product image 3" },
  ]

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.id) return

      const { data, error } = await supabase.from("products").select("*").eq("id", params.id).single()

      if (error) {
        console.error("Error fetching product:", error)
        router.push("/products")
      } else {
        setProduct(data)

        // Check if product is in favorites
        if (session) {
          const { data: favoriteData } = await supabase
            .from("user_favorites")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("product_id", data.id)
            .single()

          setIsFavorite(!!favoriteData)
        }
      }

      setLoading(false)
    }

    fetchProduct()
  }, [supabase, params.id, router, session])

  // Memoize the addToCart handler to prevent unnecessary re-renders
  const handleAddToCart = useCallback(async () => {
    if (!session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to your cart",
        variant: "destructive",
      })
      return
    }

    if (!product) return

    // Prevent multiple rapid clicks
    if (isAddingToCart) return

    setIsAddingToCart(true)

    try {
      // Optimistic update - update UI immediately
      addToCart({
        id: crypto.randomUUID(),
        user_id: session.user.id,
        product_id: product.id,
        quantity: quantity,
        created_at: new Date().toISOString(),
        product: product,
      })

      toast({
        title: "Added to cart",
        description: `${product.name} added to your cart`,
      })

      // Check if product is already in cart
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("product_id", product.id)
        .single()

      if (existingItem) {
        // Update quantity
        await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + quantity })
          .eq("id", existingItem.id)
      } else {
        // Add new item
        await supabase.from("cart_items").insert({
          user_id: session.user.id,
          product_id: product.id,
          quantity,
        })
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast({
        title: "Error adding to cart",
        description: "There was an error adding this item to your cart",
        variant: "destructive",
      })
    } finally {
      setIsAddingToCart(false)
    }
  }, [product, quantity, session, supabase, toast, isAddingToCart, addToCart])

  const toggleFavorite = async () => {
    if (!session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to save favorites",
        variant: "destructive",
      })
      return
    }

    if (!product) return

    setIsFavorite(!isFavorite)

    if (isFavorite) {
      // Remove from favorites
      await supabase.from("user_favorites").delete().eq("user_id", session.user.id).eq("product_id", product.id)

      toast({
        title: "Removed from favorites",
        description: `${product.name} removed from your favorites`,
      })
    } else {
      // Add to favorites
      await supabase.from("user_favorites").insert({
        user_id: session.user.id,
        product_id: product.id,
      })

      toast({
        title: "Added to favorites",
        description: `${product.name} added to your favorites`,
      })
    }
  }

  const handleShare = async () => {
    if (!product) return

    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback - copy link to clipboard
      await navigator.clipboard.writeText(window.location.href)

      toast({
        title: "Link copied",
        description: "Product link copied to clipboard",
      })
    }
  }

  const nextImage = () => {
    setActiveImageIndex((activeImageIndex + 1) % productImages.length)
  }

  const prevImage = () => {
    setActiveImageIndex((activeImageIndex - 1 + productImages.length) % productImages.length)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    router.push("/checkout")
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Button className="mt-4" onClick={() => router.push("/products")}>
          Back to Products
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image
              src={productImages[activeImageIndex].url || product.image_url || "/placeholder.svg?height=600&width=600"}
              alt={productImages[activeImageIndex].alt || product.name}
              fill
              className="object-cover"
            />

            {productImages.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                  onClick={prevImage}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                  onClick={nextImage}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <div className="flex gap-2 overflow-auto pb-2">
            {productImages.map((image, index) => (
              <button
                key={index}
                className={`relative w-20 h-20 rounded-md overflow-hidden border-2 ${
                  activeImageIndex === index ? "border-primary" : "border-transparent"
                }`}
                onClick={() => setActiveImageIndex(index)}
              >
                <Image
                  src={image.url || "/placeholder.svg"}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <ProductAR productId={product.id} />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {product.moods.map((mood) => (
                <Badge key={mood} variant="secondary">
                  {mood}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${star <= 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">(24 reviews)</span>
            </div>
            <p className="text-2xl font-semibold mt-2">${product.price.toFixed(2)}</p>

            {product.inventory < 10 && (
              <p className="text-sm text-red-500 mt-1">Only {product.inventory} left in stock - order soon</p>
            )}
          </div>

          <p className="text-muted-foreground">{product.description}</p>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
              -
            </Button>
            <span className="w-12 text-center">{quantity}</span>
            <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
              +
            </Button>
          </div>

          <div className="flex gap-4">
            <Button className="flex-1" size="lg" onClick={handleAddToCart} disabled={isAddingToCart}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>

            <Button variant="secondary" className="flex-1" size="lg" onClick={handleBuyNow} disabled={isAddingToCart}>
              Buy Now
            </Button>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" size="icon" className="h-12 w-12" onClick={toggleFavorite}>
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </Button>

            <Button variant="outline" size="icon" className="h-12 w-12" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <Tabs defaultValue="description" className="pt-6 border-t">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="pt-4">
              <p className="text-sm text-muted-foreground">
                {product.description}
                <br />
                <br />
                This product is perfect for when you're feeling {product.moods.join(", ")}. It's designed to enhance
                your mood and provide the perfect experience.
              </p>
            </TabsContent>
            <TabsContent value="details" className="pt-4">
              <div className="text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Category: {product.category}</li>
                  <li>In Stock: {product.inventory} units</li>
                  <li>Recommended Moods: {product.moods.join(", ")}</li>
                  <li>SKU: {product.id.slice(0, 8).toUpperCase()}</li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="shipping" className="pt-4">
              <div className="text-sm text-muted-foreground">
                <p>Free shipping on orders over $50.</p>
                <p>Standard shipping: 3-5 business days.</p>
                <p>Express shipping: 1-2 business days (additional fee).</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="pt-6 border-t">
            <h3 className="font-semibold text-lg mb-4">How do you feel about this product?</h3>
            <EmojiReactions productId={product.id} />
          </div>
        </div>
      </div>

      <div className="mt-16">
        <ProductReviews productId={product.id} />
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Related Products</h2>
        <Suspense fallback={<div>Loading related products...</div>}>
          <RelatedProducts productId={product.id} moods={product.moods} category={product.category} />
        </Suspense>
      </div>
    </div>
  )
}

