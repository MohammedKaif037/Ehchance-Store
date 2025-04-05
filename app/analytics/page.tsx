"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, BarChart, PieChart } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type MoodData = {
  mood: string
  count: number
  color: string
}

type TimeData = {
  date: string
  mood: string
  count: number
}

export default function Analytics() {
  const { supabase, session } = useSupabase()
  const [moodData, setMoodData] = useState<MoodData[]>([])
  const [timeData, setTimeData] = useState<TimeData[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const moodColors = {
    Happy: "#FFD700",
    Tired: "#6495ED",
    Energetic: "#FF7F50",
    Chill: "#90EE90",
    Focused: "#9370DB",
    Celebrating: "#FF69B4",
    Relaxed: "#20B2AA",
    Curious: "#BA55D3",
  }

  useEffect(() => {
    const fetchMoodData = async () => {
      if (!session) {
        setLoading(false)
        return
      }

      setLoading(true)

      // In a real app, this would be a database query
      // For demo purposes, we'll simulate it

      // Simulate mood distribution data
      const simulatedMoodData: MoodData[] = [
        { mood: "Happy", count: 12, color: moodColors["Happy"] },
        { mood: "Energetic", count: 8, color: moodColors["Energetic"] },
        { mood: "Chill", count: 15, color: moodColors["Chill"] },
        { mood: "Focused", count: 10, color: moodColors["Focused"] },
        { mood: "Tired", count: 5, color: moodColors["Tired"] },
      ]

      // Simulate time-based mood data
      const simulatedTimeData: TimeData[] = []
      const today = new Date()

      for (let i = 30; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split("T")[0]

        // Add 1-3 mood entries for each day
        const entryCount = Math.floor(Math.random() * 3) + 1

        for (let j = 0; j < entryCount; j++) {
          const moodIndex = Math.floor(Math.random() * simulatedMoodData.length)
          simulatedTimeData.push({
            date: dateStr,
            mood: simulatedMoodData[moodIndex].mood,
            count: 1,
          })
        }
      }

      setMoodData(simulatedMoodData)
      setTimeData(simulatedTimeData)
      setLoading(false)
    }

    fetchMoodData()
  }, [supabase, session])

  // Group time data by date for the line chart
  const groupedTimeData = timeData.reduce(
    (acc, item) => {
      const date = item.date
      if (!acc[date]) {
        acc[date] = {}
      }
      if (!acc[date][item.mood]) {
        acc[date][item.mood] = 0
      }
      acc[date][item.mood] += item.count
      return acc
    },
    {} as Record<string, Record<string, number>>,
  )

  // Convert grouped data to chart format
  const chartData = Object.entries(groupedTimeData)
    .map(([date, moods]) => {
      return {
        date,
        ...moods,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Your Mood Analytics</h1>
        <p className="mb-6">Please sign in to view your mood analytics</p>
        <Button onClick={() => router.push("/login")}>Sign In</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Your Mood Analytics</h1>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mood Distribution</CardTitle>
                <CardDescription>Your most common moods over the past 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="relative h-64 w-64">
                      {/* This would be a real chart in a production app */}
                      <div className="absolute inset-0 rounded-full border-8 border-muted"></div>
                      {moodData.map((item, index) => {
                        const total = moodData.reduce((sum, i) => sum + i.count, 0)
                        const percentage = (item.count / total) * 100
                        return (
                          <div
                            key={item.mood}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
                            style={{
                              color: item.color,
                              transform: `translate(-50%, -50%) rotate(${index * 72}deg) translateY(-80px) rotate(-${index * 72}deg)`,
                            }}
                          >
                            <div className="font-bold text-lg">{item.mood}</div>
                            <div className="text-sm">{percentage.toFixed(0)}%</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mood Insights</CardTitle>
                <CardDescription>Key insights based on your mood patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-1">Primary Mood</h3>
                    <p className="text-sm text-muted-foreground">
                      Your most common mood is <span className="font-medium">Chill</span>, which appears in 35% of your
                      mood entries.
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-1">Weekly Pattern</h3>
                    <p className="text-sm text-muted-foreground">
                      You tend to feel more <span className="font-medium">Energetic</span> on weekends and more{" "}
                      <span className="font-medium">Focused</span> during weekdays.
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-1">Mood Improvement</h3>
                    <p className="text-sm text-muted-foreground">
                      Products in the <span className="font-medium">Relaxation</span> category have improved your mood
                      the most.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Mood Calendar</CardTitle>
              <CardDescription>Your daily mood entries over the past 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const date = new Date()
                    date.setDate(date.getDate() - 29 + i)
                    const dateStr = date.toISOString().split("T")[0]
                    const dayMoods = timeData.filter((item) => item.date === dateStr)
                    const mainMood = dayMoods.length > 0 ? dayMoods[0].mood : null

                    return (
                      <div
                        key={i}
                        className="aspect-square rounded-md flex items-center justify-center text-xs"
                        style={{
                          backgroundColor: mainMood
                            ? moodColors[mainMood as keyof typeof moodColors] + "40"
                            : "transparent",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div className="text-center">
                          <div>{date.getDate()}</div>
                          {mainMood && <div className="font-medium mt-1">{mainMood}</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mood Trends</CardTitle>
              <CardDescription>How your moods have changed over time</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="h-[300px] relative">
                  {/* This would be a real chart in a production app */}
                  <div className="absolute inset-x-0 bottom-0 border-t border-muted"></div>
                  <div className="absolute inset-y-0 left-0 border-r border-muted"></div>

                  {chartData.map((item, index) => {
                    const x = (index / (chartData.length - 1)) * 100
                    return (
                      <div
                        key={item.date}
                        className="absolute bottom-0 w-1 bg-primary"
                        style={{
                          left: `${x}%`,
                          height: `${Math.random() * 200 + 50}px`,
                        }}
                      ></div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mood by Day of Week</CardTitle>
                <CardDescription>How your mood varies throughout the week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                    <div key={day} className="flex items-center gap-2">
                      <div className="w-20 font-medium text-sm">{day}</div>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.random() * 100}%`,
                            backgroundColor:
                              Object.values(moodColors)[Math.floor(Math.random() * Object.values(moodColors).length)],
                          }}
                        ></div>
                      </div>
                      <div className="w-20 text-sm text-right">
                        {Object.keys(moodColors)[Math.floor(Math.random() * Object.keys(moodColors).length)]}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mood Transitions</CardTitle>
                <CardDescription>How your mood changes from one to another</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>Mood transition visualization would appear here</p>
                    <p className="text-sm mt-2">Shows how your mood typically changes throughout the day and week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Impact on Mood</CardTitle>
              <CardDescription>How different products affect your mood</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["Relaxation", "Energy", "Focus", "Happiness", "Sleep"].map((category) => (
                  <div key={category} className="space-y-2">
                    <h3 className="font-medium">{category} Products</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.random() * 80 + 20}%`,
                            backgroundColor:
                              Object.values(moodColors)[Math.floor(Math.random() * Object.values(moodColors).length)],
                          }}
                        ></div>
                      </div>
                      <div className="w-16 text-sm text-right">{Math.floor(Math.random() * 5) + 1}/5</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Products for Your Mood</CardTitle>
                <CardDescription>Products that best match your mood patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    "Chill Herbal Tea",
                    "Energy Boost Supplement",
                    "Focus Essential Oil",
                    "Happy Light Therapy",
                    "Sleep Aid Pillow Spray",
                  ].map((product) => (
                    <div key={product} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
                      <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                        {product.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{product}</div>
                        <div className="text-xs text-muted-foreground">
                          Matches your{" "}
                          {Object.keys(moodColors)[Math.floor(Math.random() * Object.keys(moodColors).length)]} mood
                        </div>
                      </div>
                      <div className="ml-auto">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mood Improvement Suggestions</CardTitle>
                <CardDescription>Recommendations to enhance your mood</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-1">Morning Routine</h3>
                    <p className="text-sm text-muted-foreground">
                      Try our Energy Boost products in the morning to start your day with more energy.
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-1">Midday Slump</h3>
                    <p className="text-sm text-muted-foreground">
                      Combat afternoon tiredness with our Focus products around 2-3 PM.
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-1">Evening Relaxation</h3>
                    <p className="text-sm text-muted-foreground">
                      Use our Chill collection in the evening to wind down and prepare for sleep.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

