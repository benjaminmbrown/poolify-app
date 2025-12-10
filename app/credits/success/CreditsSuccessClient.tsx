// app/credits/success/CreditsSuccessClient.tsx
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

type Status = "checking-auth" | "no-user" | "loading-data" | "ready" | "error";

type Profile = {
  credits?: number;
  email?: string | null;
  [key: string]: any;
};

type Purchase = {
  id: string;
  credits_purchased: number;
  status: string;
  created_at: string;
};

type ProfileResponse = {
  profile?: Profile;
  recent_jobs?: any[];
  recent_purchases?: Purchase[];
  error?: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export function CreditsSuccessClient() {
  const auth = useAuth();
  const userId = auth?.userId || null;
  const email = auth?.email || null;
  const authLoading = auth?.loading || false;

  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = React.useState<Status>("checking-auth");
  const [credits, setCredits] = React.useState<number | null>(null);
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showConfetti, setShowConfetti] = React.useState(true);

  React.useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      setStatus("no-user");
      return;
    }

    const fetchProfile = async () => {
      try {
        setStatus("loading-data");
        setErrorMessage(null);

        const params = new URLSearchParams({ user_id: userId });
        if (email) params.set("email", email);

        const url = `${API_BASE}/me/profile?${params.toString()}`;
        console.log("[CreditsSuccess] Fetching profile from:", url, {
          sessionId,
        });

        const res = await fetch(url);
        const json: ProfileResponse = await res.json();

        if (!res.ok || json.error) {
          throw new Error(json.error || res.statusText);
        }

        const profileCredits = json.profile?.credits ?? 0;
        setCredits(profileCredits);
        setPurchases(json.recent_purchases || []);
        setStatus("ready");
      } catch (e: any) {
        console.error("CreditsSuccess fetch error:", e);
        setErrorMessage(
          e?.message ||
            "We added your credits, but couldn’t load your account details."
        );
        setStatus("error");
      }
    };

    fetchProfile();
  }, [authLoading, userId, email, sessionId]);

  React.useEffect(() => {
    if (!showConfetti) return;
    const timeout = setTimeout(() => setShowConfetti(false), 2200);
    return () => clearTimeout(timeout);
  }, [showConfetti]);

  if (status === "checking-auth" || status === "loading-data") {
    return (
      <div style={outerStyle}>
        <div style={scrollAreaStyle}>
          <div style={cardStyle}>Confirming your payment…</div>
        </div>
      </div>
    );
  }

  if (status === "no-user" || !userId) {
    return (
      <div style={outerStyle}>
        <div style={scrollAreaStyle}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Payment received</h2>
            <p style={mutedTextStyle}>
              Your payment was successful, but we couldn’t detect a signed-in
              account. Please sign in with the same email you used at checkout
              to see your updated credits.
            </p>
            <a href="/" style={primaryButton}>
              Go to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  const showCredits =
    status === "ready" || (status === "error" && credits !== null);

  const roughGalleries =
    credits !== null ? Math.max(1, Math.floor(credits / 3)) : null;

  const nextSteps = getNextSteps(credits ?? 0);

  return (
    <div style={outerStyle}>
      {showConfetti && <ConfettiBurst />}
      <div style={scrollAreaStyle}>
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={checkCircleStyle}>✓</div>
            <div>
              <h1 style={h1Style}>Payment successful</h1>
              <p style={mutedTextStyle}>
                Your credits have been added to your Poolify account.
              </p>
            </div>
          </div>

          {showCredits && (
            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>
                Current balance
              </p>
              <p style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>
                {credits ?? 0} credits
              </p>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>
                Use credits to create new pool design galleries or add more
                variants to your favorite concepts.
              </p>

              {roughGalleries && (
                <p style={valueHintStyle}>
                  That’s enough for roughly{" "}
                  <span style={{ fontWeight: 600 }}>{roughGalleries}</span> full
                  sets of designs so you can confidently plan your $80,000+
                  backyard project.
                </p>
              )}
            </div>
          )}

          {errorMessage && (
            <p style={{ color: "#b91c1c", fontSize: 13, marginTop: 16 }}>
              {errorMessage}
            </p>
          )}

          {nextSteps.length > 0 && (
            <section style={{ marginTop: 28 }}>
              <h3 style={sectionTitleStyle}>What to do next</h3>
              <ul style={nextStepsListStyle}>
                {nextSteps.map((step, idx) => (
                  <li key={idx} style={nextStepItemStyle}>
                    <span style={bulletDotStyle} />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {purchases.length > 0 && (
            <section style={{ marginTop: 28 }}>
              <h3 style={sectionTitleStyle}>Recent credit purchases</h3>
              <div style={timelineContainerStyle}>
                {purchases.map((p) => (
                  <div key={p.id} style={timelineItemStyle}>
                    <div style={timelineDotStyle} />
                    <div style={timelineContentStyle}>
                      <div style={timelineHeaderRowStyle}>
                        <span style={timelineTitleStyle}>
                          +{p.credits_purchased} credits
                        </span>
                        <span
                          style={{
                            ...timelineStatusStyle,
                            ...(p.status === "completed"
                              ? timelineStatusCompletedStyle
                              : p.status === "pending"
                              ? timelineStatusPendingStyle
                              : timelineStatusOtherStyle),
                          }}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div style={timelineMetaStyle}>
                        {formatDateTime(p.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div style={ctaRowStyle}>
            <a href="/dashboard" style={primaryButton}>
              Go to Dashboard
            </a>
            <a href="/" style={secondaryButton}>
              Start a new design
            </a>
          </div>

          <p style={footnoteStyle}>
            If something doesn’t look right with your credits, reply to your
            receipt email or contact support at{" "}
            <a href="mailto:hello@poolify.ai">hello@poolify.ai</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

/* --- Confetti + helpers + styles (unchanged from your page.tsx) --- */

function ConfettiBurst() {
  const pieces = React.useMemo(
    () =>
      Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.4 + Math.random() * 0.6,
        size: 5 + Math.random() * 6,
        rotate: Math.random() * 360,
      })),
    []
  );

  return (
    <div style={confettiContainerStyle} aria-hidden="true">
      <style>
        {`
          @keyframes poolify-confetti-fall {
            0% {
              transform: translate3d(0, -40px, 0) rotateZ(0deg);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            100% {
              transform: translate3d(0, 120vh, 0) rotateZ(360deg);
              opacity: 0;
            }
          }
        `}
      </style>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: "-40px",
            left: `${p.left}vw`,
            width: p.size,
            height: p.size * 3,
            borderRadius: 999,
            background:
              p.id % 3 === 0
                ? "#38bdf8"
                : p.id % 3 === 1
                ? "#22c55e"
                : "#6366f1",
            opacity: 0,
            transform: `rotate(${p.rotate}deg)`,
            animationName: "poolify-confetti-fall",
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            animationTimingFunction: "cubic-bezier(0.15, 0.65, 0.35, 1)",
            animationFillMode: "forwards",
          }}
        />
      ))}
    </div>
  );
}

function getNextSteps(credits: number): string[] {
  if (credits <= 0) {
    return [
      "If this looks wrong, double-check your Stripe receipt and contact support.",
    ];
  }

  if (credits < 10) {
    return [
      "Upload a clear photo of your backyard and create your first AI pool gallery.",
      "Bookmark your favorite design and note what you like about it.",
      "Test a small variant set on your top design to explore a second option.",
    ];
  }

  if (credits <= 40) {
    return [
      "Create 2–3 galleries for different angles or lighting conditions.",
      "Run variants on your top 1–2 concepts to explore layout alternatives.",
      "Share the best designs with your builder or partner to get early feedback.",
    ];
  }

  return [
    "Plan multiple galleries to explore different pool styles (modern, tropical, luxury, etc.).",
    "Use variants to refine details like tanning ledges, spas, and fire/water features.",
    "Save a shortlist of build-ready concepts to compare against real construction quotes.",
  ];
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/* Styles from your original page.tsx */

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
  maxWidth: 720,
  margin: "0 auto",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: 28,
  borderRadius: 24,
  border: "1px solid #e2e8f0",
  boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
};

const h1Style: React.CSSProperties = {
  margin: 0,
  fontSize: 26,
};

const mutedTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#64748b",
};

const primaryButton: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 18px",
  borderRadius: 999,
  border: "none",
  background:
    "linear-gradient(135deg, #0ea5e9 0%, #22c55e 50%, #6366f1 100%)",
  color: "#ffffff",
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
  fontSize: 14,
  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.25)",
  textAlign: "center",
};

const secondaryButton: React.CSSProperties = {
  display: "inline-block",
  padding: "9px 16px",
  borderRadius: 999,
  border: "1px solid #cbd5f5",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  textDecoration: "none",
  cursor: "pointer",
  fontSize: 14,
  textAlign: "center",
};

const checkCircleStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: "999px",
  backgroundColor: "#ecfdf5",
  color: "#16a34a",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
  fontWeight: 700,
};

const ctaRowStyle: React.CSSProperties = {
  marginTop: 28,
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const footnoteStyle: React.CSSProperties = {
  marginTop: 20,
  fontSize: 12,
  color: "#94a3b8",
};

const valueHintStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 13,
  color: "#0f172a",
  backgroundColor: "#f1f5f9",
  borderRadius: 999,
  padding: "6px 12px",
  display: "inline-block",
};

const confettiContainerStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  overflow: "hidden",
  zIndex: 40,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  color: "#0f172a",
  marginBottom: 8,
};

const nextStepsListStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const nextStepItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  fontSize: 13,
  color: "#1e293b",
};

const bulletDotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: 999,
  marginTop: 6,
  background:
    "linear-gradient(135deg, #0ea5e9 0%, #22c55e 50%, #6366f1 100%)",
};

