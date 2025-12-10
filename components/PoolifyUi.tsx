// components/PoolifyUI.tsx
// Reusable styles/components that match your new homepage look.

import * as React from "react"

export const poolifyColors = {
  pageBg: "#f8fafc",
  text: "#0f172a",
  textMuted: "#64748b",
  border: "#e2e8f0",
  cardBg: "#ffffff",
  accentGradient:
    "linear-gradient(135deg, #0ea5e9 0%, #22c55e 50%, #6366f1 100%)",
}

const shadows = {
  card: "0 20px 40px rgba(15, 23, 42, 0.08)",
  button: "0 10px 20px rgba(15, 23, 42, 0.25)",
}

const radii = {
  card: 24,
  pill: 999,
}

export const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: poolifyColors.pageBg,
  color: poolifyColors.text,
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

// Optional wrapper for full pages (if you want)
export function PageBackground(props: { children: React.ReactNode }) {
  return <div style={pageStyle}>{props.children}</div>
}

export function Card(props: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        borderRadius: radii.card,
        padding: 24,
        backgroundColor: poolifyColors.cardBg,
        boxShadow: shadows.card,
        border: `1px solid ${poolifyColors.border}`,
        ...(props.style || {}),
      }}
    >
      {props.children}
    </div>
  )
}

export function PrimaryButton(props: {
  children: React.ReactNode
  onClick?: () => void
  style?: React.CSSProperties
  type?: "button" | "submit"
}) {
  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      style={{
        border: "none",
        borderRadius: radii.pill,
        padding: "12px 22px",
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
        background: poolifyColors.accentGradient,
        color: "white",
        boxShadow: shadows.button,
        ...(props.style || {}),
      }}
    >
      {props.children}
    </button>
  )
}

export function SecondaryButton(props: {
  children: React.ReactNode
  onClick?: () => void
  style?: React.CSSProperties
  type?: "button" | "submit"
}) {
  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      style={{
        borderRadius: radii.pill,
        padding: "12px 22px",
        fontSize: 15,
        fontWeight: 500,
        cursor: "pointer",
        border: "1px solid #cbd5f5",
        backgroundColor: "white",
        color: poolifyColors.text,
        ...(props.style || {}),
      }}
    >
      {props.children}
    </button>
  )
}
