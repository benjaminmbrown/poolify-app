"use client";

import * as React from "react";
import { useAuth } from "@/components/AuthContext";
import { useCredits } from "@/hooks/useCredits";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://poolify-backend-production.up.railway.app";

type Status = "idle" | "submitting" | "success" | "error";

const STYLE_OPTIONS = [
  "Modern",
  "Contemporary",
  "Tropical",
  "Minimalist",
  "Traditional",
  "Luxury",
  "Mediterranean",
] as const;

export default function StartDesignForm() {
  const auth = useAuth();
  const userId = auth?.userId || null;
  const authEmail = auth?.email || "";
  const authUser: any = auth?.user || null;

  const authNameFromMeta =
    authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || "";

  const [name, setName] = React.useState(authNameFromMeta || "");
  const [email, setEmail] = React.useState(authEmail);
  const [zip, setZip] = React.useState("");

  const [styleChoice, setStyleChoice] = React.useState<string>("");
  const [styleOther, setStyleOther] = React.useState("");

  const [intensity, setIntensity] = React.useState<string>("5"); // 1–10
  const [budget, setBudget] = React.useState<string>("5"); // 1–10
  const [numVariants, setNumVariants] = React.useState<string>("3"); // default

  const [file, setFile] = React.useState<File | null>(null);

  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [galleryUrl, setGalleryUrl] = React.useState<string | null>(null);
  // track if the user has manually edited these so we don't overwrite
  const [emailTouched, setEmailTouched] = React.useState(false);
  const [nameTouched, setNameTouched] = React.useState(false);

  const {
    credits,
    loading: creditsLoading,
    error: creditsError,
  } = useCredits();
  const noCredits = userId && credits !== null && credits <= 0;

  React.useEffect(() => {
    // if user logs in later, prefill email if user hasn't typed yet
    if (authEmail && !emailTouched) {
      setEmail(authEmail);
    }

    if (authNameFromMeta && !nameTouched) {
      setName(authNameFromMeta);
    }
  }, [authEmail, authNameFromMeta, emailTouched, nameTouched]);

  React.useEffect(() => {
    if (credits === null) return; // not logged in or not loaded yet

    if (credits <= 0) {
      setNumVariants("0");
      return;
    }

    const current = parseInt(numVariants || "0", 10);
    if (!current || current > credits) {
      // default to min(3, credits)
      const safeDefault = Math.min(credits, 3);
      setNumVariants(String(safeDefault));
    }
  }, [credits]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);
    setGalleryUrl(null);

    if (!email.trim()) {
      setStatus("error");
      setErrorMessage("Please enter an email address.");
      return;
    }

    if (!file) {
      setStatus("error");
      setErrorMessage("Please upload a photo of your backyard.");
      return;
    }

    const requested = parseInt(numVariants || "0", 10) || 0;
    if (userId) {
      if (noCredits) {
        setStatus("error");
        setErrorMessage(
          "You don't have any credits available. Please buy credits before creating a new gallery."
        );
        return;
      }

      if (!requested) {
        setStatus("error");
        setErrorMessage("Please choose how many designs you want.");
        return;
      }

      if (credits !== null && requested > credits) {
        setStatus("error");
        setErrorMessage(
          `You only have ${credits} credits but requested ${requested} designs. Please reduce the number of designs or buy more credits.`
        );
        return;
      }
    } else {
      if (!requested) {
        setStatus("error");
        setErrorMessage("Please choose how many designs you want.");
        return;
      }
    }

    // Work out the final style value:
    // - If "Other" is chosen and text is provided, send the text (custom style)
    // - Otherwise send the preset label (e.g. "Modern")
    let styleValue = styleChoice;
    if (styleChoice === "Other" && styleOther.trim()) {
      styleValue = styleOther.trim();
    }

    try {
      const formData = new FormData();
      if (userId) formData.append("user_id", userId);
      formData.append("email", email.trim());
      if (name.trim()) formData.append("name", name.trim());
      if (zip.trim()) formData.append("zip", zip.trim());

      if (styleChoice) {
        formData.append(
          "style",
          styleChoice === "Other" ? "Other" : styleChoice
        );
      }
      if (styleChoice === "Other" && styleOther.trim()) {
        formData.append("style_other", styleOther.trim());
      } else if (styleChoice !== "Other" && styleValue) {
        // For safety, also send the resolved style text
        formData.append("style_other", styleValue);
      }

      if (intensity) formData.append("intensity", intensity);
      if (budget) formData.append("budget", budget);
      const requested = parseInt(numVariants || "0", 10) || 0;
      formData.append("num_variants", String(requested));

      formData.append("file", file);

      const res = await fetch("/api/jobs/create", {
        method: "POST",
        body: formData,
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        // non-JSON response; ignore
      }

      if (!res.ok) {
        throw new Error(
          json?.error || res.statusText || "Failed to create job."
        );
      }

      if (json?.gallery_url) {
        setGalleryUrl(json.gallery_url);
      }

      setStatus("success");
    } catch (err: any) {
      console.error("StartDesignForm submit error:", err);
      setErrorMessage(
        err?.message || "Something went wrong. Please try again."
      );
      setStatus("error");
    }
  };

  const disabled = status === "submitting" || noCredits;

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>Start a new pool design</h2>
      <p style={helperTextStyle}>
        Upload a photo of your backyard and choose your style, intensity, and
        budget. We&apos;ll generate a gallery of pool ideas and email you the
        link when they&apos;re ready.
      </p>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>What&apos;s your name?</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => {
            setNameTouched(true);
            setName(e.target.value);
          }}
          placeholder="Optional"
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>What&apos;s your email?</label>
        <input
          style={inputStyle}
          type="email"
          value={email}
          onChange={(e) => {
            setEmailTouched(true);
            setEmail(e.target.value);
          }}
          placeholder="you@example.com"
          required
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>What&apos;s your zipcode?</label>
        <input
          style={inputStyle}
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="e.g. 66224"
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>
          Upload one clear photo of your backyard. <br/>
          Note: Ensure the ENTIRE area where you want to place pool is visible in the photo.
        </label>
        <input
          style={fileInputStyle}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          required
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Which styles of pool do you prefer?</label>
        <div style={chipRowStyle}>
          {STYLE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setStyleChoice(opt)}
              style={{
                ...chipButtonStyle,
                ...(styleChoice === opt ? chipButtonActiveStyle : {}),
              }}
            >
              {opt}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setStyleChoice("Other")}
            style={{
              ...chipButtonStyle,
              ...(styleChoice === "Other" ? chipButtonActiveStyle : {}),
            }}
          >
            Other
          </button>
        </div>
        {styleChoice === "Other" && (
          <input
            style={{ ...inputStyle, marginTop: 8 }}
            value={styleOther}
            onChange={(e) => setStyleOther(e.target.value)}
            placeholder='Example: "Palm Springs mid-century desert modern with warm neutrals"'
          />
        )}
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Style Intensity (1–10)</label>
        <div style={chipRowStyle}>
          {Array.from({ length: 10 }, (_, i) => `${i + 1}`).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setIntensity(val)}
              style={{
                ...chipButtonStyle,
                ...(intensity === val ? chipButtonActiveStyle : {}),
              }}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Budget Intensity (1–10)</label>
        <div style={chipRowStyle}>
          {Array.from({ length: 10 }, (_, i) => `${i + 1}`).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setBudget(val)}
              style={{
                ...chipButtonStyle,
                ...(budget === val ? chipButtonActiveStyle : {}),
              }}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>How many designs do you want?</label>

        {creditsLoading && userId && (
          <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
            Checking your available credits…
          </p>
        )}

        {creditsError && userId && (
          <p style={{ fontSize: 12, color: "#ffb0b0", marginBottom: 6 }}>
            Could not load your credits. You can still try submitting, but if
            you request more designs than you have credits, the job will fail.
          </p>
        )}

        {noCredits ? (
          <>
            <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
              You currently have <strong>0 credits</strong>. Please add credits
              before creating a new gallery.
            </p>
            <a
              href="/buy-credits"
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: 999,
                border: "none",
                background: "linear-gradient(135deg,#27b3ff,#3dffb3)",
                color: "#000",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Buy credits
            </a>
          </>
        ) : (
          <>
            {credits !== null && credits > 0 && (
              <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
                You currently have <strong>{credits}</strong> credits. You can
                request up to <strong>{credits}</strong> designs for this
                gallery.
              </p>
            )}

            {(() => {
              const maxDesigns =
                credits !== null && credits > 0
                  ? Math.min(credits, 20) // cap chips at 20 for UI sanity
                  : 12; // fallback if not logged in / no credits info

              const options = Array.from({ length: maxDesigns }, (_, i) =>
                String(i + 1)
              );

              return (
                <div style={chipRowStyle}>
                  {options.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setNumVariants(val)}
                      style={{
                        ...chipButtonStyle,
                        ...(numVariants === val ? chipButtonActiveStyle : {}),
                      }}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              );
            })()}
          </>
        )}
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
          {galleryUrl &&
            (() => {
              // extract token from backend URL
              const url = new URL(galleryUrl);
              const token = url.searchParams.get("token");

              // fallback: if no token, use backend URL anyway
              const appGalleryUrl = token
                ? `/gallery?token=${encodeURIComponent(token)}`
                : galleryUrl;

              return (
                <p style={{ margin: 0, fontSize: 12, marginTop: 4 }}>
                  You can also bookmark this link:{" "}
                  <a
                    href={appGalleryUrl}
                    style={{ color: "#3dffb3", textDecoration: "underline" }}
                  >
                    Open gallery
                  </a>
                </p>
              );
            })()}
        </div>
      )}

      <button type="submit" style={submitButtonStyle} disabled={disabled}>
        {status === "submitting" ? "Submitting…" : "Create my gallery"}
      </button>
    </form>
  );
}

/* Styles */

const formStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(0,0,0,0.35)",
  maxWidth: 520,
  width: "100%",
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: 14,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 4,
  fontSize: 13,
  opacity: 0.9,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(0,0,0,0.4)",
  color: "white",
  fontSize: 14,
  outline: "none",
};

const fileInputStyle: React.CSSProperties = {
  ...inputStyle,
  padding: "6px 8px",
};

const helperTextStyle: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.8,
  marginBottom: 12,
};

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
};

const successBoxStyle: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 8,
  padding: 10,
  borderRadius: 12,
  background: "rgba(0,80,30,0.6)",
  border: "1px solid rgba(61,255,179,0.5)",
};

const chipRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const chipButtonStyle: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(0,0,0,0.4)",
  color: "white",
  fontSize: 12,
  cursor: "pointer",
};

const chipButtonActiveStyle: React.CSSProperties = {
  border: "none",
  background: "linear-gradient(135deg,#27b3ff,#3dffb3)",
  color: "#000",
};