const timelineContainerStyle: React.CSSProperties = {
  marginTop: 4,
  borderLeft: "1px solid #e2e8f0",
  paddingLeft: 14,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const timelineItemStyle: React.CSSProperties = {
  position: "relative",
  paddingLeft: 0,
};

const timelineDotStyle: React.CSSProperties = {
  position: "absolute",
  left: -15,
  top: 6,
  width: 9,
  height: 9,
  borderRadius: 999,
  backgroundColor: "#0ea5e9",
  border: "2px solid #e0f2fe",
};

const timelineContentStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const timelineHeaderRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
};

const timelineTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#0f172a",
};

const timelineMetaStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
};

const timelineStatusStyle: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.04,
  padding: "3px 8px",
  borderRadius: 999,
  border: "1px solid transparent",
};

const timelineStatusCompletedStyle: React.CSSProperties = {
  backgroundColor: "#ecfdf5",
  color: "#166534",
  borderColor: "#bbf7d0",
};

const timelineStatusPendingStyle: React.CSSProperties = {
  backgroundColor: "#fefce8",
  color: "#92400e",
  borderColor: "#fef08a",
};

const timelineStatusOtherStyle: React.CSSProperties = {
  backgroundColor: "#fee2e2",
  color: "#b91c1c",
  borderColor: "#fecaca",
};
