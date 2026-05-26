export default function HomePage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#030712",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{
        textAlign: "center",
        padding: 32,
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <h1 style={{
          color: "#8b5cf6",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 3,
          marginBottom: 8,
        }}>
          NXTZEN SECURITY PORTAL
        </h1>
        <p style={{ color: "#374151", fontSize: 12 }}>
          Access this page via your Telegram bot only.
        </p>
      </div>
    </div>
  );
}
