// app/api/me/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://poolify-backend-production.up.railway.app";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const user_id = searchParams.get("user_id");
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");

  if (!user_id) {
    return NextResponse.json(
      { error: "Missing user_id" },
      { status: 400 }
    );
  }

  const qs = new URLSearchParams();
  qs.set("user_id", user_id);
  if (limit) qs.set("limit", limit);
  if (offset) qs.set("offset", offset);

  const backendUrl = `${API_BASE}/me/jobs?${qs.toString()}`;

  const res = await fetch(backendUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    // If your backend is private, you might also need an API key header here
  });

  const data = await res.json().catch(() => ({}));

  return NextResponse.json(data, { status: res.status });
}
