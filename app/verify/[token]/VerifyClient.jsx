"use client";

import { useEffect, useState, useRef } from "react";

// ── Lightweight device fingerprint (no external lib needed) ──
async function collectFingerprint() {
  const components = {};

  // Screen
  components.screen = `${screen.width}x${screen.height}x${screen.colorDepth}`;
  components.viewport = `${window.innerWidth}x${window.innerHeight}`;

  // Timezone
  components.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  components.locale = navigator.language;

  // Platform
  components.platform = navigator.platform;
  components.vendor = navigator.vendor;
  components.cores = navigator.hardwareConcurrency;
  components.memory = navigator.deviceMemory || "unknown";
  components.touchPoints = navigator.maxTouchPoints;

  // Plugins (desktop)
  try {
    components.plugins = Array.from(navigator.plugins)
      .map((p) => p.name)
      .slice(0, 5)
      .join(",");
  } catch {
    components.plugins = "";
  }

  // Canvas fingerprint
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("NxtZen🔐", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("NxtZen🔐", 4, 17);
    components.canvas = canvas.toDataURL().slice(-50);
  } catch {
    components.canvas = "";
  }

  // WebGL
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      components.webgl = ext
        ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER);
    }
  } catch {
    components.webgl = "";
  }

  // Audio fingerprint
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ac.createOscillator();
    const analyser = ac.createAnalyser();
    const gain = ac.createGain();
    gain.gain.value = 0;
    osc.connect(analyser);
    analyser.connect(gain);
    gain.connect(ac.destination);
    osc.start(0);
    const freqData = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(freqData);
    osc.stop();
    await ac.close();
    components.audio = freqData.slice(0, 5).join(",");
  } catch {
    components.audio = "";
  }

  // Build hash
  const raw = Object.values(components).join("|");
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const fingerprint = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return { fingerprint, components };
}

// ── Particle Background ──
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.alpha})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

// ── Fingerprint SVG Icon ──
function FingerprintIcon({ scanning, verified, failed }) {
  const color = failed ? "#ef4444" : verified ? "#10b981" : scanning ? "#8b5cf6" : "#6b7280";
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={scanning || verified ? "url(#glow)" : "none"}>
        <path
          d="M40 8C22.3 8 8 22.3 8 40"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transition: "stroke 0.5s" }}
        />
        <path
          d="M40 8C57.7 8 72 22.3 72 40"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M15 52C13.1 48.3 12 44.3 12 40"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M40 20C28.95 20 20 28.95 20 40"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M40 20C51.05 20 60 28.95 60 40"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
        />
        <path
          d="M26 54C23.5 50 22 45.2 22 40"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M40 30C34.5 30 30 34.5 30 40C30 48 34 55 40 60"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M40 30C45.5 30 50 34.5 50 40C50 46 48 51.5 44 56"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="40" cy="40" r="3" fill={color} />
      </g>
    </svg>
  );
}

