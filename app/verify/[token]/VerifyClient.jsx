"use client";

import { useEffect, useState, useRef } from "react";

async function collectFingerprint() {
  const components = {};
  components.screen = `${screen.width}x${screen.height}x${screen.colorDepth}`;
  components.viewport = `${window.innerWidth}x${window.innerHeight}`;
  components.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  components.locale = navigator.language;
  components.platform = navigator.platform;
  components.vendor = navigator.vendor;
  components.cores = navigator.hardwareConcurrency;
  components.memory = navigator.deviceMemory || "unknown";
  components.touchPoints = navigator.maxTouchPoints;
  try { components.plugins = Array.from(navigator.plugins).map(p => p.name).slice(0, 5).join(","); } catch { components.plugins = ""; }
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top"; ctx.font = "14px Arial";
    ctx.fillStyle = "#f60"; ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069"; ctx.fillText("NxtZen", 2, 15);
    ctx.fillStyle = "rgba(102,204,0,0.7)"; ctx.fillText("NxtZen", 4, 17);
    components.canvas = canvas.toDataURL().slice(-50);
  } catch { components.canvas = ""; }
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (gl) { const ext = gl.getExtension("WEBGL_debug_renderer_info"); components.webgl = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); }
  } catch { components.webgl = ""; }
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ac.createOscillator(); const analyser = ac.createAnalyser();
    const gain = ac.createGain(); gain.gain.value = 0;
    osc.connect(analyser); analyser.connect(gain); gain.connect(ac.destination);
    osc.start(0);
    const freqData = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(freqData); osc.stop(); await ac.close();
    components.audio = freqData.slice(0, 5).join(",");
  } catch { components.audio = ""; }
  const raw = Object.values(components).join("|");
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const fingerprint = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return { fingerprint, components };
}

const THEMES = {
  dark: {
    pageBg: "#07080f",
    gridLine: "rgba(99,102,241,0.05)",
    cardBg: "rgba(9,10,20,0.97)",
    cardBorder: "rgba(255,255,255,0.07)",
    cardShadow: "0 40px 100px rgba(0,0,0,0.8)",
    topBarBg: "rgba(255,255,255,0.02)",
    divider: "rgba(255,255,255,0.06)",
    bottomBarBg: "rgba(0,0,0,0.3)",
    labelFaint: "rgba(255,255,255,0.2)",
    textMuted: "rgba(255,255,255,0.45)",
    logBg: "rgba(0,0,0,0.4)",
    logBorder: "rgba(255,255,255,0.05)",
    logTextOld: "rgba(255,255,255,0.2)",
    logTextNew: "rgba(255,255,255,0.7)",
    toggleBg: "rgba(255,255,255,0.06)",
    toggleBorder: "rgba(255,255,255,0.12)",
    toggleText: "rgba(255,255,255,0.6)",
    uidText: "rgba(255,255,255,0.3)",
    headingText: "#ffffff",
    subheadText: "rgba(255,255,255,0.45)",
    radialGlow: "rgba(99,102,241,0.08)",
  },
  light: {
    pageBg: "#eef0f8",
    gridLine: "rgba(99,102,241,0.07)",
    cardBg: "#ffffff",
    cardBorder: "rgba(0,0,0,0.08)",
    cardShadow: "0 20px 70px rgba(99,102,241,0.18)",
    topBarBg: "#f8f9fd",
    divider: "rgba(0,0,0,0.07)",
    bottomBarBg: "#f5f6fc",
    labelFaint: "rgba(0,0,0,0.35)",
    textMuted: "rgba(0,0,0,0.55)",
    logBg: "#f2f3fa",
    logBorder: "rgba(0,0,0,0.07)",
    logTextOld: "rgba(0,0,0,0.3)",
    logTextNew: "rgba(0,0,0,0.75)",
    toggleBg: "#6366f1",
    toggleBorder: "#4f52d0",
    toggleText: "#ffffff",
    uidText: "rgba(0,0,0,0.4)",
    headingText: "#0f1020",
    subheadText: "rgba(0,0,0,0.5)",
    radialGlow: "rgba(99,102,241,0.07)",
  }
};

