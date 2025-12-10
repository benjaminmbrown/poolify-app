"use client";

import * as React from "react";
import { useAuth } from "@/components/AuthContext";
import { CreditsOverviewPanel } from "@/components/CreditsOverviewPanel";
import CouponRedeemer from "@/components/CouponRedeemer";

const JOBS_PAGE_SIZE = 20;

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
  // Optional thumbnail if you add it later
  input_thumbnail_url?: string | null;
};

type JobsResponse = {
  jobs?: JobSummary[];
  total?: number;
  limit?: number;
  offset?: number;
  has_more?: boolean;
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
  const [jobsTotal, setJobsTotal] = React.useState<number | null>(null);
  const [jobsHasMore, setJobsHasMore] = React.useState(false);
  const [jobsLoadingMore, setJobsLoadingMore] = React.useState(false);

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showCreditActivity, setShowCreditActivity] = React.useState(false); // NEW: collapsible state

  const API_BASE = "https://poolify-backend-production.up.railway.app";

  const fetchJobsPage = React.useCallback(
    async (offset: number, append: boolean) => {
      if (!userId) return;

      const jobsParams = new URLSearchParams({ user_id: userId });
      jobsParams.set("limit", String(JOBS_PAGE_SIZE));
      jobsParams.set("offset", String(offset));

      const jobsRes = await fetch(`/api/me/jobs?${jobsParams.toString()}`);
      const jobsJson: JobsResponse = await jobsRes.json();

      if (!jobsRes.ok || jobsJson.error) {
        throw new Error(jobsJson.error || jobsRes.statusText);
      }

      const newJobs = jobsJson.jobs || [];

      setJobs((prev) => {
        if (!append) {
          return newJobs;
        }

        const seen = new Set(prev.map((j) => j.id));
        const filteredNew = newJobs.filter((j) => !seen.has(j.id));

        return [...prev, ...filteredNew];
      });

      setJobsTotal(typeof jobsJson.total === "number" ? jobsJson.total : null);
      setJobsHasMore(!!jobsJson.has_more);
    },
    [userId]
  );

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
        // 1) Fetch credits
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

        // 2) Fetch first page of jobs
        await fetchJobsPage(0, false);

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
  }, [authLoading, userId, email, fetchJobsPage]);

  const handleLoadMore = async () => {
    if (!userId || jobsLoadingMore || !jobsHasMore) return;

    setJobsLoadingMore(true);
    setErrorMessage(null);

    try {
      const nextOffset = jobs.length;
      await fetchJobsPage(nextOffset, true);
    } catch (e: any) {
      console.error("Load more jobs error:", e);
      setErrorMessage(
        e?.message || "Could not load more galleries. Please try again."
      );
    } finally {
      setJobsLoadingMore(false);
    }
  };

  // ----- Render states -----

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
            <p style={{ color: "#b91c1c", fontSize: 14 }}>{errorMessage}</p>
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

        {/* 🔹 Combined credits + coupon row */}
        <section style={{ marginBottom: 24 }}>
          <div style={creditsRowStyle}>
            {/* Left: collapsible credit activity */}
            <div style={creditsColumnStyle}>
              <div style={collapsibleCardStyle}>
                <button
                  type="button"
                  onClick={() => setShowCreditActivity((prev) => !prev)}
                  style={collapsibleHeaderButtonStyle}
                >
                  <span>Credit activity</span>
                  <span
                    style={{
                      transform: showCreditActivity ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.15s ease-out",
                      fontSize: 14,
                    }}
                  >
                    ▶
                  </span>
                </button>

                {showCreditActivity && (
                  <div style={{ marginTop: 12 }}>
                    <CreditsOverviewPanel />
                  </div>
                )}
              </div>
            </div>

            {/* Right: coupon input */}
            <div style={creditsColumnStyle}>
              <CouponRedeemer
                apiBase={API_BASE}
                onCreditsUpdated={(newCredits: number) => setCredits(newCredits)}
              />
            </div>
          </div>
        </section>

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
            <>
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
                      {job.intensity !== null &&
                        job.intensity !== undefined && (
                          <span style={chipStyle}>
                            Intensity: {job.intensity}
                          </span>
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
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <img
                          src={job.input_thumbnail_url || job.input_image_url}
                          alt="Original backyard"
                          loading="lazy"
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

              {/* Load more footer */}
              {jobsHasMore && (
                <div
                  style={{
                    marginTop: 16,
                    textAlign: "center",
                  }}
                >
                  <button
                    style={secondaryButton}
                    onClick={handleLoadMore}
                    disabled={jobsLoadingMore}
                  >
                    {jobsLoadingMore
                      ? "Loading more galleries…"
                      : "Load more galleries"}
                  </button>
                  {jobsTotal !== null && (
                    <p
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        color: "#64748b",
                      }}
                    >
                      Showing {jobs.length} of {jobsTotal} galleries.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {errorMessage && (
            <p
              style={{
                marginTop: 12,
                fontSize: 13,
                color: "#b91c1c",
              }}
            >
              {errorMessage}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

/* Styles */

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
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  color: "#0f172a",
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

const primaryButtonSmall: React.CSSProperties = {
  ...primaryButton,
  padding: "8px 12px",
  fontSize: 13,
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

const jobsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
};

const jobCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: 18,
  borderRadius: 20,
  border: "1px solid #e2e8f0",
  boxShadow: "0 16px 30px rgba(15, 23, 42, 0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const chipStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: 999,
  border: "1px solid #e2e8f0",
  fontSize: 11,
  color: "#0f172a",
  backgroundColor: "#f8fafc",
};

/* NEW: credits row + collapsible styles */

const creditsRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  gap: 16,
  alignItems: "stretch",
};

const creditsColumnStyle: React.CSSProperties = {
  minWidth: 0,
};

const collapsibleCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: 16,
  borderRadius: 16,
  border: "1px solid #e2e8f0",
  boxShadow: "0 12px 24px rgba(15, 23, 42, 0.04)",
};

const collapsibleHeaderButtonStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  border: "none",
  background: "none",
  padding: 0,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  color: "#0f172a",
};
