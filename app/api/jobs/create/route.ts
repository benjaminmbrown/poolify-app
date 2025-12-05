import { NextRequest, NextResponse } from "next/server"

const API_BASE = process.env.BACKEND_API_BASE || process.env.NEXT_PUBLIC_API_BASE!

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || ""

    // Stream the body straight through to your backend
    const upstreamRes = await fetch(`${API_BASE}/jobs/from-app`, {
      method: "POST",
      headers: {
        "content-type": contentType,
      },
      body: req.body,
    })

    const text = await upstreamRes.text()

    return new NextResponse(text, {
      status: upstreamRes.status,
      headers: {
        "content-type":
          upstreamRes.headers.get("content-type") || "application/json",
      },
    })
  } catch (err: any) {
    console.error("/api/jobs/create proxy error:", err)
    return NextResponse.json(
      { error: err?.message || "Proxy error" },
      { status: 500 }
    )
  }
}
