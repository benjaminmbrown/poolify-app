import AuthPanel from "@/components/AuthPanel"

export default function Home() {
  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
        color: "white",
      }}
    >
      {/* Background image (brighter + more visible) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/pool-design-before-after.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "brightness(0.92) contrast(1.15)", // <— MUCH more visible
          zIndex: 0,
        }}
      />

      {/* Softer gradient overlay to preserve visibility */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top, rgba(4,47,74,0.55) 0%, rgba(2,6,23,0.65) 55%)",
          zIndex: 1,
        }}
      />

      {/* Foreground content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          gap: 24,
          textShadow: "0 2px 8px rgba(0,0,0,0.45)", // enhance readability without darkening the image
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 600 }}>
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>Poolify.ai</h1>
          <p style={{ opacity: 0.95 }}>
            Upload a photo of your backyard and get AI-generated pool designs in
            minutes. Save your favorites, request more variations, and share
            them with your builder.
          </p>
        </div>

        <AuthPanel />
      </div>
    </main>
  )
}
