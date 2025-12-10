"use client";

import * as React from "react";
import { useAuth } from "@/components/AuthContext";

type Status = "checking-auth" | "no-user" | "loading-data" | "ready" | "error";

type CreditsResponse = {
  credits?: number;
  error?: string;
};

// Talk directly to Flask backend
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

// Price IDs come from env so dev = test, prod = live
const CREDIT_PACKS = [
  {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_10!,
    label: "10 credits",
    description: "Great for trying Poolify or a couple of projects.",
    subtitle: "~2–3 full sets of designs",
    tag: "Starter",
    upsell: "Perfect for dipping your toes in before a big backyard project.",
  },
  {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_25!,
    label: "25 credits",
    description: "Ideal for planning a full backyard transformation.",
    subtitle: "~5–8 full sets of designs",
    tag: "Most popular",
    upsell:
      "Most homeowners choose this pack — enough credits to find the perfect layout.",
  },
  {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_60!,
    label: "60 credits",
    description: "Best value for pros and serial planners.",
    subtitle: "Plenty of room to experiment",
    tag: "Best value",
    upsell:
      "Best deal if you want to explore every design idea before your $80,000+ project.",
  },
];

export default function BuyCreditsPage() {
  const auth = useAuth();
  const userId = auth?.userId || null;
  const email = auth?.email || null;
  const authLoading = auth?.loading || false;

  const [status, setStatus] = React.useState<Status>("checking-auth");
  const [credits, setCredits] = React.useState<number | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [busyPriceId, setBusyPriceId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading) return;

    const boot = async () => {
      setStatus("checking-auth");
      setErrorMessage(null);

      if (!userId) {
        setStatus("no-user");
        return;
      }

      try {
        setStatus("loading-data");

        const params = new URLSearchParams({ user_id: userId });
        if (email) params.set("email", email);

        // 👉 Direct call to Flask /me/credits
        const res = await fetch(`${API_BASE}/me/credits?${params.toString()}`);
        const json: CreditsResponse = await res.json();

        if (!res.ok || json.error) {
          throw new Error(json.error || res.statusText);
        }

        setCredits(json.credits !== undefined ? json.credits : 0);
        setStatus("ready");
      } catch (e: any) {
        console.error("BuyCredits boot error:", e);
        setErrorMessage(
          e?.message || "Unexpected error while loading your credits."
        );
        setStatus("error");
      }
    };

    boot();
  }, [authLoading, userId, email]);

  const startCheckout = async (priceId: string) => {
    if (!userId) {
      setErrorMessage("Please sign in to your account first.");
      setStatus("no-user");
      return;
    }

    setBusyPriceId(priceId);
    setErrorMessage(null);

    try {
      // 👉 Direct call to Flask /credits/create-checkout-session
      const res = await fetch(`${API_BASE}/credits/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          price_id: priceId,
        }),
      });

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok || !json.url) {
        throw new Error(
          json.error || "Could not start checkout. Please try again."
        );
      }

      window.location.href = json.url;
    } catch (e: any) {
      console.error("Checkout error:", e);
      setErrorMessage(
        e?.message || "Error starting checkout. Please try again."
      );
    } finally {
      setBusyPriceId(null);
    }
  };

  // ----- Render states -----

  if (status === "checking-auth" || status === "loading-data") {
    return (
      <div style={outerStyle}>
        <div style={scrollAreaStyle}>
          <div style={cardStyle}>Loading your account…</div>
        </div>
      </div>
    );
  }

  if (status === "no-user" || !userId) {
    return (
      <div style={outerStyle}>
        <div style={scrollAreaStyle}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Sign in to buy credits</h2>
            <p style={mutedTextStyle}>
              This page lets you add credits to your Poolify account. Go to the
              home page, log in or create an account, then come back here.
            </p>
            <a href="/" style={primaryButton}>
              Go to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={outerStyle}>
        <div style={scrollAreaStyle}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Problem loading credits</h2>
            <p style={{ color: "#b91c1c", fontSize: 14 }}>{errorMessage}</p>
            <a href="/dashboard" style={secondaryButton}>
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // READY

  return (
    <div style={outerStyle}>
      <div style={scrollAreaStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={h1Style}>Buy Credits</h1>
            <p style={mutedTextStyle}>Signed in as {email ?? "your account"}</p>
          </div>
          <a href="/dashboard" style={secondaryButton}>
            Back to Dashboard
          </a>
        </header>

        <section>
          <p style={valuePropStyle}>
            "Exploring designs now helps avoid costly construction mistakes
            later. Most homeowners purchase 25–60 credits to fully visualize
            their backyard before building."
          </p>

          <h2 style={h2Style}>Choose a pack</h2>
          <div style={packsGridStyle}>
            {CREDIT_PACKS.map((pack) => (
              <div key={pack.priceId} style={packCardStyle}>
                <div style={packHeaderRowStyle}>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 6,
                      fontSize: 15,
                    }}
                  >
                    {pack.label}
                  </div>
                  {pack.tag && <span style={packTagStyle}>{pack.tag}</span>}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#475569",
                    marginBottom: 4,
                  }}
                >
                  {pack.description}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#64748b",
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
                {pack.upsell && <p style={packUpsellStyle}>{pack.upsell}</p>}
              </div>
            ))}
          </div>
        </section>
        <section style={{ marginTop: 24 }}>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Current Balance</h3>
            <p style={{ fontSize: 26, fontWeight: 600, margin: 0 }}>
              {credits ?? 0} credits
            </p>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>
              Credits are used whenever you generate new designs or request
              additional variants.
            </p>
            {errorMessage && (
              <p style={{ color: "#b91c1c", fontSize: 13, marginTop: 8 }}>
                {errorMessage}
              </p>
            )}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <p style={{ fontSize: 12, color: "#64748b" }}>
            Payments are processed securely by Stripe. Credits are added to your
            account automatically after checkout.
          </p>
        </section>
      </div>
    </div>
  );
}

/* Layout + styles (light theme to match Dashboard/Homepage) */

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
  backgroundColor: "#f8fafc",
  color: "#0f172a",
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const scrollAreaStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  padding: 24,
  boxSizing: "border-box",
  width: "100%",
  maxWidth: 1100,
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
  gap: 12,
  flexWrap: "wrap",
};

const h1Style: React.CSSProperties = {
  margin: 0,
  fontSize: 26,
};

const h2Style: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
  fontSize: 18,
};

const mutedTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#64748b",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: 24,
  borderRadius: 24,
  border: "1px solid #e2e8f0",
  boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
};

const primaryButton: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 16px",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg, #0ea5e9 0%, #22c55e 50%, #6366f1 100%)",
  color: "#ffffff",
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
  fontSize: 14,
  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.25)",
};

const secondaryButton: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid #cbd5f5",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  textDecoration: "none",
  cursor: "pointer",
  fontSize: 14,
};

const packsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
};

const packCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: 18,
  borderRadius: 20,
  border: "1px solid #e2e8f0",
  boxShadow: "0 16px 30px rgba(15, 23, 42, 0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const packHeaderRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 4,
  gap: 8,
};

const packTagStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  padding: "4px 8px",
  borderRadius: 999,
  backgroundColor: "#ecfeff",
  color: "#0e7490",
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const packUpsellStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  color: "#64748b",
};

const valuePropStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 500,
  color: "#0f172a",
  marginBottom: 16,
  maxWidth: 800,
};
