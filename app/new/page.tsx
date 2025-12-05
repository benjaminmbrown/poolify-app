"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthContext"

type Status = "idle" | "submitting" | "success" | "error"

export default function NewGalleryPage() {
  const auth = useAuth()
  const router = useRouter()

  const userId = auth?.userId || null
  const email = auth?.email || ""
  const loadingAuth = auth?.loading || false

  const [name, setName] = React.useState("")
  const [zip, setZip] = React.useState("")
  const [style, setStyle] = React.useState("")
  const [intensity, setIntensity] = React.useState("")
  const [budget, setBudget] = React.useState("")
  const [features, setFeatures] = React.useState("")
  const [imageUrl, setImageUrl] = React.useState("") // simple for now

  const [status, setStatus] = React.useState<Status>("idle")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!userId || !email) {
      setErrorMessage("Please sign in to your account before creating a project.")
      return
    }
    if (!imageUrl.trim()) {
      setErrorMessage("Please provide a backyard photo URL.")
      return
    }

    setStatus("submitting")

    try {
      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          email,
          name: name || null,
          zip: zip || null,
          style: style || null,
          intensity: intensity || null,
          budget: budget || null,
          features: features || null,
          input_image_url: imageUrl,
        }),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.error || res.statusText)
      }

      setStatus("success")

      const galleryUrl: string | undefined = json?.gallery_url
      const token: string | undefined = json?.gallery_token

      if (galleryUrl) {
        router.push(galleryUrl)
      } else if (token) {
        router.push(`/gallery?token=${encodeURIComponent(token)}`)
      } else {
        // Fallback: go to dashboard
        router.push("/dashboard")
      }
    } catch (err: any) {
      console.error("Error creating job:", err)
      setErrorMessage(
        err?.message || "Something went wrong while creating your project."
      )
      setStatus("error")
    }
  }

  if (loadingAuth) {
    return (
      <div style={outerStyle}>
        <div style={cardStyle}>Checking your account…</div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div style={outerStyle}>
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Sign in to start a project</h2>
          <p style={{ fontSize: 14, opacity: 0.8 }}>
            You need a Poolify account to save your designs and see them in your
            dashboard. Go back to the home page, log in or create an account,
            then come back here.
          </p>
          <a href="/" style={primaryButton}>
            Go to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={outerStyle}>
      <div style={formContainerStyle}>
        <header style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>Start a New Pool Project</h1>
          <p style={{ fontSize: 14, opacity: 0.8 }}>
            We&apos;ll use your backyard photo and preferences to generate a new
            gallery of AI pool designs.
          </p>
        </header>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Backyard Photo URL</label>
            <input
              type="url"
              placeholder="https://example.com/your-backyard.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              style={inputStyle}
              required
            />
            <p style={hintStyle}>
              In a next step we can switch this to a direct image upload. For
              now, paste a link to your backyard photo (from your phone or cloud
              storage).
            </p>
          </div>

          <div style={twoColStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                placeholder="Optional"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>ZIP code</label>
              <input
                type="text"
                placeholder="e.g. 66224"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={twoColStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Overall Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select a style</option>
                <option value="modern">Modern</option>
                <option value="resort">Resort / Luxury</option>
                <option value="natural">Natural / Organic</option>
                <option value="family">Family-friendly</option>
                <option value="minimal">Minimal / Clean Lines</option>
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Intensity</label>
              <select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value)}
                style={inputStyle}
              >
                <option value="">How dramatic?</option>
                <option value="light">Light refresh</option>
                <option value="medium">Medium transformation</option>
                <option value="max">Max overhaul</option>
              </select>
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Budget Level</label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              style={inputStyle}
            >
              <option value="">Choose a range</option>
              <option value="budget">Budget-conscious</option>
              <option value="mid">Mid-range</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Must-have Features</label>
            <textarea
              placeholder="Slides, hot tub, tanning ledge, outdoor kitchen, firepit, etc."
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              style={textAreaStyle}
              rows={3}
            />
          </div>

          {errorMessage && (
            <p style={{ color: "#ffb0b0", fontSize: 13 }}>{errorMessage}</p>
          )}

          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <button
              type="submit"
              style={primaryButton}
              disabled={status === "submitting"}
            >
              {status === "submitting"
                ? "Creating your project…"
                : "Create Gallery"}
            </button>
            <a href="/dashboard" style={secondaryButton}>
              Back to Dashboard
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

/* Styles */

const outerStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  padding: 24,
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
  color: "white",
}

const formContainerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 720,
  background: "rgba(0,0,0,0.3)",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.1)",
  padding: 20,
}

const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
}

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.9,
}

const inputStyle: React.CSSProperties = {
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.2)",
  padding: "8px 10px",
  background: "rgba(0,0,0,0.3)",
  color: "white",
  fontSize: 14,
}

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
}

const hintStyle: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.7,
}

const twoColStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
}

const cardStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.3)",
  padding: 20,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.1)",
  maxWidth: 500,
  margin: "40px auto 0",
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
