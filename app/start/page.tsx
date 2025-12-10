import StartDesignForm from "@/components/StartDesignForm"

export default function StartPage() {
  return (
    <div style={outerStyle}>
      <div style={innerStyle}>
        <StartDesignForm />
      </div>
    </div>
  )
}

const outerStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#f8fafc",
  color: "#0f172a",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  padding: 24,
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

const innerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 1100,
}
