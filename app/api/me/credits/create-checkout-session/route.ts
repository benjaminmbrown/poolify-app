// app/api/me/credits/create-checkout-session/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.BACKEND_API_BASE || process.env.NEXT_PUBLIC_API_BASE!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, price_id } = body || {};

    if (!user_id || !price_id) {
      return NextResponse.json(
        { error: "Missing user_id or price_id" },
        { status: 400 }
      );
    }

    const upstreamRes = await fetch(
      `${API_BASE}/credits/create-checkout-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id, price_id }),
      }
    );

    const text = await upstreamRes.text();

    return new NextResponse(text, {
      status: upstreamRes.status,
      headers: {
        "Content-Type":
          upstreamRes.headers.get("content-type") || "application/json",
      },
    });
  } catch (err: any) {
    console.error(
      "/api/me/credits/create-checkout-session proxy error:",
      err
    );
    return NextResponse.json(
      { error: err?.message || "Proxy error" },
      { status: 500 }
    );
  }
}
