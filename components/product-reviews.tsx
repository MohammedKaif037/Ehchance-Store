"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Star, ThumbsUp } from "lucide-react"

interface ProductReviewsProps {
  productId: string
}

type Review = {
  id: string
  user_id: string
  product_id: string
  rating: number
  comment: string
  created_at: string
  helpful_count: number
  user: {
    full_name: string
    avatar_url: string
  }
  user_moods: string[]
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()

  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [newReview, setNewReview] = useState("")
  const [rating, setRating] = useState(5)
  const [submitting, setSubmitting] = useState(false)
  const [helpfulReviews, setHelpfulReviews] = useState<string[]>([])

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from("product_reviews")
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .eq("product_id", productId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching reviews:", error)
      } else {
        // Add user moods (in a real app, this would be from the database)
        const reviewsWithMoods = data.map((review) => ({
          ...review,
          user_moods: ["Happy", "Energetic", "Relaxed"]
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.floor(Math.random() * 3) + 1),
        }))

        setReviews(reviewsWithMoods)
      }

      // Fetch helpful reviews marked by the user
      if (session) {
        const { data: helpfulData } = await supabase
          .from("helpful_reviews")
          .select("review_id")
          .eq("user_id", session.user.id)

        if (helpfulData) {
          setHelpfulReviews(helpfulData.map((item) => item.review_id))
        }
      }

      setLoading(false)
    }

    fetchReviews()
  }, [supabase, productId, session])

  const submitReview = async () => {
    if (!session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to leave a review",
        variant: "destructive",
      })
      return
    }

    if (!newReview.trim()) {
      toast({
        title: "Review required",
        description: "Please enter a review comment",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    const { error } = await supabase.from("product_reviews").insert({
      user_id: session.user.id,
      product_id: productId,
      rating,
      comment: newReview,
      helpful_count: 0,
    })

    if (error) {
      toast({
        title: "Error submitting review",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      })

      // Refresh reviews
      const { data: newReviewData } = await supabase
        .from("product_reviews")
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .eq("product_id", productId)
        .eq("user_id", session.user.id)
        .single()

      if (newReviewData) {
        const reviewWithMoods = {
          ...newReviewData,
          user_moods: ["Happy", "Energetic"].sort(() => 0.5 - Math.random()).slice(0, 1),
        }

        setReviews([reviewWithMoods, ...reviews])
        setNewReview("")
        setRating(5)
      }
    }

    setSubmitting(false)
  }

  const markHelpful = async (reviewId: string) => {
    if (!session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to mark reviews as helpful",
        variant: "destructive",
      })
      return
    }

    const isAlreadyHelpful = helpfulReviews.includes(reviewId)

    if (isAlreadyHelpful) {
      // Remove helpful mark
      await supabase.from("helpful_reviews").delete().eq("user_id", session.user.id).eq("review_id", reviewId)

      // Update review count
      await supabase.rpc("decrement_helpful_count", {
        review_id: reviewId,
      })

      setHelpfulReviews(helpfulReviews.filter((id) => id !== reviewId))

      // Update local state
      setReviews(
        reviews.map((review) =>
          review.id === reviewId ? { ...review, helpful_count: review.helpful_count - 1 } : review,
        ),
      )
    } else {
      // Add helpful mark
      await supabase.from("helpful_reviews").insert({
        user_id: session.user.id,
        review_id: reviewId,
      })

      // Update review count
      await supabase.rpc("increment_helpful_count", {
        review_id: reviewId,
      })

      setHelpfulReviews([...helpfulReviews, reviewId])

      // Update local state
      setReviews(
        reviews.map((review) =>
          review.id === reviewId ? { ...review, helpful_count: review.helpful_count + 1 } : review,
        ),
      )
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

      {session && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Your Rating</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                      <Star
                        className={`h-6 w-6 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Your Review</div>
                <Textarea
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                />
              </div>

              <Button onClick={submitReview} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/4 bg-muted rounded" />
                    <div className="h-3 w-1/5 bg-muted rounded" />
                    <div className="h-3 w-full bg-muted rounded mt-4" />
                    <div className="h-3 w-full bg-muted rounded" />
                    <div className="h-3 w-2/3 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex flex-col items-center md:items-start gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.user.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback>{review.user.full_name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm font-medium">{review.user.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {review.user_moods.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-xs text-muted-foreground">Mood when using:</span>
                        {review.user_moods.map((mood) => (
                          <span key={mood} className="text-xs px-2 py-0.5 bg-muted rounded-full">
                            {mood}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-sm mb-4">{review.comment}</p>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => markHelpful(review.id)}
                      >
                        <ThumbsUp
                          className={`h-3.5 w-3.5 ${
                            helpfulReviews.includes(review.id) ? "fill-primary text-primary" : ""
                          }`}
                        />
                        Helpful ({review.helpful_count})
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

