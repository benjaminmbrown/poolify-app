"use client";

import * as React from "react";
import { useAuth } from "@/components/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

type Status = "checking-auth" | "no-user" | "loading" | "ready" | "error";

type JobSummary = {
  id: string;
  gallery_token?: string | null;
  gallery_url?: string | null;
  created_at?: string | null;
  status?: string | null;
  style?: string | null;
  budget?: number | string | null;
  intensity?: number | string | null;
  zip?: string | null;
  features?: string | null;
  input_image_url?: string | null;
};

type JobsResponse = {
  jobs?: JobSummary[];
  error?: string;
};

type CreditsResponse = {
  credits?: number;
  error?: string;
};

export default function DashboardPage() {
  const auth = useAuth();
  const userId = auth?.userId || null;
  const email = auth?.email || null;
  const authLoading = auth?.loading || false;

  const [status, setStatus] = React.useState<Status>("checking-auth");
  const [credits, setCredits] = React.useState<number | null>(null);
  const [jobs, setJobs] = React.useState<JobSummary[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading) return;

    const boot = async () => {
      setErrorMessage(null);

      if (!userId) {
        setStatus("no-user");
        return;
      }

      setStatus("loading");

      try {
        const creditParams = new URLSearchParams({ user_id: userId });
        if (email) {
          creditParams.set("email", email);
        }

        const creditsRes = await fetch(
          `/api/me/credits?${creditParams.toString()}`
        );

        const creditsJson: CreditsResponse = await creditsRes.json();

        if (!creditsRes.ok || creditsJson.error) {
          throw new Error(creditsJson.error || creditsRes.statusText);
        }

        setCredits(creditsJson.credits !== undefined ? creditsJson.credits : 0);

        const jobsParams = new URLSearchParams({ user_id: userId });
        const jobsRes = await fetch(`/api/me/jobs?${jobsParams.toString()}`);

        const jobsJson: JobsResponse = await jobsRes.json();

        if (!jobsRes.ok || jobsJson.error) {
          throw new Error(jobsJson.error || jobsRes.statusText);
        }

        setJobs(jobsJson.jobs || []);
        setStatus("ready");
      } catch (e: any) {
        console.error("Dashboard boot error:", e);
        setErrorMessage(
          e?.message || "Unexpected error while loading your dashboard."
        );
        setStatus("error");
      }
    };

    boot();
  }, [authLoading, userId, email]);

  if (status === "checking-auth" || status === "loading") {
    return (
      <div style={outerStyle}>
        <div style={scrollAreaStyle}>
          <div style={cardStyle}>Loading your dashboard…</div>
        </div>
      </div>
    );
  }

  if (status === "no-user" || !userId) {
    return (
      <div style={outerStyle}>
        <div style={scrollAreaStyle}>
          <div style={cardStyle}>
            <h2 style={h2Style}>Sign in to view your dashboard</h2>
            <p style={mutedTextStyle}>
              Your Poolify dashboard shows your saved galleries, design history,
              and credit balance. Go to the home page, log in or create an
              account, then come back here.
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
            <h2 style={h2Style}>Problem loading dashboard</h2>
            <p style={{ color: "#ffb0b0", fontSize: 14 }}>{errorMessage}</p>
            <a href="/" style={secondaryButton}>
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={outerStyle}>
      <div style={scrollAreaStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={h1Style}>Your Poolify Dashboard</h1>
            <p style={mutedTextStyle}>
              {email && (
                <>
                  Signed in as <strong>{email}</strong>
                  {" · "}
                </>
              )}
              Credits: <strong>{credits !== null ? credits : 0}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a href="/start" style={primaryButton}>
              Create New Gallery
            </a>
            <a href="/buy-credits" style={secondaryButton}>
              Get Credits
            </a>
            <a href="/" style={secondaryButton}>
              Home
            </a>
          </div>
        </header>

        <section>
          <h2 style={h2Style}>Your Galleries</h2>

          {jobs.length === 0 ? (
            <div style={cardStyle}>
              <p style={mutedTextStyle}>
                You don&apos;t have any pool designs yet. Start by submitting a
                photo to see your first set of AI pool designs.
              </p>
              <div style={{ marginTop: 12 }}>
                <a href="/start" style={primaryButtonSmall}>
                  Upload your first photo & see designs
                </a>
              </div>
            </div>
          ) : (
            <div style={jobsGridStyle}>
              {jobs.map((job) => (
                <div key={job.id} style={jobCardStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {job.zip ? `Designs for ${job.zip}` : "Poolify Designs"}
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        opacity: 0.75,
                        textTransform: "capitalize",
                      }}
                    >
                      {job.status || "pending"}
                    </span>
                  </div>
                  {job.created_at && (
                    <div
                      style={{
                        fontSize: 11,
                        opacity: 0.7,
                        marginBottom: 6,
                      }}
                    >
                      Created {new Date(job.created_at).toLocaleString()}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 10,
                      fontSize: 12,
                    }}
                  >
                    {job.style && (
                      <span style={chipStyle}>Style: {job.style}</span>
                    )}
                    {job.budget !== null && job.budget !== undefined && (
                      <span style={chipStyle}>Budget: {job.budget}</span>
                    )}
                    {job.intensity !== null && job.intensity !== undefined && (
                      <span style={chipStyle}>Intensity: {job.intensity}</span>
                    )}
                    {job.features && (
                      <span style={chipStyle}>Features: {job.features}</span>
                    )}
                  </div>
                  {job.input_image_url && (
                    <div
                      style={{
                        marginBottom: 10,
                        borderRadius: 12,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <img
                        src={job.input_image_url}
                        alt="Original backyard"
                        style={{
                          width: "100%",
                          display: "block",
                          maxHeight: 140,
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}

                  {(job.gallery_token || job.gallery_url) && (
                    <a
                      href={
                        job.gallery_token
                          ? `/gallery?token=${encodeURIComponent(
                              job.gallery_token || ""
                            )}`
                          : job.gallery_url || "#"
                      }
                      style={primaryButtonSmall}
                    >
                      View gallery
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* Styles reused from your existing TSX */

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
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
  color: "white",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 24,
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
  opacity: 0.8,
};

const cardStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.3)",
  padding: 20,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.1)",
};

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
};

const primaryButtonSmall: React.CSSProperties = {
  ...primaryButton,
  padding: "8px 12px",
  fontSize: 13,
};

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
};

const jobsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
};

const jobCardStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.3)",
  padding: 16,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.1)",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const chipStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.2)",
  fontSize: 11,
  opacity: 0.9,
};
