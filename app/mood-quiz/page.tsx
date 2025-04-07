"use client"
import { useRouter } from "next/navigation"
import MoodQuiz from "@/components/mood-quiz"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function MoodQuizPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Mood Quiz</h1>
      </div>

      <div className="max-w-3xl mx-auto text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Discover Your Current Mood</h2>
        <p className="text-xl text-muted-foreground">
          Answer a few questions to help us understand how you're feeling and recommend the perfect products for your
          mood.
        </p>
      </div>

      <MoodQuiz showProductRecommendations={true} />
    </div>
  )
}

