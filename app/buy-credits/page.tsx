"use client"

import * as React from "react"
import { useAuth } from "@/components/AuthContext"

type Status = "checking-auth" | "no-user" | "loading-data" | "ready" | "error"

type CreditsResponse = {
  credits?: number
  error?: string
}

const CREDIT_PACKS = [
  {
    priceId: "price_1SYDbXD4euJjAUTF6xIyUelY",
    label: "10 credits",
    description: "Great for trying Poolify or a couple of projects.",
    subtitle: "~2–3 full sets of designs",
  },
  {
    priceId: "price_1SYDcrD4euJjAUTF1oR0bWsA",
    label: "25 credits",
    description: "Ideal for planning a full backyard transformation.",
    subtitle: "~5–8 full sets of designs",
  },
  {
    priceId: "price_1SYDdND4euJjAUTFzzRQYrpT",
    label: "60 credits",
    description: "Best value for pros and serial planners.",
    subtitle: "Plenty of room to experiment",
  },
]

export default function BuyCreditsPage() {
  const auth = useAuth()
  const userId = auth?.userId || null
  const email = auth?.email || null
  const authLoading = auth?.loading || false

  const [status, setStatus] = React.useState<Status>("checking-auth")
  const [credits, setCredits] = React.useState<number | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [busyPriceId, setBusyPriceId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (authLoading) return

    const boot = async () => {
      setStatus("checking-auth")
      setErrorMessage(null)

      if (!userId) {
        setStatus("no-user")
        return
      }

      try {
        setStatus("loading-data")

        const params = new URLSearchParams({ user_id: userId })
        if (email) {
          params.set("email", email)
        }

        const res = await fetch(`/api/me/credits?${params.toString()}`)
        const json: CreditsResponse = await res.json()

        if (!res.ok || json.error) {
          throw new Error(json.error || res.statusText)
        }

        setCredits(json.credits !== undefined ? json.credits : 0)
        setStatus("ready")
      } catch (e: any) {
        console.error("BuyCredits boot error:", e)
        setErrorMessage(
          e?.message || "Unexpected error while loading your credits."
        )
        setStatus("error")
      }
    }

    boot()
  }, [authLoading, userId, email])

  const startCheckout = async (priceId: string) => {
    if (!userId) {
      setErrorMessage("Please sign in to your account first.")
      setStatus("no-user")
      return
    }

    setBusyPriceId(priceId)
    setErrorMessage(null)

    try {
      const res = await fetch("/api/credits/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          price_id: priceId,
        }),
      })

      const json = await res.json().catch(() => ({} as any))

      if (!res.ok || !json.url) {
        throw new Error(
          json.error || "Could not start checkout. Please try again."
        )
      }

      window.location.href = json.url
    } catch (e: any) {
      console.error("Checkout error:", e)
      setErrorMessage(
        e?.message || "Error starting checkout. Please try again."
      )
    } finally {
      setBusyPriceId(null)
    }
  }

  // ----- Render states -----

  if (status === "checking-auth" || status === "loading-data") {
    return (
      <div style={outerStyle}>
        <div style={scrollAreaStyle}>
          <div style={cardStyle}>Loading your account…</div>
        </div>
      </div>
    )
  }

  if (status === "no-user" || !userId) {
    return (
      <div style={outerStyle}>
        <div style={scrollAreaStyle}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Sign in to buy credits</h2>
            <p style={{ fontSize: 14, opacity: 0.8 }}>
              This page lets you add credits to your Poolify account. Go to the
              home page, log in or create an account, then come back here.
            </p>
            <a href="/" style={primaryButton}>
              Go to Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div style={outerStyle}>
        <div style={scrollAreaStyle}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Problem loading credits</h2>
            <p style={{ color: "#ffb0b0", fontSize: 14 }}>{errorMessage}</p>
            <a href="/dashboard" style={secondaryButton}>
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  // READY

  return (
    <div style={outerStyle}>
      <div style={scrollAreaStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={{ margin: 0 }}>Buy Credits</h1>
            <p style={{ margin: 0, opacity: 0.8 }}>
              Signed in as {email ?? "your account"}
            </p>
          </div>
          <a href="/dashboard" style={secondaryButton}>
            Back to Dashboard
          </a>
        </header>

        <section style={{ marginBottom: 24 }}>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Current Balance</h3>
            <p style={{ fontSize: 26, fontWeight: 600 }}>
              {credits ?? 0} credits
            </p>
            <p style={{ fontSize: 13, opacity: 0.8 }}>
              Credits are used whenever you generate new designs or request
              additional variants.
            </p>
            {errorMessage && (
              <p style={{ color: "#ffb0b0", fontSize: 13 }}>{errorMessage}</p>
            )}
          </div>
        </section>

        <section>
          <h2 style={{ marginBottom: 12 }}>Choose a pack</h2>
          <div style={packsGridStyle}>
            {CREDIT_PACKS.map((pack) => (
              <div key={pack.priceId} style={packCardStyle}>
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {pack.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.85,
                    marginBottom: 4,
                  }}
                >
                  {pack.description}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.7,
                    marginBottom: 10,
                  }}
                >
                  {pack.subtitle}
                </div>
                <button
                  style={primaryButton}
                  onClick={() => startCheckout(pack.priceId)}
                  disabled={busyPriceId === pack.priceId}
                >
                  {busyPriceId === pack.priceId
                    ? "Starting checkout…"
                    : "Buy credits"}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <p style={{ fontSize: 12, opacity: 0.7 }}>
            Payments are processed securely by Stripe. Credits are added to your
            account automatically after checkout.
          </p>
        </section>
      </div>
    </div>
  )
}

/* Layout + styles (same style language as Dashboard) */

const outerStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  minHeight: "100svh",
  // @ts-ignore
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
}

const scrollAreaStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  padding: 24,
  boxSizing: "border-box",
  width: "100%",
  maxWidth: 1100,
  margin: "0 auto",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
  color: "white",
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
}

const cardStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.3)",
  padding: 20,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.1)",
}

const primaryButton: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 16px",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg,#27b3ff,#3dffb3)",
  color: "#000",
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
  fontSize: 14,
}

const secondaryButton: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "transparent",
  color: "white",
  textDecoration: "none",
  cursor: "pointer",
  fontSize: 14,
}

const packsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
}

const packCardStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.3)",
  padding: 18,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.1)",
}
