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

type Filter = "all" | "completed" | "pending" | "other"

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

export function CreditsOverviewPanel() {
  const auth = useAuth()
  const userId = auth?.userId || null
  const email = auth?.email || null
  const authLoading = auth?.loading || false

  const [status, setStatus] = React.useState<Status>("checking-auth")
  const [credits, setCredits] = React.useState<number | null>(null)
  const [purchases, setPurchases] = React.useState<Purchase[]>([])
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<Filter>("all")

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

        setCredits(json.profile?.credits ?? 0)
        setPurchases(json.recent_purchases || [])
        setStatus("ready")
      } catch (e: any) {
        console.error("CreditsOverviewPanel fetch error:", e)
        setErrorMessage(
          e?.message || "Could not load your credits right now."
        )
        setStatus("error")
      }
    }

    fetchProfile()
  }, [authLoading, userId, email])

  // ----- Render states -----

  if (status === "checking-auth" || status === "loading") {
    return (
      <div style={panelWrapperStyle}>
        <div style={cardStyle}>
          <p style={labelStyle}>Credits</p>
          <p style={bigNumberStyle}>…</p>
          <p style={mutedTextStyle}>Loading your balance…</p>
        </div>
      </div>
    )
  }

  if (status === "no-user" || !userId) {
    return (
      <div style={panelWrapperStyle}>
        <div style={cardStyle}>
          <p style={labelStyle}>Credits</p>
          <p style={bigNumberStyle}>0</p>
          <p style={mutedTextStyle}>
            Sign in to see your credit balance and activity.
          </p>
          <a href="/buy-credits" style={primaryLinkButton}>
            Buy credits
          </a>
        </div>
      </div>
    )
  }

  const balance = credits ?? 0
  const lowBalance = balance > 0 && balance < 5
  const zeroBalance = balance === 0

  const filteredPurchases = purchases.filter((p) => {
    if (filter === "all") return true
    if (filter === "completed") return p.status === "completed"
    if (filter === "pending") return p.status === "pending"
    return p.status !== "completed" && p.status !== "pending"
  })

  return (
    <div style={panelWrapperStyle}>
      {/* Low credits banner */}
      {(zeroBalance || lowBalance) && (
        <div style={bannerStyle(zeroBalance)}>
          <div style={{ flex: 1 }}>
            <p style={bannerTitleStyle}>
              {zeroBalance ? "You’re out of credits" : "You’re running low on credits"}
            </p>
            <p style={bannerTextStyle}>
              Keep a few credits on hand so you can test new pool ideas before
              committing to an $80,000+ build.
            </p>
          </div>
          <a href="/buy-credits" style={bannerButtonStyle}>
            Buy credits
          </a>
        </div>
      )}

      {/* Main balance card */}
      <div style={cardStyle}>
        <div style={headerRowStyle}>
          <p style={labelStyle}>Credits</p>
          <a href="/buy-credits" style={tinyLinkStyle}>
            Buy more
          </a>
        </div>

        <p style={bigNumberStyle}>{balance}</p>
        <p style={mutedTextStyle}>
          Use credits to generate new pool design galleries and variants so you
          can make confident decisions before construction.
        </p>

        {errorMessage && (
          <p style={{ color: "#b91c1c", fontSize: 12, marginTop: 8 }}>
            {errorMessage}
          </p>
        )}
      </div>

      {/* Activity + filters */}
      <div style={activityCardStyle}>
        <div style={activityHeaderRowStyle}>
          <p style={activityTitleStyle}>Credit activity</p>
          <div style={filterGroupStyle}>
            {renderFilterButton("all", "All", filter, setFilter)}
            {renderFilterButton("completed", "Completed", filter, setFilter)}
            {renderFilterButton("pending", "Pending", filter, setFilter)}
            {renderFilterButton("other", "Other", filter, setFilter)}
          </div>
        </div>

        {filteredPurchases.length === 0 ? (
          <p style={emptyStateStyle}>
            {purchases.length === 0
              ? "No credit purchases yet. Your first pack will appear here."
              : "No purchases match this filter."}
          </p>
        ) : (
          <div style={activityListStyle}>
            {filteredPurchases.map((p) => (
              <div key={p.id} style={activityRowStyle}>
                <div style={{ flex: 1 }}>
                  <p style={activityMainStyle}>
                    +{p.credits_purchased} credits
                  </p>
                  <p style={activityMetaStyle}>
                    {formatDateTime(p.created_at)}
                  </p>
                </div>
                <span style={statusChipStyle(p.status)}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* Helpers */

function renderFilterButton(
  value: Filter,
  label: string,
  active: Filter,
  setFilter: (f: Filter) => void
) {
  const isActive = active === value
  return (
    <button
      type="button"
      onClick={() => setFilter(value)}
      style={filterButtonStyle(isActive)}
    >
      {label}
    </button>
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

/* Styles */

const panelWrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
}

/* Banner */

const bannerStyle = (zero: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(248, 250, 252, 0.7)",
  background: zero
    ? "linear-gradient(135deg, #fee2e2, #f97316)"
    : "linear-gradient(135deg, #fef9c3, #38bdf8)",
  color: "#0f172a",
  boxShadow: "0 16px 30px rgba(15, 23, 42, 0.12)",
})

const bannerTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
}

const bannerTextStyle: React.CSSProperties = {
  margin: 0,
  marginTop: 4,
  fontSize: 12,
}

const bannerButtonStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 999,
  border: "none",
  backgroundColor: "rgba(15,23,42,0.9)",
  color: "#ffffff",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
}

/* Cards */

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: 20,
  borderRadius: 20,
  border: "1px solid #e2e8f0",
  boxShadow: "0 16px 30px rgba(15, 23, 42, 0.06)",
  display: "flex",
  flexDirection: "column",
}

const activityCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: 18,
  borderRadius: 18,
  border: "1px solid #e2e8f0",
  boxShadow: "0 12px 24px rgba(15, 23, 42, 0.04)",
  display: "flex",
  flexDirection: "column",
  gap: 10,
}

/* Shared text */

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

/* Activity section */

const activityHeaderRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  marginBottom: 4,
}

const activityTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  color: "#0f172a",
}

const filterGroupStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
}

const filterButtonStyle = (active: boolean): React.CSSProperties => ({
  padding: "4px 8px",
  borderRadius: 999,
  border: active ? "1px solid #0ea5e9" : "1px solid #e2e8f0",
  backgroundColor: active ? "#eff6ff" : "#ffffff",
  color: active ? "#0f172a" : "#64748b",
  fontSize: 11,
  fontWeight: active ? 600 : 500,
  cursor: "pointer",
})

const emptyStateStyle: React.CSSProperties = {
  margin: 0,
  marginTop: 8,
  fontSize: 12,
  color: "#94a3b8",
}

const activityListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  marginTop: 6,
}

const activityRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "6px 0",
  borderBottom: "1px dashed #e2e8f0",
}

const activityMainStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontWeight: 600,
  color: "#0f172a",
}

const activityMetaStyle: React.CSSProperties = {
  margin: 0,
  marginTop: 2,
  fontSize: 11,
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
