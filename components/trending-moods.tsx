"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface TrendingMoodsProps {
  onMoodSelect: (mood: string) => void
}

type TrendingMood = {
  mood: string
  count: number
  emoji: string
}

export default function TrendingMoods({ onMoodSelect }: TrendingMoodsProps) {
  const { supabase } = useSupabase()
  const [trendingMoods, setTrendingMoods] = useState<TrendingMood[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchTrendingMoods = async () => {
      setLoading(true)

      // This would typically be a database query to get trending moods
      // For demo purposes, we'll simulate it with a timeout
      setTimeout(async () => {
        // In a real app, you'd query your database for trending moods
        // For example:
        // const { data } = await supabase.rpc('get_trending_moods')

        // Simulated data
        const simulatedTrendingMoods = [
          { mood: "Energetic", count: 128, emoji: "💪" },
          { mood: "Chill", count: 96, emoji: "🌱" },
          { mood: "Happy", count: 84, emoji: "😊" },
        ]

        setTrendingMoods(simulatedTrendingMoods)
        setLoading(false)
      }, 1000)
    }

    fetchTrendingMoods()
  }, [supabase])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Moods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Moods
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {trendingMoods.map((mood) => (
            <Button key={mood.mood} variant="outline" className="gap-2" onClick={() => onMoodSelect(mood.mood)}>
              <span>{mood.emoji}</span>
              <span>{mood.mood}</span>
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{mood.count}</span>
            </Button>
          ))}

          <Button variant="secondary" className="gap-2" onClick={() => router.push("/mood-quiz")}>
            <span>Take Mood Quiz</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

