// app/api/me/credits/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.BACKEND_API_BASE || process.env.NEXT_PUBLIC_API_BASE!;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const email = searchParams.get("email");

    if (!userId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const upstreamUrl = new URL(`${API_BASE}/me/credits`);
    upstreamUrl.searchParams.set("user_id", userId);
    if (email) upstreamUrl.searchParams.set("email", email);

    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: "GET",
      // Add auth headers here if needed
    });

    const text = await upstreamRes.text();

    return new NextResponse(text, {
      status: upstreamRes.status,
      headers: {
        "Content-Type":
          upstreamRes.headers.get("content-type") || "application/json",
      },
    });
  } catch (err: any) {
    console.error("/api/me/credits proxy error:", err);
    return NextResponse.json(
      { error: err?.message || "Proxy error" },
      { status: 500 }
    );
  }
}
