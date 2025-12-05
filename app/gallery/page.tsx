// GalleryPage.tsx
"use client";
import * as React from "react";
import { useAuth } from "@/components/AuthContext";
const API_BASE = "https://poolify-backend-production.up.railway.app";

type Job = {
  id: string;
  email?: string | null;
  status?: string | null;
  input_image_url?: string | null;
  style?: string | null;
  num_variants?: number | null;
  price?: number | null;
  gallery_token?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
  customer_name?: string | null;
  zip?: string | null;
  intensity?: string | null;
  budget?: string | null;
  features?: string | null;
  user_id?: string | null;
  job_type?: string | null;
};

type JobImage = {
  id: string;
  job_id: string;
  image_url: string;
  created_at?: string | null;
};

type GalleryResponse = {
  job: Job | null;
  images: JobImage[];
};

type InsufficientCreditsInfo = {
  error: "insufficient_credits";
  needed: number;
  remaining: number;
};

const CREDIT_PACKS = [
  { priceId: "price_10_credits", label: "Buy 10 credits" },
  { priceId: "price_25_credits", label: "Buy 25 credits" },
  { priceId: "price_60_credits", label: "Buy 60 credits" },
];

function getGalleryTokenFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

export default function GalleryPage() {
  const auth = useAuth() as any;
  const authUserId: string | null = auth?.userId || null;
  const authEmail: string | null = auth?.email || null;
  const authLoading: boolean = auth?.loading || false;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [job, setJob] = React.useState<Job | null>(null);
  const [images, setImages] = React.useState<JobImage[]>([]);
  const [debugToken, setDebugToken] = React.useState<string | null>(null);
  const [debugUrl, setDebugUrl] = React.useState<string | null>(null);

  const [fullscreenImage, setFullscreenImage] = React.useState<JobImage | null>(
    null
  );

  const [variantModalOpen, setVariantModalOpen] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<JobImage | null>(
    null
  );
  const [variantCount, setVariantCount] = React.useState<number>(4);
  const [variantBusy, setVariantBusy] = React.useState(false);
  const [variantMessage, setVariantMessage] = React.useState<string | null>(
    null
  );
  const [variantError, setVariantError] = React.useState<string | null>(null);
  const [insufficientCredits, setInsufficientCredits] =
    React.useState<InsufficientCreditsInfo | null>(null);

  React.useEffect(() => {
    const token = getGalleryTokenFromUrl();
    setDebugToken(token);

    if (!token) {
      setLoading(false);
      setError("Missing ?token=<gallery_token> in URL");
      return;
    }

    const url = `${API_BASE}/api/gallery/${token}`;
    setDebugUrl(url);

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${res.statusText} – ${text}`);
        }
        return res.json();
      })
      .then((json: GalleryResponse) => {
        setJob(json.job ?? null);
        setImages(json.images ?? []);
        setLoading(false);
      })
      .catch((err: any) => {
        console.error("Gallery fetch error:", err);
        setError(
          err?.message ||
            "Could not load your designs. Try opening the link from your email on the live site."
        );
        setLoading(false);
      });
  }, []);

  // While auth is loading, we still let them VIEW the gallery.
  // Actions (variants/credits) are gated below.

  // Basic states
  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>Loading your pool designs…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h2 style={h2Style}>Gallery Error</h2>
          <p>{error}</p>
          <pre style={debugBoxStyle}>
            {`token: ${debugToken ?? "null"}
url:   ${debugUrl ?? "null"}`}
          </pre>
        </div>
      </div>
    );
  }

  const title =
    job?.customer_name?.trim().length && job?.zip
      ? `${job.customer_name}'s Pool Ideas (${job.zip})`
      : "Your Poolify Designs";

  const totalVariantCredits = variantCount * 2;

  // Can this logged-in user request variants for this job?
  const canRequestVariants =
    !!authUserId &&
    !!authEmail &&
    (!job?.email || job.email.toLowerCase() === authEmail.toLowerCase());

  const handleOpenFullscreen = (img: JobImage) => {
    setFullscreenImage(img);
  };

  const handleDownload = (img: JobImage) => {
    if (typeof window === "undefined" || !img.image_url) return;
    const a = document.createElement("a");
    a.href = img.image_url;
    a.download = "poolify-design.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const openVariantModal = (img: JobImage) => {
    setSelectedImage(img);
    setVariantCount(4);
    setVariantMessage(null);
    setVariantError(null);
    setInsufficientCredits(null);

    if (!authUserId || !authEmail) {
      setVariantError(
        "Please log in to your Poolify account to create more designs."
      );
    } else if (
      job?.email &&
      job.email.toLowerCase() !== authEmail.toLowerCase()
    ) {
      setVariantError(
        "This gallery belongs to a different account. Please log in with the email you used for this project."
      );
    }

    setVariantModalOpen(true);
  };

  const handleCreateVariants = async () => {
    if (!job || !job.id) {
      setVariantError("Missing job information.");
      return;
    }
    if (!selectedImage) {
      setVariantError("Select an image first.");
      return;
    }
    if (!authUserId || !authEmail) {
      setVariantError(
        "Please log in to your Poolify account to create more designs."
      );
      return;
    }
    if (job.email && job.email.toLowerCase() !== authEmail.toLowerCase()) {
      setVariantError(
        "This gallery belongs to a different account. Please log in with the email you used for this project."
      );
      return;
    }

    setVariantBusy(true);
    setVariantError(null);
    setVariantMessage(null);
    setInsufficientCredits(null);

    try {
      const res = await fetch(`${API_BASE}/jobs/${job.id}/variants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: authUserId,
          base_image_url: selectedImage.image_url,
          num_variants: variantCount,
        }),
      });

      const json = await res.json().catch(() => null);

      if (res.status === 402 && json?.error === "insufficient_credits") {
        setInsufficientCredits({
          error: "insufficient_credits",
          needed: json.needed,
          remaining: json.remaining,
        });
        setVariantError(
          "You don't have enough credits to generate these variants."
        );
        return;
      }

      if (!res.ok) {
        throw new Error(json?.error || `HTTP ${res.status} ${res.statusText}`);
      }

      setVariantMessage(
        "Got it! Your new designs are queued. You'll receive an email when they're ready."
      );
    } catch (e: any) {
      console.error("Variant creation error:", e);
      setVariantError(
        e?.message || "Something went wrong while creating new designs."
      );
    } finally {
      setVariantBusy(false);
    }
  };

  const startCreditsCheckout = async (priceId: string) => {
    if (!authUserId) {
      setVariantError("Please log in to your account to purchase credits.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/credits/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: authUserId,
          price_id: priceId,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || `HTTP ${res.status} ${res.statusText}`);
      }

      if (json?.url) {
        window.location.href = json.url;
      } else {
        throw new Error("Checkout URL not returned from server.");
      }
    } catch (e: any) {
      console.error("Credits checkout error:", e);
      setVariantError(
        e?.message || "Could not start credits checkout. Please try again."
      );
    }
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      {/* Header */}
      <header style={headerRowStyle}>
        <div>
          <h1 style={h1Style}>{title}</h1>
          <p style={mutedStyle}>
            These designs were generated from your photo and preferences. Save
            any image you like and share it with your pool builder or
            landscaper.
          </p>
          {!authLoading && !authUserId && (
            <p style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
              To generate more designs or buy credits, please create an account
              or log in below, then start a new project.
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "flex-end",
          }}
        >
          <a href="/start" style={primaryButtonStyle}>
            Create New Gallery
          </a>

          <a
            href="/dashboard"
            style={{
              ...secondaryButtonStyle,
              fontSize: 12,
              padding: "6px 10px",
            }}
          >
            Go to Dashboard
          </a>
        </div>
      </header>

      {/* Job meta card */}
      {job && (
        <section style={{ ...cardStyle, marginBottom: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {job.style && <MetaChip label="Style" value={job.style} />}
            {job.intensity && (
              <MetaChip label="Intensity" value={job.intensity} />
            )}
            {job.budget && <MetaChip label="Budget" value={job.budget} />}
            {job.zip && <MetaChip label="Zip" value={job.zip} />}
            {job.features && <MetaChip label="Features" value={job.features} />}
          </div>
        </section>
      )}

      {/* Images */}
      {/* Images */}
      <section>
        {images.length === 0 ? (
          <div style={cardStyle}>
            <strong>No images found.</strong>
            <p style={mutedStyle}>
              If this seems wrong, reply to your Poolify email and we’ll take a
              look.
            </p>
            <div style={{ marginTop: 12 }}>
              <a href="/" style={primaryButtonStyle}>
                Create a New Gallery
              </a>
            </div>
          </div>
        ) : (
          <div style={gridStyle}>
            {images.map((img, index) => (
              <figure
                key={img.id ?? `${img.job_id}-${index}`}
                style={imgCardStyle}
              >
                <img
                  src={img.image_url}
                  alt={`Pool design ${index + 1}`}
                  style={imgStyle}
                />
                <figcaption style={captionStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>Design {index + 1}</span>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        style={smallButtonStyle}
                        onClick={() => handleOpenFullscreen(img)}
                      >
                        View full size
                      </button>
                      <button
                        style={smallButtonStyle}
                        onClick={() => handleDownload(img)}
                      >
                        Download
                      </button>
                      {canRequestVariants ? (
                        <button
                          style={primarySmallButtonStyle}
                          onClick={() => openVariantModal(img)}
                        >
                          More like this
                        </button>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            opacity: 0.7,
                          }}
                        >
                          Log in with this project&apos;s email to get more
                          designs.
                        </span>
                      )}
                    </div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      {/* Debug footer – leave for now, can be removed later */}
      <footer style={debugFooterStyle}>
        <div>
          <strong>Debug</strong>
        </div>
        <div style={{ fontSize: 11, whiteSpace: "pre-wrap" }}>
          {`token: ${debugToken ?? "null"}
url:   ${debugUrl ?? "null"}
images: ${images.length}`}
        </div>
      </footer>

      {/* Fullscreen image overlay */}
      {fullscreenImage && (
        <div style={overlayStyle} onClick={() => setFullscreenImage(null)}>
          <div style={overlayInnerStyle} onClick={(e) => e.stopPropagation()}>
            <img
              src={fullscreenImage.image_url}
              alt="Full size pool design"
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                display: "block",
                borderRadius: 16,
              }}
            />
            <button
              style={{
                ...primaryButtonStyle,
                marginTop: 16,
                width: "100%",
              }}
              onClick={() => setFullscreenImage(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Variant modal */}
      {variantModalOpen && selectedImage && (
        <div style={overlayStyle} onClick={() => setVariantModalOpen(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>
              More designs like this
            </h3>
            <p style={mutedStyle}>
              Choose how many new designs you want. Each new design costs{" "}
              <strong>2 credits</strong>.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                marginTop: 12,
                marginBottom: 8,
              }}
            >
              <label style={{ fontSize: 14 }}>Variants:</label>
              <input
                type="number"
                min={1}
                max={20}
                value={variantCount}
                onChange={(e) =>
                  setVariantCount(
                    Math.max(1, Math.min(20, Number(e.target.value) || 1))
                  )
                }
                style={{
                  width: 70,
                  padding: "4px 6px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(15,15,15,0.8)",
                  color: "white",
                }}
              />
            </div>

            <p style={{ fontSize: 13 }}>
              Total cost: <strong>{totalVariantCredits} credits</strong>
            </p>

            {variantMessage && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "#a0ffb5",
                }}
              >
                {variantMessage}
              </div>
            )}

            {variantError && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "#ffb0b0",
                }}
              >
                {variantError}
              </div>
            )}

            {insufficientCredits && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  paddingTop: 10,
                }}
              >
                <p style={{ marginBottom: 6 }}>
                  You need <strong>{insufficientCredits.needed}</strong> credits
                  but only have <strong>{insufficientCredits.remaining}</strong>
                  .
                </p>

                {authUserId ? (
                  <>
                    <p style={{ marginBottom: 6 }}>
                      Add credits to your account:
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {CREDIT_PACKS.map((pack) => (
                        <button
                          key={pack.priceId}
                          style={secondaryButtonStyle}
                          onClick={() => startCreditsCheckout(pack.priceId)}
                        >
                          {pack.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      opacity: 0.8,
                    }}
                  >
                    Log in to your account to purchase credits.
                  </p>
                )}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 18,
                justifyContent: "flex-end",
              }}
            >
              <button
                style={secondaryButtonStyle}
                onClick={() => setVariantModalOpen(false)}
                disabled={variantBusy}
              >
                Cancel
              </button>
              <button
                style={primaryButtonStyle}
                onClick={handleCreateVariants}
                disabled={variantBusy}
              >
                {variantBusy ? "Queueing…" : "Get more designs"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Small subcomponent for labels */
function MetaChip(props: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        fontSize: 12,
        display: "inline-flex",
        gap: 4,
        alignItems: "center",
      }}
    >
      <span style={{ opacity: 0.7 }}>{props.label}:</span>
      <span>{props.value}</span>
    </div>
  );
}

/* Styles */

const pageStyle: React.CSSProperties = {
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text'",
  padding: 24,
  maxWidth: 1100,
  margin: "0 auto",
};

const h1Style: React.CSSProperties = {
  fontSize: 28,
  margin: 0,
  marginBottom: 4,
};

const h2Style: React.CSSProperties = {
  fontSize: 22,
  marginTop: 0,
};

const mutedStyle: React.CSSProperties = {
  fontSize: 14,
  opacity: 0.85,
  color: "white",
};
const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 24,
};

const cardStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(0,0,0,0.2)",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
};

const imgCardStyle: React.CSSProperties = {
  borderRadius: 16,
  overflow: "hidden",
  margin: 0,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(0,0,0,0.4)",
};

const imgStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "auto",
};

const captionStyle: React.CSSProperties = {
  padding: "8px 10px",
  fontSize: 13,
  opacity: 0.9,
};

const debugBoxStyle: React.CSSProperties = {
  marginTop: 16,
  padding: 10,
  borderRadius: 10,
  background: "#050505",
  color: "#0f0",
  fontSize: 11,
  overflowX: "auto",
};

const debugFooterStyle: React.CSSProperties = {
  marginTop: 24,
  padding: 10,
  borderRadius: 12,
  background: "rgba(0,0,0,0.3)",
  fontSize: 11,
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.65)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const overlayInnerStyle: React.CSSProperties = {
  maxWidth: "90vw",
  padding: 16,
  borderRadius: 16,
  background: "rgba(30,30,30,0.95)",
  color: "white",
  boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
};

const modalStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  padding: 20,
  borderRadius: 16,
  background: "rgba(30,30,30,0.95)",
  color: "white",
  boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
  background: "linear-gradient(135deg, #27b3ff, #3dffb3)",
  color: "#000",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.2)",
  cursor: "pointer",
  fontSize: 14,
  background: "transparent",
  color: "inherit",
};

const smallButtonStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.25)",
  cursor: "pointer",
  fontSize: 11,
  background: "rgba(0,0,0,0.4)",
  color: "inherit",
};

const primarySmallButtonStyle: React.CSSProperties = {
  ...smallButtonStyle,
  border: "none",
  background: "linear-gradient(135deg, #27b3ff, #3dffb3)",
  color: "#000",
};
