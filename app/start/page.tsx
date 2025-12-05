import StartDesignForm from "@/components/StartDesignForm"

export default function StartPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <StartDesignForm />
    </div>
  )
}
