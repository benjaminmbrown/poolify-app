import Image from "next/image";
import AuthPanel from "@/components/AuthPanel"

export default function Home() {
   return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 24,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
        background: "radial-gradient(circle at top, #042f4a 0, #020617 55%)",
        color: "white",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 600 }}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Poolify.ai</h1>
        <p style={{ opacity: 0.85 }}>
          Upload a photo of your backyard and get AI-generated pool designs in
          minutes. Save your favorites, request more variations, and share them
          with your builder.
        </p>
      </div>

      <AuthPanel />
    </main>
  )
}
