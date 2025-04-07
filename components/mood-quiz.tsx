"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react"
import Image from "next/image"
import type { Database } from "@/lib/database.types"

type Product = Database["public"]["Tables"]["products"]["Row"]

interface MoodQuizProps {
  onMoodDetected?: (mood: string) => void
  showProductRecommendations?: boolean
}

const questions = [
  {
    question: "What would you like to do right now?",
    options: [
      { text: "Take a nap", mood: "Tired", icon: "😴" },
      { text: "Go to a party", mood: "Celebrating", icon: "🎉" },
      { text: "Relax in nature", mood: "Chill", icon: "🌱" },
      { text: "Exercise", mood: "Energetic", icon: "💪" },
      { text: "Read a book", mood: "Focused", icon: "🧠" },
    ],
  },
  {
    question: "What kind of music do you want to listen to?",
    options: [
      { text: "Upbeat and energetic", mood: "Energetic", icon: "💪" },
      { text: "Calm and soothing", mood: "Relaxed", icon: "😌" },
      { text: "Party anthems", mood: "Celebrating", icon: "🎉" },
      { text: "Focus beats", mood: "Focused", icon: "🧠" },
      { text: "Nothing, I need silence", mood: "Tired", icon: "😴" },
    ],
  },
  {
    question: "What's your energy level right now?",
    options: [
      { text: "Very low, I'm exhausted", mood: "Tired", icon: "😴" },
      { text: "Low, but peaceful", mood: "Relaxed", icon: "😌" },
      { text: "Moderate and balanced", mood: "Chill", icon: "🌱" },
      { text: "High, I'm feeling good", mood: "Happy", icon: "😊" },
      { text: "Very high, I'm pumped!", mood: "Energetic", icon: "💪" },
    ],
  },
  {
    question: "What kind of environment are you in?",
    options: [
      { text: "At home relaxing", mood: "Chill", icon: "🌱" },
      { text: "At work or studying", mood: "Focused", icon: "🧠" },
      { text: "Out with friends", mood: "Celebrating", icon: "🎉" },
      { text: "In nature", mood: "Relaxed", icon: "😌" },
      { text: "On the go", mood: "Energetic", icon: "💪" },
    ],
  },
  {
    question: "What would taste good right now?",
    options: [
      { text: "Coffee or energy drink", mood: "Tired", icon: "😴" },
      { text: "Something sweet", mood: "Happy", icon: "😊" },
      { text: "A healthy meal", mood: "Focused", icon: "🧠" },
      { text: "Comfort food", mood: "Chill", icon: "🌱" },
      { text: "Celebration treats", mood: "Celebrating", icon: "🎉" },
    ],
  },
]

