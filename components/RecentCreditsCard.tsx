"use client"

import * as React from "react"
import { useAuth } from "@/components/AuthContext"

type Status = "checking-auth" | "no-user" | "loading" | "ready" | "error"

type Profile = {
  credits?: number
  email?: string | null
  [key: string]: any
}

type Purchase = {
  id: string
  credits_purchased: number
  status: string
  created_at: string
}

type ProfileResponse = {
  profile?: Profile
  recent_purchases?: Purchase[]
  error?: string
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

export function RecentCreditsCard() {
  const auth = useAuth()
  const userId = auth?.userId || null
  const email = auth?.email || null
  const authLoading = auth?.loading || false

  const [status, setStatus] = React.useState<Status>("checking-auth")
  const [credits, setCredits] = React.useState<number | null>(null)
  const [purchases, setPurchases] = React.useState<Purchase[]>([])
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (authLoading) return

    if (!userId) {
      setStatus("no-user")
      return
    }

    const fetchProfile = async () => {
      try {
        setStatus("loading")
        setErrorMessage(null)

        const params = new URLSearchParams({ user_id: userId })
        if (email) params.set("email", email)

        const url = `${API_BASE}/me/profile?${params.toString()}`
        const res = await fetch(url)
        const json: ProfileResponse = await res.json()

        if (!res.ok || json.error) {
          throw new Error(json.error || res.statusText)
        }

        const profileCredits = json.profile?.credits ?? 0
        setCredits(profileCredits)
        setPurchases(json.recent_purchases || [])
        setStatus("ready")
      } catch (e: any) {
        console.error("RecentCreditsCard fetch error:", e)
        setErrorMessage(
          e?.message || "Could not load your credits right now."
        )
        setStatus("error")
      }
    }

    fetchProfile()
  }, [authLoading, userId, email])

  if (status === "checking-auth" || status === "loading") {
    return (
      <div style={cardStyle}>
        <p style={labelStyle}>Credits</p>
        <p style={bigNumberStyle}>…</p>
        <p style={mutedTextStyle}>Loading your balance…</p>
      </div>
    )
  }

  if (status === "no-user" || !userId) {
    return (
      <div style={cardStyle}>
        <p style={labelStyle}>Credits</p>
        <p style={bigNumberStyle}>0</p>
        <p style={mutedTextStyle}>
          Sign in to see your credit balance and history.
        </p>
        <a href="/buy-credits" style={primaryLinkButton}>
          Buy credits
        </a>
      </div>
    )
  }

  const lastPurchase = purchases[0]

  const lowBalance = (credits ?? 0) > 0 && (credits ?? 0) < 5

  return (
    <div style={cardStyle}>
      <div style={headerRowStyle}>
        <p style={labelStyle}>Credits</p>
        <a href="/buy-credits" style={tinyLinkStyle}>
          Buy more
        </a>
      </div>

      <p style={bigNumberStyle}>{credits ?? 0}</p>
      <p style={mutedTextStyle}>
        Use credits to create galleries and explore variants before you commit
        to an $80,000+ backyard project.
      </p>

      {lowBalance && (
        <p style={badgeWarningStyle}>
          Running low – keep a few credits on hand so you can test ideas when
          inspiration hits.
        </p>
      )}

      {lastPurchase && (
        <div style={dividerStyle} />
      )}

      {lastPurchase && (
        <div style={recentRowStyle}>
          <div>
            <p style={recentLabelStyle}>Last purchase</p>
            <p style={recentMainStyle}>
              +{lastPurchase.credits_purchased} credits
            </p>
            <p style={recentMetaStyle}>
              {formatDateTime(lastPurchase.created_at)} ·{" "}
              <span style={statusChipStyle(lastPurchase.status)}>
                {lastPurchase.status}
              </span>
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <p style={{ color: "#b91c1c", fontSize: 12, marginTop: 8 }}>
          {errorMessage}
        </p>
      )}
    </div>
  )
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

/* Styles – keep in sync with your Dashboard/BuyCredits cards */

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: 20,
  borderRadius: 20,
  border: "1px solid #e2e8f0",
  boxShadow: "0 16px 30px rgba(15, 23, 42, 0.06)",
  display: "flex",
  flexDirection: "column",
}

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 4,
}

const labelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: 0.08,
  color: "#64748b",
}

const bigNumberStyle: React.CSSProperties = {
  margin: 0,
  marginTop: 6,
  fontSize: 28,
  fontWeight: 600,
  color: "#0f172a",
}

const mutedTextStyle: React.CSSProperties = {
  margin: 0,
  marginTop: 6,
  fontSize: 12,
  color: "#64748b",
}

const primaryLinkButton: React.CSSProperties = {
  marginTop: 12,
  display: "inline-block",
  padding: "8px 14px",
  borderRadius: 999,
  border: "none",
  background:
    "linear-gradient(135deg, #0ea5e9 0%, #22c55e 50%, #6366f1 100%)",
  color: "#ffffff",
  fontWeight: 600,
  fontSize: 13,
  textDecoration: "none",
  cursor: "pointer",
  textAlign: "center",
}

const tinyLinkStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#0ea5e9",
  textDecoration: "none",
}

const badgeWarningStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 12,
  color: "#92400e",
  backgroundColor: "#fef3c7",
  borderRadius: 999,
  padding: "5px 10px",
  display: "inline-block",
}

const dividerStyle: React.CSSProperties = {
  marginTop: 14,
  marginBottom: 10,
  height: 1,
  backgroundColor: "#e2e8f0",
}

const recentRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
}

const recentLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.08,
  color: "#94a3b8",
}

const recentMainStyle: React.CSSProperties = {
  margin: 0,
  marginTop: 4,
  fontSize: 13,
  fontWeight: 600,
  color: "#0f172a",
}

const recentMetaStyle: React.CSSProperties = {
  margin: 0,
  marginTop: 2,
  fontSize: 12,
  color: "#64748b",
}

function statusChipStyle(status: string): React.CSSProperties {
  const base: React.CSSProperties = {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.04,
    padding: "2px 7px",
    borderRadius: 999,
    border: "1px solid transparent",
  }

  if (status === "completed") {
    return {
      ...base,
      backgroundColor: "#ecfdf5",
      borderColor: "#bbf7d0",
      color: "#166534",
    }
  }
  if (status === "pending") {
    return {
      ...base,
      backgroundColor: "#fefce8",
      borderColor: "#fef08a",
      color: "#92400e",
    }
  }
  return {
    ...base,
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
    color: "#b91c1c",
  }
}
