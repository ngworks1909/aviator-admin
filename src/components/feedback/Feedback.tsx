"use client"

import { useEffect, useState } from "react"
import Navbar from "../common/Navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare } from "lucide-react"
import { host } from "@/lib/host"
import { useAuthStore } from "@/store/AuthState"

// Define the feedback type
interface Feedback {
  text: string
}

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const token = useAuthStore().token

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        // Try to fetch from API
        const response = await fetch(`${host}/api/feedback/fetchall`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "authorization": token ?? ""
          },
        }).catch((err) => {
          // This will catch network errors
          console.error("Network error:", err)
          throw new Error("Network error occurred")
        })

        if (!response || !response.ok) {
          throw new Error("Failed to fetch feedback")
        }

        const data = await response.json()
        setFeedbacks(data.feedbacks)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching feedback:", err)
        setError(err as string)

        // Fallback to sample data when API fails
        setLoading(false)

        // Optional: Set a warning instead of an error
        // setError("Using sample data. Couldn't connect to the server.");
      }
    }

    fetchFeedbacks()
  }, [])

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
            <p className="mt-2 text-muted-foreground">View all feedback submitted by our users</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <FeedbackSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
              <p className="text-destructive">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No feedback yet</h3>
              <p className="mt-2 text-muted-foreground">When users submit feedback, it will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {feedbacks.map((feedback, index) => (
                <FeedbackCard key={index} feedback={feedback} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function FeedbackCard({ feedback }: { feedback: Feedback }) {
  return (
    <Card className="h-full overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-6">
        <p className="text-sm text-gray-600 break-words">"{feedback.text}"</p>
      </CardContent>
    </Card>
  )
}

function FeedbackSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
        <Skeleton className="mt-2 h-4 w-1/2" />
      </CardContent>
    </Card>
  )
}