function HexRing({ state, dark }) {
  const colors = {
    verified: { main: "#10b981", glow: "rgba(16,185,129,0.25)", track: "rgba(16,185,129,0.15)" },
    conflict: { main: "#ef4444", glow: "rgba(239,68,68,0.25)", track: "rgba(239,68,68,0.15)" },
    error:    { main: "#f59e0b", glow: "rgba(245,158,11,0.25)", track: "rgba(245,158,11,0.15)" },
    scanning: { main: "#6366f1", glow: "rgba(99,102,241,0.25)", track: "rgba(99,102,241,0.15)" },
    idle:     { main: "#6366f1", glow: "rgba(99,102,241,0.25)", track: "rgba(99,102,241,0.15)" },
  };
  const c = colors[state] || colors.idle;
  const size = 148;
  const cx = size / 2;
  const r1 = 66, r2 = 52, r3 = 38;

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Outer track */}
        <circle cx={cx} cy={cx} r={r1} fill="none" stroke={c.track} strokeWidth="1.5" />
        <circle cx={cx} cy={cx} r={r2} fill="none" stroke={c.track} strokeWidth="1" opacity="0.7" />
        <circle cx={cx} cy={cx} r={r3} fill="none" stroke={c.track} strokeWidth="1" opacity="0.5" />

        {/* Spinning arc - only when scanning */}
        {(state === "scanning" || state === "idle") && (
          <>
            <circle cx={cx} cy={cx} r={r1} fill="none" stroke={c.main} strokeWidth="2"
              strokeDasharray={`${r1 * 1.2} ${r1 * 10}`}
              strokeLinecap="round"
              style={{ transformOrigin: `${cx}px ${cx}px`, animation: "spin 1.4s linear infinite" }}
              filter="url(#glow)"
            />
            <circle cx={cx} cy={cx} r={r2} fill="none" stroke={c.main} strokeWidth="1.5"
              strokeDasharray={`${r2 * 0.8} ${r2 * 10}`}
              strokeLinecap="round"
              opacity="0.6"
              style={{ transformOrigin: `${cx}px ${cx}px`, animation: "spin 2s linear infinite reverse" }}
            />
          </>
        )}

        {/* Center fill */}
        <circle cx={cx} cy={cx} r={r3 - 6} fill={c.main} opacity={dark ? "0.08" : "0.1"} />
        <circle cx={cx} cy={cx} r={r3 - 6} fill="none" stroke={c.main} strokeWidth="1.5" opacity="0.5" />

        {/* Icons */}
        {state === "verified" && (
          <polyline points={`${cx-14},${cx+2} ${cx-4},${cx+14} ${cx+16},${cx-14}`}
            fill="none" stroke={c.main} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            filter="url(#glow)" />
        )}
        {state === "conflict" && (
          <>
            <line x1={cx-12} y1={cx-12} x2={cx+12} y2={cx+12} stroke={c.main} strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)" />
            <line x1={cx+12} y1={cx-12} x2={cx-12} y2={cx+12} stroke={c.main} strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}
        {state === "error" && (
          <>
            <line x1={cx} y1={cx-14} x2={cx} y2={cx+6} stroke={c.main} strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)" />
            <circle cx={cx} cy={cx+13} r="2.5" fill={c.main} />
          </>
        )}

        {/* Dot markers on outer ring */}
        {[0, 90, 180, 270].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x = cx + r1 * Math.cos(rad);
          const y = cx + r1 * Math.sin(rad);
          return <circle key={i} cx={x} cy={y} r="2.5" fill={c.main} opacity="0.6" />;
        })}
      </svg>

      {/* Outer glow */}
      <div style={{
        position: "absolute", inset: -8, borderRadius: "50%",
        background: `radial-gradient(circle, ${c.glow} 0%, transparent 70%)`,
        pointerEvents: "none"
      }} />
    </div>
  );
}

function ProgressBar({ progress, color }) {
  return (
    <div style={{ width: "100%", height: 2, background: "rgba(128,128,128,0.12)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${progress}%`,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: `0 0 10px ${color}55`
      }} />
    </div>
  );
}

