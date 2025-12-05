"use client"

import * as React from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/AuthContext"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

export default function AuthPanel() {
  const auth = useAuth()
  const user = auth?.user || null

  const [mode, setMode] = React.useState<"signup" | "login">("signup")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState("")

  function redirectToDashboard() {
    window.location.href = "/dashboard"
  }

  async function claimJobs(userId: string, email: string) {
    try {
      await fetch(`${API_BASE}/auth/claim-jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, email }),
      })
    } catch (e) {
      console.error("Error claiming jobs:", e)
    }
  }

async function handleLogin() {
  setError("")
  setSuccess("")

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  console.log("login result", { data, error })

  if (error) {
    // This will show Supabase's exact message, not just "400"
    setError(error.message)
    return
  }

  const userId = data?.user?.id || null
  if (userId) {
    await claimJobs(userId, email)
    setSuccess("Logged in — redirecting to your dashboard...")
    redirectToDashboard()
  } else {
    setSuccess("Logged in.")
  }
}

  async function handleSignUp() {
    setError("")
    setSuccess("")

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      return
    }

    const newUserId = data?.user?.id || null

    if (data?.session && newUserId) {
      await claimJobs(newUserId, email)
      setSuccess("Account created — redirecting to your dashboard...")
      redirectToDashboard()
    } else {
      setSuccess("Account created — please check your email to confirm.")
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  // Logged in view
  if (user) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          border: "1px solid #eee",
          maxWidth: 360,
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: 600 }}>Account</div>
        <div style={{ marginBottom: 12 }}>
          Logged in as <strong>{user.email}</strong>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 999,
            border: "none",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Log Out
        </button>
        <button
          onClick={redirectToDashboard}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "8px 12px",
            borderRadius: 999,
            border: "none",
            background: "#0b6cff",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  const isLogin = mode === "login"

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        border: "1px solid #eee",
        maxWidth: 360,
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: 600 }}>
        {isLogin ? "Log In" : "Create an Account"}
      </div>

      <input
        style={{
          width: "100%",
          padding: 8,
          marginBottom: 8,
          borderRadius: 8,
          border: "1px solid #ccc",
        }}
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        style={{
          width: "100%",
          padding: 8,
          marginBottom: 8,
          borderRadius: 8,
          border: "1px solid #ccc",
        }}
        placeholder="Password"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={isLogin ? handleLogin : handleSignUp}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: 999,
          border: "none",
          background: isLogin ? "#111" : "#0b6cff",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        {isLogin ? "Log In" : "Sign Up"}
      </button>

      {error && (
        <div style={{ color: "red", marginTop: 8, fontSize: 12 }}>{error}</div>
      )}
      {success && (
        <div style={{ color: "green", marginTop: 8, fontSize: 12 }}>
          {success}
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 12 }}>
        {isLogin ? (
          <>
            Need an account?{" "}
            <button
              style={{
                border: "none",
                background: "transparent",
                color: "#0b6cff",
                cursor: "pointer",
                padding: 0,
              }}
              onClick={() => {
                setMode("signup")
                setError("")
                setSuccess("")
              }}
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              style={{
                border: "none",
                background: "transparent",
                color: "#0b6cff",
                cursor: "pointer",
                padding: 0,
              }}
              onClick={() => {
                setMode("login")
                setError("")
                setSuccess("")
              }}
            >
              Log in
            </button>
          </>
        )}
      </div>
    </div>
  )
}
