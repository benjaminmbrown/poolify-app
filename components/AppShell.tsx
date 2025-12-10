"use client"

// components/AppShell.tsx
// Completely self-contained styling that matches your homepage design.

import React, { ReactNode } from "react"

// ----- Design Tokens (self-contained here) -----
const colors = {
  pageBg: "#f8fafc",
  text: "#0f172a",
  textMuted: "#64748b",
  border: "#e2e8f0",
  cardBg: "#ffffff",
  accentGradient:
    "linear-gradient(135deg, #0ea5e9 0%, #22c55e 50%, #6366f1 100%)",
}

const radii = {
  card: 24,
  button: 999,
}

const shadows = {
  card: "0 20px 40px rgba(15, 23, 42, 0.08)",
  button: "0 10px 20px rgba(15, 23, 42, 0.25)",
}

const layout = {
  maxWidth: 1120,
}

// ----- Header -----

const headerStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  backgroundColor: "rgba(248, 250, 252, 0.9)",
  backdropFilter: "blur(10px)",
  borderBottom: `1px solid ${colors.border}`,
}

const headerInnerStyle: React.CSSProperties = {
  maxWidth: layout.maxWidth,
  margin: "0 auto",
  padding: "12px 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}

// Buttons
const baseButton: React.CSSProperties = {
  borderRadius: radii.button,
  padding: "8px 16px",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  border: "1px solid #cbd5f5",
  backgroundColor: "white",
  color: colors.text,
}

const primaryButton: React.CSSProperties = {
  ...baseButton,
  border: "none",
  background: colors.accentGradient,
  color: "white",
  boxShadow: shadows.button,
}

// Card style for use inside the app
const appCardStyle: React.CSSProperties = {
  borderRadius: radii.card,
  padding: 24,
  backgroundColor: colors.cardBg,
  boxShadow: shadows.card,
  border: `1px solid ${colors.border}`,
}

// Background wrapper
const appWrapperStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: colors.pageBg,
  color: colors.text,
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

const mainContentStyle: React.CSSProperties = {
  maxWidth: layout.maxWidth,
  margin: "0 auto",
  padding: "32px 24px 72px 24px",
}

// ----- AppShell Component -----

export function AppShell({ children }: { children: ReactNode }) {
  const goTo = (path: string) => {
    if (typeof window !== "undefined") {
      window.location.href = path
    }
  }

  return (
    <div style={appWrapperStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
            onClick={() => goTo("/")}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background: colors.accentGradient,
              }}
            />
            <span style={{ fontWeight: 700, fontSize: 18 }}>Poolify</span>
          </div>

          {/* Navigation buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button style={baseButton} onClick={() => goTo("/app")}>
              Dashboard
            </button>

            <button style={baseButton} onClick={() => goTo("/app/gallery")}>
              Galleries
            </button>

            <button
              style={primaryButton}
              onClick={() => goTo("/app/buy-credits")}
            >
              Buy Credits
            </button>
          </div>
        </div>
      </header>

      {/* Main App Content */}
      <main style={mainContentStyle}>{children}</main>
    </div>
  )
}

// Export reusable card wrapper for dashboard pages
export function AppCard({
  children,
  style,
}: {
  children: ReactNode
  style?: React.CSSProperties
}) {
  return <div style={{ ...appCardStyle, ...(style || {}) }}>{children}</div>
}
