"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function AuthPanel() {
  const auth = useAuth();
  const user = auth?.user || null;

  const [mode, setMode] = React.useState<"signup" | "login">("signup");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  function redirectToDashboard() {
    window.location.href = "/dashboard";
  }

  async function claimJobs(userId: string, email: string) {
    try {
      await fetch(`${API_BASE}/auth/claim-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, email }),
      });
    } catch (e) {
      console.error("Error claiming jobs:", e);
    }
  }

  // ---------------------
  // LOGIN
  // ---------------------
  async function handleLogin() {
    setError("");
    setSuccess("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    const userId = data?.user?.id || null;
    if (userId) {
      await claimJobs(userId, email);
      setSuccess("Logged in — redirecting to your dashboard...");
      redirectToDashboard();
    }
  }

  // ---------------------
  // SIGNUP
  // ---------------------
  async function handleSignUp() {
    setError("");
    setSuccess("");

    if (!acceptedTerms) {
      setError("You must accept the Terms & Conditions to create an account.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    const newUserId = data?.user?.id || null;

    // Store terms acceptance in user_profiles
    if (newUserId) {
      await supabase
        .from("user_profiles")
        .update({
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
        })
        .eq("id", newUserId);
    }

    if (data?.session && newUserId) {
      await claimJobs(newUserId, email);
      setSuccess("Account created — redirecting to your dashboard...");
      redirectToDashboard();
    } else {
      setSuccess("Account created — please check your email to confirm.");
    }
  }

  // ---------------------
  // LOGOUT
  // ---------------------
  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // ---------------------
  // LOGGED IN VIEW
  // ---------------------
  if (user) {
    return (
      <div style={{ padding: 16, borderRadius: 12, border: "1px solid #eee", maxWidth: 360 }}>
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
    );
  }

  const isLogin = mode === "login";

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

      {/* EMAIL */}
      <input
        style={{
          width: "100%",
          padding: 8,
          marginBottom: 8,
          borderRadius: 8,
          border: "1px solid #ccc",
        }}
        placeholder="Email"
        type="email"
        onChange={(e) => setEmail(e.target.value)}
      />

      {/* PASSWORD */}
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

      {/* TERMS CHECKBOX — Only shown during signup */}
      {!isLogin && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          I agree to the{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0b6cff" }}
          >
            Terms & Conditions
          </a>
        </label>
      )}

      {/* SUBMIT BUTTON */}
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

      {/* SUCCESS / ERROR */}
      {error && (
        <div style={{ color: "red", marginTop: 8, fontSize: 12 }}>{error}</div>
      )}
      {success && (
        <div style={{ color: "green", marginTop: 8, fontSize: 12 }}>
          {success}
        </div>
      )}

      {/* MODE SWITCH */}
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
                setMode("signup");
                setError("");
                setSuccess("");
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
                setMode("login");
                setError("");
                setSuccess("");
              }}
            >
              Log in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
