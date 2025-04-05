"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Music, Play, Pause, SkipForward, Volume2 } from "lucide-react"

const moodPlaylists = {
  Energetic: [
    { title: "Power Up", artist: "Energy Beats", duration: 180 },
    { title: "Morning Rush", artist: "Workout Kings", duration: 210 },
    { title: "Momentum", artist: "Fitness Flow", duration: 195 },
  ],
  Chill: [
    { title: "Gentle Waves", artist: "Ocean Sounds", duration: 240 },
    { title: "Forest Morning", artist: "Nature Vibes", duration: 220 },
    { title: "Calm Mind", artist: "Meditation Masters", duration: 300 },
  ],
  Happy: [
    { title: "Sunny Day", artist: "Smile Brigade", duration: 180 },
    { title: "Good Times", artist: "Happy Tunes", duration: 195 },
    { title: "Celebration", artist: "Joy Division", duration: 210 },
  ],
  Tired: [
    { title: "Soft Lullaby", artist: "Sleep Well", duration: 240 },
    { title: "Dream State", artist: "Night Owls", duration: 260 },
    { title: "Gentle Rain", artist: "Ambient Sounds", duration: 300 },
  ],
  Focused: [
    { title: "Deep Work", artist: "Concentration", duration: 240 },
    { title: "Flow State", artist: "Study Beats", duration: 280 },
    { title: "Mind Clear", artist: "Focus Group", duration: 260 },
  ],
}

export default function MoodMusic() {
  const [currentMood, setCurrentMood] = useState<string>("Chill")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [volume, setVolume] = useState(80)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const playlist = moodPlaylists[currentMood as keyof typeof moodPlaylists] || moodPlaylists.Chill
  const currentSong = playlist[currentTrack]

  useEffect(() => {
    // In a real app, this would be an actual audio file
    // For demo purposes, we're just simulating playback
    if (isPlaying) {
      setDuration(currentSong.duration)
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= currentSong.duration) {
            // Move to next track when current one finishes
            handleNext()
            return 0
          }
          return prev + 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, currentSong])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleNext = () => {
    setCurrentTrack((currentTrack + 1) % playlist.length)
    setProgress(0)
  }

  const handleMoodChange = (mood: string) => {
    setCurrentMood(mood)
    setCurrentTrack(0)
    setProgress(0)
    if (isPlaying) {
      // Keep playing when changing moods
      setIsPlaying(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Mood Music
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.keys(moodPlaylists).map((mood) => (
              <Button
                key={mood}
                variant={currentMood === mood ? "default" : "outline"}
                size="sm"
                onClick={() => handleMoodChange(mood)}
              >
                {mood} Music
              </Button>
            ))}
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-medium">{currentSong.title}</h3>
                <p className="text-sm text-muted-foreground">{currentSong.artist}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatTime(progress)} / {formatTime(duration)}
              </div>
            </div>

            <Slider
              value={[progress]}
              max={duration}
              step={1}
              className="mb-4"
              onValueChange={(value) => setProgress(value[0])}
            />

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePlayPause}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}>
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[volume]}
                  max={100}
                  step={1}
                  className="w-24"
                  onValueChange={(value) => setVolume(value[0])}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