export default function MoodQuiz({ onMoodDetected, showProductRecommendations = true }: MoodQuizProps) {
  const router = useRouter()
  const { supabase, session } = useSupabase()
  const { toast } = useToast()

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""))
  const [completed, setCompleted] = useState(false)
  const [detectedMood, setDetectedMood] = useState("")
  const [progress, setProgress] = useState(0)
  const [direction, setDirection] = useState(0) // -1 for backward, 1 for forward
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Update progress bar
  useEffect(() => {
    const calculatedProgress = ((currentQuestion + 1) / questions.length) * 100
    const timer = setTimeout(() => setProgress(calculatedProgress), 100)
    return () => clearTimeout(timer)
  }, [currentQuestion])

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answer
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    setDirection(1)
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      calculateMood()
    }
  }

  const handlePrevious = () => {
    setDirection(-1)
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const calculateMood = async () => {
    // Calculate the most common mood from answers with weighted scoring
    const moodScores: Record<string, number> = {}

    // Initialize all possible moods with a base score
    const allMoods = ["Tired", "Celebrating", "Chill", "Happy", "Energetic", "Focused", "Relaxed"]
    allMoods.forEach((mood) => {
      moodScores[mood] = 0
    })

    // Weight questions differently (later questions might be more important)
    answers.forEach((mood, index) => {
      // Questions near the end have slightly more weight
      const weight = 1 + index * 0.1
      moodScores[mood] = (moodScores[mood] || 0) + weight
    })

    // Find the mood with the highest score
    let maxScore = 0
    let primaryMood = ""
    let secondaryMood = ""
    let secondaryScore = 0

    Object.entries(moodScores).forEach(([mood, score]) => {
      if (score > maxScore) {
        secondaryMood = primaryMood
        secondaryScore = maxScore
        primaryMood = mood
        maxScore = score
      } else if (score > secondaryScore) {
        secondaryMood = mood
        secondaryScore = score
      }
    })

    setDetectedMood(primaryMood)

    // Save quiz results to user profile if logged in
    if (session) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("mood_preferences")
          .eq("id", session.user.id)
          .single()

        const moodPreferences = (profile?.mood_preferences as Record<string, number>) || {}
        moodPreferences[primaryMood] = (moodPreferences[primaryMood] || 0) + 2
        if (secondaryMood) {
          moodPreferences[secondaryMood] = (moodPreferences[secondaryMood] || 0) + 1
        }

        await supabase.from("profiles").update({ mood_preferences: moodPreferences }).eq("id", session.user.id)
      } catch (error) {
        console.error("Error saving mood preferences:", error)
      }
    }

    if (showProductRecommendations) {
      await fetchRecommendedProducts(primaryMood, secondaryMood)
    }

    setCompleted(true)
  }

  const fetchRecommendedProducts = async (primaryMood: string, secondaryMood: string) => {
    setLoadingProducts(true)

    try {
      // First try to get products matching the primary mood
      const { data: primaryProducts } = await supabase
        .from("products")
        .select("*")
        .contains("moods", [primaryMood])
        .limit(3)

      // If we don't have enough products, get some for the secondary mood
      if (!primaryProducts || primaryProducts.length < 3) {
        const { data: secondaryProducts } = await supabase
          .from("products")
          .select("*")
          .contains("moods", [secondaryMood])
          .not("id", "in", `(${primaryProducts?.map((p) => p.id).join(",") || ""})`)
          .limit(3 - (primaryProducts?.length || 0))

        setRecommendedProducts([...(primaryProducts || []), ...(secondaryProducts || [])])
      } else {
        setRecommendedProducts(primaryProducts)
      }
    } catch (error) {
      console.error("Error fetching recommended products:", error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleComplete = () => {
    if (onMoodDetected) {
      onMoodDetected(detectedMood)
    } else {
      router.push(`/products?mood=${detectedMood}`)
    }
  }

  const handleRetake = () => {
    setCurrentQuestion(0)
    setAnswers(Array(questions.length).fill(""))
    setCompleted(false)
    setDetectedMood("")
    setProgress(0)
    setRecommendedProducts([])
  }

  if (completed) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Your Mood Results</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <CheckCircle className="h-12 w-12 text-primary" />
                </motion.div>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="text-3xl font-bold mb-3">You're feeling {detectedMood}</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Based on your answers, we've detected your current mood and selected products that will enhance your{" "}
                {detectedMood.toLowerCase()} state.
              </p>
            </motion.div>

            {showProductRecommendations && (
              <div className="mb-8">
                <h4 className="text-xl font-semibold mb-4">Recommended Products for Your Mood</h4>

                {loadingProducts ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : recommendedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recommendedProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ scale: 1.03 }}
                        className="cursor-pointer"
                        onClick={() => router.push(`/products/${product.id}`)}
                      >
                        <Card className="overflow-hidden h-full">
                          <div className="aspect-square relative">
                            <Image
                              src={product.image_url || "/placeholder.svg?height=200&width=200"}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h5 className="font-medium line-clamp-1">{product.name}</h5>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                            <p className="font-medium mt-2">${product.price.toFixed(2)}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No specific products found for your mood.</p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleComplete} size="lg">
              {onMoodDetected ? "Select This Mood" : "Browse Products for My Mood"}
            </Button>
            <Button variant="outline" onClick={handleRetake} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retake Quiz
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }

  const question = questions[currentQuestion]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{question.question}</CardTitle>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-1 text-sm text-muted-foreground">
              <span>
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: direction * 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -50 }}
              transition={{ duration: 0.3 }}
            >
              <RadioGroup value={answers[currentQuestion]} onValueChange={handleAnswer} className="space-y-3">
                {question.options.map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${
                        answers[currentQuestion] === option.mood ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleAnswer(option.mood)}
                    >
                      <RadioGroupItem value={option.mood} id={`option-${index}`} />
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{option.icon}</span>
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer py-2 font-medium">
                          {option.text}
                        </Label>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </RadioGroup>
            </motion.div>
          </AnimatePresence>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Previous
          </Button>
          <Button onClick={handleNext} disabled={!answers[currentQuestion]} className="gap-2">
            {currentQuestion < questions.length - 1 ? (
              <>
                Next <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              "Complete"
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

