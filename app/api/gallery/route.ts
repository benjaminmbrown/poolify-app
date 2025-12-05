import { NextRequest, NextResponse } from "next/server"

const API_BASE = process.env.BACKEND_API_BASE || process.env.NEXT_PUBLIC_API_BASE!

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { error: "Missing token" },
        { status: 400 }
      )
    }

    const upstreamUrl = `${API_BASE}/api/gallery/${token}`

    const upstreamRes = await fetch(upstreamUrl, {
      method: "GET",
    })

    const text = await upstreamRes.text()

    return new NextResponse(text, {
      status: upstreamRes.status,
      headers: {
        "Content-Type":
          upstreamRes.headers.get("content-type") || "application/json",
      },
    })
  } catch (err: any) {
    console.error("/api/gallery proxy error:", err)
    return NextResponse.json(
      { error: err?.message || "Proxy error" },
      { status: 500 }
    )
  }
}
