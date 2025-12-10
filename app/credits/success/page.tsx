// app/credits/success/page.tsx
import * as React from "react";
import { Suspense } from "react";
import { CreditsSuccessClient } from "./CreditsSuccessClient";

export default function CreditsSuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: "#f8fafc",
            color: "#0f172a",
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              padding: 24,
              boxSizing: "border-box",
              width: "100%",
              maxWidth: 720,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: 28,
                borderRadius: 24,
                border: "1px solid #e2e8f0",
                boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
                fontSize: 14,
                color: "#64748b",
              }}
            >
              Confirming your payment…
            </div>
          </div>
        </div>
      }
    >
      <CreditsSuccessClient />
    </Suspense>
  );
}
