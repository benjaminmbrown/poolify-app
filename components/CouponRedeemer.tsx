"use client";

import * as React from "react";
import { useAuth } from "@/components/AuthContext";

type CouponRedeemerProps = {
  apiBase: string;
  onCreditsUpdated?: (newCredits: number) => void;
};

type RedeemResponse = {
  success?: boolean;
  credits?: number;
  error?: string;
};

const CouponRedeemer: React.FC<CouponRedeemerProps> = ({
  apiBase,
  onCreditsUpdated,
}) => {
  const auth = useAuth(); // <-- no destructuring of { session }
  const [code, setCode] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [messageType, setMessageType] = React.useState<
    "success" | "error" | null
  >(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();

    if (!trimmed) return;

    if (!auth) {
      setMessageType("error");
      setMessage("You need to be logged in to redeem a coupon.");
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);
      setMessageType(null);

      // Pull access token off whatever your AuthContext actually provides.
      // This matches common patterns you've probably used elsewhere.
      const accessToken =
        (auth as any).session?.access_token ??
        (auth as any).accessToken ??
        (auth as any).access_token;

      if (!accessToken) {
        setMessageType("error");
        setMessage("Could not find a valid access token.");
        setIsLoading(false);
        return;
      }

      const res = await fetch(`${apiBase}/api/redeem-coupon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ coupon: trimmed }),
      });

      const data: RedeemResponse = await res.json();

      if (!res.ok || !data.success) {
        setMessageType("error");
        setMessage(data.error || "Could not redeem coupon. Please try again.");
        return;
      }

      setMessageType("success");
      setMessage(
        `Coupon applied! Your new balance is ${data.credits ?? 0} credits.`
      );
      setCode("");

      if (onCreditsUpdated && typeof data.credits === "number") {
        onCreditsUpdated(data.credits);
      }
    } catch (err) {
      console.error("Redeem error", err);
      setMessageType("error");
      setMessage("Something went wrong redeeming your coupon.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        borderRadius: 8,
        padding: 16,
        border: "1px solid #e2e8f0",
        marginTop: 16,
        maxWidth: 400,
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16, fontWeight: 600 }}>
        Have a coupon?
      </h3>
      <p
        style={{
          marginTop: 0,
          marginBottom: 12,
          fontSize: 13,
          color: "#64748b",
        }}
      >
        Enter your Product Hunt code (for example, <strong>PHLAUNCH</strong>) to
        get bonus credits.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !code.trim()}
          style={{
            padding: "8px 14px",
            borderRadius: 6,
            border: "none",
            backgroundColor: isLoading || !code.trim() ? "#cbd5e1" : "#0ea5e9",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            cursor: isLoading || !code.trim() ? "default" : "pointer",
          }}
        >
          {isLoading ? "Applying..." : "Apply"}
        </button>
      </form>

      {message && (
        <p
          style={{
            marginTop: 10,
            fontSize: 13,
            color: messageType === "success" ? "#16a34a" : "#dc2626",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default CouponRedeemer;
