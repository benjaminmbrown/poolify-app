// app/api/jobs/[id]/variants/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.BACKEND_API_BASE || process.env.NEXT_PUBLIC_API_BASE!;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let jobId: string | undefined;

  try {
    const resolvedParams = await params;
    jobId = resolvedParams.id;

    if (!jobId) {
      return NextResponse.json({ error: "Missing job id" }, { status: 400 });
    }

    const body = await req.text(); // pass through raw JSON

    const upstreamRes = await fetch(`${API_BASE}/jobs/${jobId}/variants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
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
    console.error(
      `/api/jobs/${jobId ?? "unknown"}/variants proxy error:`,
      err
    );
    return NextResponse.json(
      { error: err?.message || "Proxy error" },
      { status: 500 }
    );
  }
}
