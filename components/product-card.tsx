"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Heart, Share2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Database } from "@/lib/database.types"

type Product = Database["public"]["Tables"]["products"]["Row"]

export default function ProductCard({ product }: { product: Product }) {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to your cart",
        variant: "destructive",
      })
      return
    }

    setIsAddingToCart(true)

    // Check if product is already in cart
    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("product_id", product.id)
      .single()

    if (existingItem) {
      // Update quantity
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + 1 })
        .eq("id", existingItem.id)

      if (error) {
        toast({
          title: "Error updating cart",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Cart updated",
          description: `${product.name} quantity increased`,
        })
      }
    } else {
      // Add new item
      const { error } = await supabase.from("cart_items").insert({
        user_id: session.user.id,
        product_id: product.id,
        quantity: 1,
      })

      if (error) {
        toast({
          title: "Error adding to cart",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Added to cart",
          description: `${product.name} added to your cart`,
        })
      }
    }

    setIsAddingToCart(false)
  }

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to save favorites",
        variant: "destructive",
      })
      return
    }

    setIsFavorite(!isFavorite)

    // In a real app, you would save this to the database
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: isFavorite
        ? `${product.name} removed from your favorites`
        : `${product.name} added to your favorites`,
    })
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: `/products/${product.id}`,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback - copy link to clipboard
      const url = `${window.location.origin}/products/${product.id}`
      await navigator.clipboard.writeText(url)

      toast({
        title: "Link copied",
        description: "Product link copied to clipboard",
      })
    }
  }

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow group">
        <div className="aspect-square relative overflow-hidden">
          <Image
            src={product.image_url || "/placeholder.svg?height=300&width=300"}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 flex flex-col gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                    onClick={toggleFavorite}
                  >
                    <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share product</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-1 mb-2">
            {product.moods.map((mood) => (
              <Badge key={mood} variant="secondary" className="text-xs">
                {mood}
              </Badge>
            ))}
          </div>
          <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mt-1">{product.description}</p>
          <div className="flex justify-between items-center mt-2">
            <p className="font-medium text-lg">${product.price.toFixed(2)}</p>
            {product.inventory < 10 && (
              <Badge variant="outline" className="text-xs">
                Only {product.inventory} left
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button className="w-full" onClick={handleAddToCart} disabled={isAddingToCart}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}

