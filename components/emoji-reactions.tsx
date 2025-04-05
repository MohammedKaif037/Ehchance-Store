"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"

type Reaction = {
  emoji: string
  count: number
  userReacted: boolean
}

const emojis = [
  { emoji: "❤️", label: "Love" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "😍", label: "Heart Eyes" },
  { emoji: "👍", label: "Thumbs Up" },
  { emoji: "🤯", label: "Mind Blown" },
]

export default function EmojiReactions({ productId }: { productId: string }) {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReactions = async () => {
      setLoading(true)

      // Get all reaction counts
      const { data: reactionCounts, error: reactionsError } = await supabase
        .from("product_reactions")
        .select("*")
        .eq("product_id", productId)

      if (reactionsError) {
        console.error("Error fetching reactions:", reactionsError)
        return
      }

      // Get user reactions if logged in
      let userReactions: any[] = []
      if (session?.user) {
        const { data: userReactionsData, error: userReactionsError } = await supabase
          .from("user_reactions")
          .select("*")
          .eq("product_id", productId)
          .eq("user_id", session.user.id)

        if (!userReactionsError) {
          userReactions = userReactionsData || []
        }
      }

      // Format reactions
      const formattedReactions = emojis.map(({ emoji }) => {
        const reactionData = reactionCounts?.find((r) => r.emoji === emoji)
        const userReacted = userReactions.some((r) => r.emoji === emoji)

        return {
          emoji,
          count: reactionData?.count || 0,
          userReacted,
        }
      })

      setReactions(formattedReactions)
      setLoading(false)
    }

    fetchReactions()

    // Set up realtime subscription
    const channel = supabase
      .channel(`product-reactions-${productId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "product_reactions",
          filter: `product_id=eq.${productId}`,
        },
        () => {
          fetchReactions()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, productId, session])

  const handleReaction = async (emoji: string) => {
    if (!session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to react to products",
        variant: "destructive",
      })
      return
    }

    const reaction = reactions.find((r) => r.emoji === emoji)
    if (!reaction) return

    // Toggle user reaction
    if (reaction.userReacted) {
      // Remove user reaction
      await supabase
        .from("user_reactions")
        .delete()
        .eq("user_id", session.user.id)
        .eq("product_id", productId)
        .eq("emoji", emoji)

      // Decrement count
      await supabase
        .from("product_reactions")
        .update({ count: Math.max(0, reaction.count - 1) })
        .eq("product_id", productId)
        .eq("emoji", emoji)
    } else {
      // Add user reaction
      await supabase.from("user_reactions").insert({
        user_id: session.user.id,
        product_id: productId,
        emoji,
      })

      // Check if reaction exists
      const { data } = await supabase
        .from("product_reactions")
        .select("*")
        .eq("product_id", productId)
        .eq("emoji", emoji)
        .single()

      if (data) {
        // Increment count
        await supabase
          .from("product_reactions")
          .update({ count: reaction.count + 1 })
          .eq("product_id", productId)
          .eq("emoji", emoji)
      } else {
        // Create new reaction
        await supabase.from("product_reactions").insert({
          product_id: productId,
          emoji,
          count: 1,
        })
      }
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {reactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          variant={reaction.userReacted ? "default" : "outline"}
          className="relative"
          onClick={() => handleReaction(reaction.emoji)}
        >
          <span className="mr-1">{reaction.emoji}</span>
          <AnimatePresence>
            {reaction.count > 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-sm"
              >
                {reaction.count}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      ))}

      <div className="w-full mt-2 text-sm text-muted-foreground">
        {reactions.some((r) => r.count > 0) && (
          <p>{reactions.reduce((total, r) => total + r.count, 0)} people reacted to this product</p>
        )}
      </div>
    </div>
  )
}

