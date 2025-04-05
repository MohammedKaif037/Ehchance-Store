"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowRight, ArrowLeft, CheckCircle } from "lucide-react"

interface MoodQuizProps {
  onMoodDetected: (mood: string) => void
}

const questions = [
  {
    question: "What would you like to do right now?",
    options: [
      { text: "Take a nap", mood: "Tired" },
      { text: "Go to a party", mood: "Celebrating" },
      { text: "Relax in nature", mood: "Chill" },
      { text: "Exercise", mood: "Energetic" },
      { text: "Read a book", mood: "Focused" },
    ],
  },
  {
    question: "What kind of music do you want to listen to?",
    options: [
      { text: "Upbeat and energetic", mood: "Energetic" },
      { text: "Calm and soothing", mood: "Relaxed" },
      { text: "Party anthems", mood: "Celebrating" },
      { text: "Focus beats", mood: "Focused" },
      { text: "Nothing, I need silence", mood: "Tired" },
    ],
  },
  {
    question: "What's your energy level right now?",
    options: [
      { text: "Very low, I'm exhausted", mood: "Tired" },
      { text: "Low, but peaceful", mood: "Relaxed" },
      { text: "Moderate and balanced", mood: "Chill" },
      { text: "High, I'm feeling good", mood: "Happy" },
      { text: "Very high, I'm pumped!", mood: "Energetic" },
    ],
  },
  {
    question: "What kind of environment are you in?",
    options: [
      { text: "At home relaxing", mood: "Chill" },
      { text: "At work or studying", mood: "Focused" },
      { text: "Out with friends", mood: "Celebrating" },
      { text: "In nature", mood: "Relaxed" },
      { text: "On the go", mood: "Energetic" },
    ],
  },
  {
    question: "What would taste good right now?",
    options: [
      { text: "Coffee or energy drink", mood: "Tired" },
      { text: "Something sweet", mood: "Happy" },
      { text: "A healthy meal", mood: "Focused" },
      { text: "Comfort food", mood: "Chill" },
      { text: "Celebration treats", mood: "Celebrating" },
    ],
  },
]

export default function MoodQuiz({ onMoodDetected }: MoodQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""))
  const [completed, setCompleted] = useState(false)
  const [detectedMood, setDetectedMood] = useState("")

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answer
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Calculate the most common mood from answers
      const moodCounts: Record<string, number> = {}
      answers.forEach((mood) => {
        moodCounts[mood] = (moodCounts[mood] || 0) + 1
      })

      let maxCount = 0
      let detectedMood = ""

      Object.entries(moodCounts).forEach(([mood, count]) => {
        if (count > maxCount) {
          maxCount = count
          detectedMood = mood
        }
      })

      setDetectedMood(detectedMood)
      setCompleted(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleComplete = () => {
    onMoodDetected(detectedMood)
  }

  if (completed) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Your Mood Results</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2">You're feeling {detectedMood}</h3>
          <p className="text-muted-foreground mb-6">Based on your answers, we've detected your current mood.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleComplete} className="w-full">
            Show Me Products for My Mood
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{question.question}</CardTitle>
        <div className="w-full bg-muted rounded-full h-2 mt-4">
          <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="text-sm text-muted-foreground text-right mt-1">
          Question {currentQuestion + 1} of {questions.length}
        </div>
      </CardHeader>
      <CardContent>
        <RadioGroup value={answers[currentQuestion]} onValueChange={handleAnswer} className="space-y-3">
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={option.mood} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer py-2">
                {option.text}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button onClick={handleNext} disabled={!answers[currentQuestion]}>
          {currentQuestion < questions.length - 1 ? (
            <>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            "Complete"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

