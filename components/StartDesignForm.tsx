// src/components/StartDesignForm.tsx
"use client"

import * as React from "react"
import { useAuth } from "@/components/AuthContext"

type Status = "idle" | "submitting" | "success" | "error"

const STYLE_OPTIONS = [
  "Modern",
  "Contemporary",
  "Tropical",
  "Minimalist",
  "Traditional",
  "Luxury",
  "Mediterranean",
  "Other",
]

export default function StartDesignForm() {
  const auth = useAuth()
  const userId = auth?.userId || null
  const authEmail = auth?.email || ""

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState(authEmail)
  const [zip, setZip] = React.useState("")

  const [stylesSelected, setStylesSelected] = React.useState<string[]>([])
  const [styleOtherText, setStyleOtherText] = React.useState("")

  const [styleIntensity, setStyleIntensity] = React.useState<number | null>(
    null
  )
  const [budgetIntensity, setBudgetIntensity] = React.useState<number | null>(
    null
  )
  const [numDesigns, setNumDesigns] = React.useState<number | null>(null)

  const [features, setFeatures] = React.useState("") // optional extra notes

  const [file, setFile] = React.useState<File | null>(null)

  const [status, setStatus] = React.useState<Status>("idle")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [galleryUrl, setGalleryUrl] = React.useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
  }

  const toggleStyle = (option: string) => {
    setStylesSelected((prev) => {
      if (prev.includes(option)) {
        return prev.filter((v) => v !== option)
      }
      return [...prev, option]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("submitting")
    setErrorMessage(null)
    setGalleryUrl(null)

    // Basic validation to mirror Tally's "required" behavior
    if (!email.trim()) {
      setStatus("error")
      setErrorMessage("Please enter an email address.")
      return
    }

    if (!file) {
      setStatus("error")
      setErrorMessage("Please upload a photo of your backyard.")
      return
    }

    if (!stylesSelected.length) {
      setStatus("error")
      setErrorMessage("Please choose at least one pool style.")
      return
    }

    if (styleIntensity === null) {
      setStatus("error")
      setErrorMessage("Please choose a style intensity (1–10).")
      return
    }

    if (budgetIntensity === null) {
      setStatus("error")
      setErrorMessage("Please choose a budget intensity (1–10).")
      return
    }

    if (numDesigns === null) {
      setStatus("error")
      setErrorMessage("Please choose how many designs you want.")
      return
    }

    try {
      // Build style string similar to how your backend likely stores it
      const baseStyles = stylesSelected.filter((s) => s !== "Other")
      const styleParts = [...baseStyles]

      if (stylesSelected.includes("Other") && styleOtherText.trim()) {
        styleParts.push(`custom: ${styleOtherText.trim()}`)
      }

      const styleString = styleParts.join(", ")

      const formData = new FormData()
      if (userId) formData.append("user_id", userId)
      formData.append("email", email.trim())
      if (name.trim()) formData.append("customer_name", name.trim())
      if (zip.trim()) formData.append("zip", zip.trim())

      formData.append("style", styleString)
      formData.append("style_intensity", String(styleIntensity))
      formData.append("budget_intensity", String(budgetIntensity))
      formData.append("num_designs", String(numDesigns))

      if (features.trim()) formData.append("features", features.trim())

      formData.append("job_type", "initial")
      formData.append("file", file)

      const res = await fetch("/api/jobs/create", {
        method: "POST",
        body: formData,
      })

      let json: any = null
      try {
        json = await res.json()
      } catch {
        // ignore non-JSON
      }

      if (!res.ok) {
        throw new Error(json?.error || res.statusText || "Failed to create job.")
      }

      if (json?.gallery_url) {
        setGalleryUrl(json.gallery_url)
      }

      setStatus("success")
    } catch (err: any) {
      console.error("StartDesignForm submit error:", err)
      setErrorMessage(err?.message || "Something went wrong. Please try again.")
      setStatus("error")
    }
  }

  const disabled = status === "submitting"

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>Poolify Pool Design Request</h2>
      <p style={helperTextStyle}>
        Upload one clear photo of your backyard and tell us how bold you want us
        to go. We&apos;ll email you a gallery of AI pool designs.
      </p>

      {/* Name */}
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>What&apos;s your name?</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ben"
        />
      </div>

      {/* Email */}
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>What&apos;s your email?</label>
        <input
          style={inputStyle}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>

      {/* Backyard photo */}
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Upload one clear photo of your backyard</label>
        <input
          style={fileInputStyle}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          required
        />
        <p style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
          One photo is perfect. Make sure your yard and any existing patio or
          structures are visible.
        </p>
      </div>

      {/* Styles (checkboxes) */}
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Which styles of pool do you prefer?</label>
        <div style={chipWrapStyle}>
          {STYLE_OPTIONS.map((opt) => {
            const checked = stylesSelected.includes(opt)
            return (
              <label
                key={opt}
                style={{
                  ...chipStyle,
                  borderColor: checked
                    ? "rgba(61,255,179,0.9)"
                    : "rgba(255,255,255,0.2)",
                  background: checked ? "rgba(61,255,179,0.1)" : "transparent",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleStyle(opt)}
                  style={{ marginRight: 6 }}
                />
                {opt}
              </label>
            )
          })}
        </div>
        {stylesSelected.includes("Other") && (
          <input
            style={{ ...inputStyle, marginTop: 8 }}
            value={styleOtherText}
            onChange={(e) => setStyleOtherText(e.target.value)}
            placeholder='For example: "Palm Springs mid-century desert modern with warm neutrals"'
          />
        )}
      </div>

      {/* Style Intensity (1–10) */}
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Style Intensity</label>
        <p style={helperTextStyle}>
          1 = stripped-down results in the style you selected. 10 = maximum
          intensity of that style. 5 is normal.
        </p>
        <div style={scaleRowStyle}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <label key={n} style={scaleLabelStyle}>
              <input
                type="radio"
                name="style_intensity"
                value={n}
                checked={styleIntensity === n}
                onChange={() => setStyleIntensity(n)}
              />
              <span>{n}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Budget Intensity (1–10) */}
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Budget Intensity</label>
        <p style={helperTextStyle}>
          This helps us suggest ideas that fit your comfort zone. 1 = minimum
          budget ideas. 10 = &quot;billionaire&apos;s finish.&quot; 5 is
          standard.
        </p>
        <div style={scaleRowStyle}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <label key={n} style={scaleLabelStyle}>
              <input
                type="radio"
                name="budget_intensity"
                value={n}
                checked={budgetIntensity === n}
                onChange={() => setBudgetIntensity(n)}
              />
              <span>{n}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Zip */}
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>What&apos;s your zipcode?</label>
        <input
          style={inputStyle}
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="e.g. 66224"
        />
      </div>

      {/* How many designs (1–60, to mirror Tally) */}
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>How many designs do you want?</label>
        <p style={helperTextStyle}>
          Each standard design costs 1 credit. You currently have credits
          visible in your dashboard.
        </p>
        <select
          style={inputStyle}
          value={numDesigns ?? ""}
          onChange={(e) =>
            setNumDesigns(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">Select a number</option>
          {Array.from({ length: 60 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Optional extra notes / must-have features */}
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>
          Anything else we should know? (optional)
        </label>
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          placeholder="Must-have features, concerns, or extra context."
        />
      </div>

      {errorMessage && (
        <p style={{ color: "#ffb0b0", fontSize: 13, marginTop: 4 }}>
          {errorMessage}
        </p>
      )}

      {status === "success" && (
        <div style={successBoxStyle}>
          <p style={{ margin: 0, fontSize: 13 }}>
            Got it! Your design request is in the queue. We&apos;ll email you a
            gallery link as soon as your pool ideas are ready.
          </p>
          {galleryUrl && (
            <p style={{ margin: 0, fontSize: 12, marginTop: 4 }}>
              You can also bookmark this link:{" "}
              <a
                href={galleryUrl}
                style={{ color: "#3dffb3", textDecoration: "underline" }}
              >
                Open gallery
              </a>
            </p>
          )}
        </div>
      )}

      <button type="submit" style={submitButtonStyle} disabled={disabled}>
        {status === "submitting" ? "Submitting…" : "Create my gallery"}
      </button>
    </form>
  )
}

/* Styles */

const formStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(0,0,0,0.35)",
  maxWidth: 520,
  width: "100%",
}

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: 12,
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 4,
  fontSize: 13,
  opacity: 0.9,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(0,0,0,0.4)",
  color: "white",
  fontSize: 14,
  outline: "none",
}

const fileInputStyle: React.CSSProperties = {
  ...inputStyle,
  padding: "6px 8px",
}

const helperTextStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.8,
  marginBottom: 6,
}

const submitButtonStyle: React.CSSProperties = {
  marginTop: 8,
  padding: "10px 16px",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg,#27b3ff,#3dffb3)",
  color: "#000",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 14,
  width: "100%",
}

const successBoxStyle: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 8,
  padding: 10,
  borderRadius: 12,
  background: "rgba(0,80,30,0.6)",
  border: "1px solid rgba(61,255,179,0.5)",
}

const chipWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
}

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 8px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.2)",
  fontSize: 12,
  cursor: "pointer",
}

const scaleRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
}

const scaleLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "center",
  fontSize: 11,
  padding: "4px 6px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.2)",
}
