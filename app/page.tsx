"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Camera, RefreshCw } from "lucide-react"
import MoodCamera from "@/components/mood-camera"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MoodQuiz from "@/components/mood-quiz"
import MoodMusic from "@/components/mood-music"
import TrendingMoods from "@/components/trending-moods"

const moods = [
  { emoji: "😴", name: "Tired", color: "bg-blue-100" },
  { emoji: "🎉", name: "Celebrating", color: "bg-pink-100" },
  { emoji: "🌱", name: "Chill", color: "bg-green-100" },
  { emoji: "😊", name: "Happy", color: "bg-yellow-100" },
  { emoji: "💪", name: "Energetic", color: "bg-orange-100" },
  { emoji: "🧠", name: "Focused", color: "bg-purple-100" },
  { emoji: "😌", name: "Relaxed", color: "bg-teal-100" },
  { emoji: "🤔", name: "Curious", color: "bg-indigo-100" },
]

export default function Home() {
  const router = useRouter()
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [isAnalyzingMood, setIsAnalyzingMood] = useState(false)
  const [recentMoods, setRecentMoods] = useState<{ name: string; count: number }[]>([])
  const [activeTab, setActiveTab] = useState("picker")

  useEffect(() => {
    // Fetch user's recent moods if logged in
    const fetchRecentMoods = async () => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("mood_preferences")
          .eq("id", session.user.id)
          .single()

        if (profile?.mood_preferences) {
          const moodPrefs = profile.mood_preferences as Record<string, number>
          const sortedMoods = Object.entries(moodPrefs)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)

          setRecentMoods(sortedMoods)
        }
      }
    }

    fetchRecentMoods()
  }, [supabase, session])

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood)
    setIsAnimating(true)

    // If user is logged in, save their mood preference
    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("mood_preferences")
        .eq("id", session.user.id)
        .single()

      const moodPreferences = (profile?.mood_preferences as Record<string, number>) || {}
      moodPreferences[mood] = (moodPreferences[mood] || 0) + 1

      await supabase.from("profiles").update({ mood_preferences: moodPreferences }).eq("id", session.user.id)
    }

    // Redirect after animation completes
    setTimeout(() => {
      router.push(`/products?mood=${mood}`)
    }, 1000)
  }

  const handleMoodDetection = async (imageData: string) => {
    setIsAnalyzingMood(true)

    try {
      // Call the mood detection API
      const response = await fetch("/api/detect-mood", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageData }),
      })

      if (!response.ok) {
        throw new Error("Failed to detect mood")
      }

      const { mood } = await response.json()

      // Find the closest mood in our list
      const detectedMood = moods.find((m) => m.name.toLowerCase() === mood.toLowerCase()) || moods[0]

      toast({
        title: "Mood Detected!",
        description: `We detected you're feeling ${detectedMood.name}`,
      })

      // Select the detected mood
      handleMoodSelect(detectedMood.name)
    } catch (error) {
      console.error("Error detecting mood:", error)
      toast({
        title: "Mood Detection Failed",
        description: "We couldn't detect your mood. Please select manually.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzingMood(false)
      setShowCamera(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">How are you feeling today?</h1>
        <p className="text-xl text-muted-foreground">Select your mood and we'll recommend products just for you</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto mb-8">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="picker">Mood Picker</TabsTrigger>
          <TabsTrigger value="camera">Mood Detection</TabsTrigger>
          <TabsTrigger value="quiz">Mood Quiz</TabsTrigger>
        </TabsList>

        <TabsContent value="picker" className="mt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {moods.map((mood) => (
              <Card
                key={mood.name}
                className={`${mood.color} border-2 hover:border-primary cursor-pointer transition-all ${
                  selectedMood === mood.name ? "border-primary ring-2 ring-primary ring-opacity-50" : ""
                }`}
                onClick={() => handleMoodSelect(mood.name)}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                  <motion.div
                    className="text-6xl mb-4"
                    animate={
                      selectedMood === mood.name && isAnimating ? { scale: [1, 1.5, 1], rotate: [0, 10, -10, 0] } : {}
                    }
                    transition={{ duration: 0.5 }}
                  >
                    {mood.emoji}
                  </motion.div>
                  <h3 className="text-xl font-semibold">{mood.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="camera" className="mt-0">
          <div className="max-w-md mx-auto">
            {showCamera ? (
              <MoodCamera
                onCapture={handleMoodDetection}
                onCancel={() => setShowCamera(false)}
                isAnalyzing={isAnalyzingMood}
              />
            ) : (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Camera className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">AI Mood Detection</h3>
                  <p className="text-muted-foreground mb-4">Let our AI detect your mood from your expression</p>
                  <Button onClick={() => setShowCamera(true)} className="w-full">
                    Start Camera
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quiz" className="mt-0">
          <MoodQuiz onMoodDetected={handleMoodSelect} />
        </TabsContent>
      </Tabs>

      {session && recentMoods.length > 0 && (
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-xl font-semibold mb-4">Your Recent Moods</h2>
          <div className="flex flex-wrap gap-2">
            {recentMoods.map((mood) => {
              const moodInfo = moods.find((m) => m.name === mood.name)
              return (
                <Button key={mood.name} variant="outline" className="gap-2" onClick={() => handleMoodSelect(mood.name)}>
                  <span>{moodInfo?.emoji}</span>
                  <span>{mood.name}</span>
                </Button>
              )
            })}
            <Button variant="ghost" size="icon" title="Refresh recent moods">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto mt-12">
        <TrendingMoods onMoodSelect={handleMoodSelect} />
      </div>

      <div className="max-w-4xl mx-auto mt-12">
        <MoodMusic />
      </div>

      <div className="mt-12 text-center">
        <Button variant="outline" size="lg" onClick={() => router.push("/products")}>
          Browse All Products
        </Button>
      </div>
    </div>
  )
}

