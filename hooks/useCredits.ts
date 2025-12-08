"use client"

import * as React from "react"
import { useAuth } from "@/components/AuthContext"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

type UseCreditsResult = {
  credits: number | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useCredits(): UseCreditsResult {
  const auth = useAuth()
  const userId = auth?.userId || null
  const email = auth?.email || null
  const authLoading = auth?.loading || false

  const [credits, setCredits] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchCredits = React.useCallback(async () => {
    if (!userId) {
      setCredits(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ user_id: userId })
      if (email) params.set("email", email)

      const res = await fetch(`${API_BASE}/me/credits?${params.toString()}`)
      const json = await res.json()

      if (!res.ok || json.error) {
        throw new Error(json.error || res.statusText)
      }

      setCredits(typeof json.credits === "number" ? json.credits : 0)
    } catch (err: any) {
      console.error("useCredits fetch error:", err)
      setError(err?.message || "Could not load credits.")
    } finally {
      setLoading(false)
    }
  }, [userId, email])

  React.useEffect(() => {
    if (authLoading) return
    if (!userId) {
      setCredits(null)
      return
    }
    fetchCredits()
  }, [authLoading, userId, fetchCredits])

  return {
    credits,
    loading,
    error,
    refresh: fetchCredits,
  }
}