export default function VerifyClient({ token, session }) {
  const [state, setState] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("INITIALIZING");
  const [subText, setSubText] = useState("Preparing secure environment");
  const [fingerprint, setFingerprint] = useState("");
  const [logs, setLogs] = useState([]);
  const [dark, setDark] = useState(true);
  const hasRun = useRef(false);

  const addLog = (text) => setLogs(prev => [...prev.slice(-4), text]);
  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  const t = THEMES[dark ? "dark" : "light"];

  const accentColor =
    state === "verified" ? "#10b981" :
    state === "conflict" ? "#ef4444" :
    state === "error"    ? "#f59e0b" : "#6366f1";

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    if (!session) {
      setState("error"); setStatusText("INVALID SESSION");
      setSubText("This verification link does not exist"); return;
    }
    if (session.status === "expired" || (session.expires_at && new Date() > new Date(session.expires_at))) {
      setState("error"); setStatusText("SESSION EXPIRED");
      setSubText("Request a new verification link from the bot"); return;
    }
    if (session.status === "verified") {
      setState("verified"); setStatusText("ALREADY VERIFIED");
      setSubText("Device already authenticated"); setProgress(100);
      setTimeout(() => { window.location.href = `https://t.me/${session.bot_username}`; }, 2000);
      return;
    }
    runScan();
  }, []);

  async function runScan() {
    setState("scanning");
    setStatusText("SCANNING DEVICE"); setSubText("Collecting hardware parameters");
    addLog("Initiating hardware profiler"); setProgress(10); await delay(350);
    addLog("Canvas fingerprint sampled"); setProgress(22); await delay(280);
    addLog("WebGL renderer identified"); setProgress(36); await delay(280);
    addLog("Audio context fingerprinted"); setProgress(50); await delay(280);
    setStatusText("GENERATING HASH"); setSubText("Computing SHA-256 fingerprint");
    addLog("Hashing entropy pool");
    let fp, comp;
    try {
      const result = await collectFingerprint();
      fp = result.fingerprint; comp = result.components;
      setFingerprint(fp);
    } catch {
      setState("error"); setStatusText("SCAN FAILED");
      setSubText("Unable to read device parameters"); return;
    }
    setProgress(68); addLog("ID: " + fp.slice(0, 12).toUpperCase() + "···"); await delay(280);
    setStatusText("AUTHENTICATING"); setSubText("Cross-referencing secure registry");
    setProgress(84); await delay(380);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fingerprint: fp, components: comp }),
      });
      const data = await res.json();
      setProgress(100);
      if (!res.ok) {
        if (data.code === "DEVICE_CONFLICT") {
          setState("conflict"); setStatusText("ACCESS DENIED");
          setSubText("Device bound to another account");
          addLog("CONFLICT: Duplicate identity detected");
          setTimeout(() => { window.location.href = `https://t.me/${session?.bot_username || data.bot_username || ""}`; }, 3000);
        } else {
          setState("error"); setStatusText("VERIFICATION FAILED");
          setSubText(data.error || "An error occurred");
        }
        return;
      }
      setState("verified"); setStatusText("ACCESS GRANTED");
      setSubText("Identity confirmed");
      addLog("AUTH: Verification complete");
      setTimeout(() => { window.location.href = `https://t.me/${session?.bot_username || data.bot_username}`; }, 2500);
    } catch {
      setState("error"); setStatusText("NETWORK ERROR");
      setSubText("Connection to server failed");
    }
  }

  const shortFp = fingerprint
    ? fingerprint.slice(0, 8).toUpperCase() + "···" + fingerprint.slice(-8).toUpperCase()
    : null;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: ${t.pageBg}; transition: background 0.4s; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes gridDrift { from { transform: translateY(0); } to { transform: translateY(40px); } }
        @keyframes shimmer { 0% { opacity: 0.4; } 50% { opacity: 0.9; } 100% { opacity: 0.4; } }
      `}</style>

      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(${t.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${t.gridLine} 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
        animation: "gridDrift 5s linear infinite",
        transition: "background-image 0.4s"
      }} />
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: `radial-gradient(ellipse 55% 55% at 50% 45%, ${t.radialGlow}, transparent 70%)`
      }} />

      {/* Theme toggle */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 10 }}>
        <button onClick={() => setDark(d => !d)} style={{
          background: t.toggleBg,
          border: `1px solid ${t.toggleBorder}`,
          borderRadius: 6,
          padding: "7px 16px",
          cursor: "pointer",
          color: t.toggleText,
          fontSize: 10,
          letterSpacing: 2,
          fontFamily: "'SF Mono','Fira Code','Consolas',monospace",
          fontWeight: 700,
          transition: "all 0.3s",
          backdropFilter: "blur(10px)",
        }}>
          {dark ? "LIGHT" : "DARK"}
        </button>
      </div>

      <div style={{
        position: "relative", zIndex: 1,
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'SF Mono','Fira Code','Consolas',monospace"
      }}>
        <div style={{
          width: "100%", maxWidth: 360,
          background: t.cardBg,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: `${t.cardShadow}, 0 0 80px ${accentColor}0d`,
          animation: "fadeUp 0.45s cubic-bezier(0.4,0,0.2,1)",
          transition: "background 0.4s, border-color 0.3s, box-shadow 0.5s"
        }}>

          {/* Top bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px",
            borderBottom: `1px solid ${t.divider}`,
            background: t.topBarBg
          }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#ff5f57", "#ffbd2e", "#28ca41"].map((c, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.8 }} />
              ))}
            </div>
            <span style={{ color: t.labelFaint, fontSize: 9, letterSpacing: 2.5 }}>NXTZEN · SECURE VERIFY</span>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
              animation: "pulse 2s infinite"
            }} />
          </div>

          {/* Body */}
          <div style={{ padding: "32px 26px 24px" }}>

            {/* Ring */}
            <div style={{ marginBottom: 26 }}>
              <HexRing state={state} dark={dark} />
            </div>

            {/* Status */}
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div style={{
                color: accentColor, fontSize: 12, fontWeight: 700,
                letterSpacing: 3.5, marginBottom: 7,
                textShadow: `0 0 20px ${accentColor}44`
              }}>
                {statusText}
                {state === "scanning" && <span style={{ animation: "blink 1s infinite" }}>_</span>}
              </div>
              <div style={{ color: t.subheadText, fontSize: 10, letterSpacing: 0.5, lineHeight: 1.6 }}>
                {subText}
              </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: 20 }}>
              <ProgressBar progress={progress} color={accentColor} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ color: t.labelFaint, fontSize: 8, letterSpacing: 1.5 }}>SCAN PROGRESS</span>
                <span style={{ color: accentColor, fontSize: 8, letterSpacing: 1, opacity: 0.85 }}>{progress}%</span>
              </div>
            </div>

            {/* Logs */}
            <div style={{
              background: t.logBg,
              border: `1px solid ${t.logBorder}`,
              borderRadius: 5, padding: "10px 12px",
              minHeight: 76, marginBottom: 18
            }}>
              {logs.length === 0 ? (
                <div style={{ color: t.labelFaint, fontSize: 9, letterSpacing: 1 }}>&gt; AWAITING SCAN...</div>
              ) : logs.map((log, i) => (
                <div key={i} style={{
                  color: i === logs.length - 1 ? t.logTextNew : t.logTextOld,
                  fontSize: 9, letterSpacing: 0.3, lineHeight: 1.9,
                  transition: "color 0.3s"
                }}>
                  <span style={{ color: accentColor, opacity: 0.7 }}>&gt; </span>{log}
                </div>
              ))}
            </div>

            {/* Device ID */}
            {shortFp && (
              <div style={{
                background: `${accentColor}0a`,
                border: `1px solid ${accentColor}28`,
                borderRadius: 5, padding: "8px 12px",
                marginBottom: 16,
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <span style={{ color: t.labelFaint, fontSize: 8, letterSpacing: 2 }}>DEVICE ID</span>
                <span style={{ color: accentColor, fontSize: 9, letterSpacing: 1 }}>{shortFp}</span>
              </div>
            )}

            {/* Conflict banner */}
            {state === "conflict" && (
              <div style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 5, padding: "12px 14px", marginBottom: 16
              }}>
                <div style={{ color: "#ef4444", fontSize: 10, letterSpacing: 2, marginBottom: 6, fontWeight: 700 }}>
                  CONFLICT DETECTED
                </div>
                <div style={{ color: t.textMuted, fontSize: 9, lineHeight: 1.8 }}>
                  This device fingerprint is already bound to a different account. Each device may only link to one account.
                </div>
                <div style={{
                  marginTop: 8, paddingTop: 8,
                  borderTop: "1px solid rgba(239,68,68,0.12)",
                  display: "flex", justifyContent: "space-between"
                }}>
                  <span style={{ color: t.labelFaint, fontSize: 8, letterSpacing: 1 }}>CODE</span>
                  <span style={{ color: "#ef4444", fontSize: 8, letterSpacing: 1 }}>DEVICE_ALREADY_REGISTERED</span>
                </div>
                <div style={{ marginTop: 6, color: t.textMuted, fontSize: 9 }}>Redirecting in 3s...</div>
              </div>
            )}

            {/* UID */}
            {session?.user_id && (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                paddingTop: 12, borderTop: `1px solid ${t.divider}`
              }}>
                <span style={{ color: t.labelFaint, fontSize: 8, letterSpacing: 2 }}>USER ID</span>
                <span style={{ color: t.uidText, fontSize: 9 }}>#{session.user_id}</span>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div style={{
            padding: "9px 16px",
            borderTop: `1px solid ${t.divider}`,
            background: t.bottomBarBg,
            display: "flex", justifyContent: "space-between"
          }}>
            <span style={{ color: t.labelFaint, fontSize: 8, letterSpacing: 1 }}>SHA-256 · AES-256 · TLS 1.3</span>
            <span style={{ color: t.labelFaint, fontSize: 8, letterSpacing: 1 }}>NXTZEN ENGINE</span>
          </div>

        </div>
      </div>
    </>
  );
}