// ── Main Component ──
export default function VerifyClient({ token, session }) {
  const [state, setState] = useState("idle"); // idle | scanning | success | error | expired | invalid
  const [message, setMessage] = useState("");
  const [fingerprint, setFingerprint] = useState("");
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  // Dots animation
  useEffect(() => {
    if (state !== "scanning") return;
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(id);
  }, [state]);

  // Check session validity on load
  useEffect(() => {
    if (!session) {
      setState("invalid");
      return;
    }
    if (session.status === "verified") {
      setState("success");
      setMessage("Already verified! Redirecting to bot...");
      setRedirecting(true);
      setTimeout(() => {
        window.location.href = `https://t.me/${session.bot_username}`;
      }, 2000);
      return;
    }
    if (session.status === "expired" || (session.expires_at && new Date() > new Date(session.expires_at))) {
      setState("expired");
      return;
    }
    if (session.status === "failed") {
      setState("error");
      setMessage("This session failed verification. Please get a new link from the bot.");
      return;
    }
  }, [session]);

  const handleVerify = async () => {
    if (state === "scanning") return;
    setState("scanning");
    setProgress(0);

    // Animate progress
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 12;
      if (p > 90) p = 90;
      setProgress(Math.floor(p));
    }, 200);

    try {
      const { fingerprint: fp, components } = await collectFingerprint();
      setFingerprint(fp);

      clearInterval(interval);
      setProgress(95);

      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fingerprint: fp, components }),
      });

      const data = await res.json();
      setProgress(100);

      if (!res.ok) {
        setState("error");
        if (data.code === "DEVICE_CONFLICT") {
          setMessage("🚫 This device is already linked to another account. Multi-account usage is not permitted.");
        } else {
          setMessage(data.error || "Verification failed. Please try again.");
        }
        return;
      }

      setState("success");
      setMessage("✅ Device verified successfully!");
      setRedirecting(true);

      setTimeout(() => {
        const botUser = session?.bot_username || data.bot_username;
        if (botUser) {
          window.location.href = `https://t.me/${botUser}`;
        }
      }, 2500);
    } catch (err) {
      clearInterval(interval);
      setState("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  };

  const shortFp = fingerprint
    ? fingerprint.slice(0, 8).toUpperCase() + "..." + fingerprint.slice(-8).toUpperCase()
    : "";

  // ── Render States ──
  const renderContent = () => {
    if (state === "invalid") {
      return (
        <StateCard
          icon="❌"
          title="INVALID LINK"
          subtitle="This verification link does not exist or has already been used."
          color="#ef4444"
        />
      );
    }

    if (state === "expired") {
      return (
        <StateCard
          icon="⏰"
          title="LINK EXPIRED"
          subtitle="This verification link has expired (10 min limit). Please send /start in the bot to get a new link."
          color="#f59e0b"
        />
      );
    }

    if (state === "error") {
      return (
        <StateCard
          icon="🚫"
          title="VERIFICATION FAILED"
          subtitle={message}
          color="#ef4444"
        />
      );
    }

    if (state === "success") {
      return (
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>✅</div>
            <div style={{ color: "#10b981", fontSize: 22, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
              VERIFIED
            </div>
            {fingerprint && (
              <div style={{
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: 8,
                padding: "8px 16px",
                display: "inline-block",
                marginBottom: 12,
              }}>
                <span style={{ color: "#6b7280", fontSize: 11, display: "block", marginBottom: 2 }}>DEVICE ID</span>
                <span style={{ color: "#10b981", fontSize: 12, fontFamily: "monospace" }}>{shortFp}</span>
              </div>
            )}
            {redirecting && (
              <div style={{ color: "#6b7280", fontSize: 13, marginTop: 8 }}>
                Redirecting to Telegram bot<span style={{ color: "#8b5cf6" }}>{dots || "..."}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Default: idle or scanning
    return (
      <div style={{ textAlign: "center" }}>
        {/* Fingerprint icon */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 20,
          animation: state === "scanning" ? "pulse 1.5s infinite" : "none",
        }}>
          <FingerprintIcon
            scanning={state === "scanning"}
            verified={state === "success"}
            failed={state === "error"}
          />
        </div>

        {/* User ID badge */}
        {session?.user_id && (
          <div style={{
            background: "rgba(139,92,246,0.1)",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: 8,
            padding: "10px 20px",
            marginBottom: 20,
            display: "inline-block",
          }}>
            <div style={{ color: "#6b7280", fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>TELEGRAM USER ID</div>
            <div style={{ color: "#c4b5fd", fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>
              #{session.user_id}
            </div>
          </div>
        )}

        {/* Status text */}
        <div style={{ marginBottom: 20 }}>
          {state === "idle" && (
            <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Tap the button below to scan and verify your device.<br />
              This ensures one account per device.
            </p>
          )}
          {state === "scanning" && (
            <p style={{ color: "#8b5cf6", fontSize: 13, margin: 0 }}>
              Scanning device fingerprint{dots}
            </p>
          )}
        </div>

        {/* Progress bar */}
        {state === "scanning" && (
          <div style={{
            height: 4,
            background: "rgba(139,92,246,0.15)",
            borderRadius: 2,
            overflow: "hidden",
            marginBottom: 20,
          }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #7c3aed, #8b5cf6, #a78bfa)",
              borderRadius: 2,
              transition: "width 0.2s ease",
              boxShadow: "0 0 8px rgba(139,92,246,0.6)",
            }} />
          </div>
        )}

        {/* Verify button */}
        {state === "idle" && (
          <button
            onClick={handleVerify}
            style={{
              width: "100%",
              padding: "14px 0",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 2,
              cursor: "pointer",
              boxShadow: "0 4px 24px rgba(124,58,237,0.4)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 32px rgba(124,58,237,0.6)"; }}
            onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 4px 24px rgba(124,58,237,0.4)"; }}
          >
            🔐 VERIFY DEVICE
          </button>
        )}

        {state === "scanning" && (
          <button
            disabled
            style={{
              width: "100%",
              padding: "14px 0",
              background: "rgba(139,92,246,0.2)",
              border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: 12,
              color: "#8b5cf6",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 2,
              cursor: "not-allowed",
            }}
          >
            ⚙️ SCANNING{dots}
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        @keyframes fadeIn { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }
        @keyframes scanLine {
          0% { top: 0%; opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>

      <ParticleCanvas />

      {/* Main container */}
      <div style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}>

        {/* Card */}
        <div style={{
          width: "100%",
          maxWidth: 380,
          background: "rgba(15, 10, 30, 0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 0 60px rgba(139,92,246,0.08), 0 20px 60px rgba(0,0,0,0.5)",
          animation: "fadeIn 0.5s ease",
        }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.25)",
              borderRadius: 20,
              padding: "4px 14px",
              marginBottom: 16,
            }}>
              <div style={{
                width: 6, height: 6,
                borderRadius: "50%",
                background: "#8b5cf6",
                boxShadow: "0 0 6px #8b5cf6",
                animation: "pulse 2s infinite",
              }} />
              <span style={{ color: "#8b5cf6", fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>
                NXTZEN SECURITY
              </span>
            </div>

            <h1 style={{
              color: "#f3f4f6",
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 3,
              marginBottom: 4,
              textTransform: "uppercase",
            }}>
              Device Verification
            </h1>

            <div style={{
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)",
              margin: "12px 0",
            }} />
          </div>

          {/* Content */}
          {renderContent()}

          {/* Footer */}
          <div style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.05)",
            textAlign: "center",
          }}>
            <p style={{ color: "#374151", fontSize: 10, letterSpacing: 1 }}>
              🔒 ENCRYPTED · SECURE · PRIVATE
            </p>
            <p style={{ color: "#1f2937", fontSize: 9, marginTop: 4 }}>
              Powered by NxtZen Engine
            </p>
          </div>

        </div>

        {/* Security badges */}
        <div style={{
          display: "flex",
          gap: 12,
          marginTop: 20,
          opacity: 0.5,
        }}>
          {["🛡️ SECURE", "🔐 ENCRYPTED", "👁️ PRIVATE"].map((b) => (
            <span key={b} style={{
              color: "#4b5563",
              fontSize: 9,
              letterSpacing: 1,
              fontWeight: 600,
            }}>{b}</span>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Reusable state card ──
function StateCard({ icon, title, subtitle, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>{icon}</div>
      <div style={{
        color,
        fontSize: 16,
        fontWeight: 700,
        letterSpacing: 2,
        marginBottom: 12,
      }}>
        {title}
      </div>
      <p style={{
        color: "#6b7280",
        fontSize: 13,
        lineHeight: 1.6,
      }}>
        {subtitle}
      </p>
    </div>
  );
}
