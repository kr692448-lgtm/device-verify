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
  try {
    components.plugins = Array.from(navigator.plugins).map(p => p.name).slice(0, 5).join(",");
  } catch { components.plugins = ""; }
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("NxtZen", 2, 15);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("NxtZen", 4, 17);
    components.canvas = canvas.toDataURL().slice(-50);
  } catch { components.canvas = ""; }
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      components.webgl = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    }
  } catch { components.webgl = ""; }
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
  } catch { components.audio = ""; }

  const raw = Object.values(components).join("|");
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const fingerprint = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return { fingerprint, components };
}

function ScannerRing({ state }) {
  const ringColor =
    state === "verified" ? "#00e5a0" :
    state === "conflict" ? "#ff4444" :
    state === "error"    ? "#ff8800" : "#6c63ff";
  const glowColor =
    state === "verified" ? "rgba(0,229,160,0.3)" :
    state === "conflict" ? "rgba(255,68,68,0.3)" :
    state === "error"    ? "rgba(255,136,0,0.3)" : "rgba(108,99,255,0.3)";

  return (
    <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto" }}>
      <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`2px solid ${ringColor}`, opacity:0.3, boxShadow:`0 0 20px ${glowColor}` }} />
      <div style={{ position:"absolute", inset:16, borderRadius:"50%", border:`1px solid ${ringColor}`, opacity:0.5 }} />
      <div style={{ position:"absolute", inset:32, borderRadius:"50%", border:`1px solid ${ringColor}`, opacity:0.7 }} />
      <div style={{ position:"absolute", inset:48, borderRadius:"50%", background:ringColor, opacity:0.15, boxShadow:`0 0 30px ${ringColor}` }} />
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:8, height:8, borderRadius:"50%", background:ringColor, boxShadow:`0 0 12px ${ringColor}` }} />
      {(state === "scanning" || state === "idle") && (
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"2px solid transparent", borderTopColor:ringColor, borderRightColor:ringColor, animation:"spin 1.2s linear infinite", boxShadow:`0 0 10px ${glowColor}` }} />
      )}
      {state === "verified" && (
        <svg style={{ position:"absolute", inset:0 }} width="140" height="140">
          <line x1="35" y1="75" x2="60" y2="100" stroke="#00e5a0" strokeWidth="3" strokeLinecap="round" />
          <line x1="60" y1="100" x2="105" y2="45" stroke="#00e5a0" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {state === "conflict" && (
        <svg style={{ position:"absolute", inset:0 }} width="140" height="140">
          <line x1="50" y1="50" x2="90" y2="90" stroke="#ff4444" strokeWidth="3" strokeLinecap="round" />
          <line x1="90" y1="50" x2="50" y2="90" stroke="#ff4444" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}

function ProgressBar({ progress, color }) {
  return (
    <div style={{ width:"100%", height:2, background:"rgba(255,255,255,0.05)", borderRadius:1, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${progress}%`, background:`linear-gradient(90deg, transparent, ${color})`, transition:"width 0.3s ease", boxShadow:`0 0 8px ${color}` }} />
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
  const hasRun = useRef(false);

  const addLog = (text) => setLogs(prev => [...prev.slice(-3), text]);
  const delay = (ms) => new Promise(r => setTimeout(r, ms));

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
    setStatusText("SCANNING DEVICE"); setSubText("Collecting device parameters");
    addLog("Hardware profiling started"); setProgress(10); await delay(400);
    addLog("Canvas signature detected"); setProgress(25); await delay(300);
    addLog("WebGL renderer captured"); setProgress(40); await delay(300);
    addLog("Audio context sampled"); setProgress(55); await delay(300);
    setStatusText("GENERATING HASH"); setSubText("Computing SHA-256 fingerprint");
    addLog("Building cryptographic hash");

    let fp, comp;
    try {
      const result = await collectFingerprint();
      fp = result.fingerprint; comp = result.components;
      setFingerprint(fp);
    } catch {
      setState("error"); setStatusText("SCAN FAILED");
      setSubText("Unable to read device parameters"); return;
    }

    setProgress(75); addLog("Fingerprint: " + fp.slice(0,12).toUpperCase() + "..."); await delay(300);
    setStatusText("VERIFYING"); setSubText("Cross-checking with secure database");
    setProgress(88); await delay(400);

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
          setState("conflict"); setStatusText("DEVICE CONFLICT");
          setSubText("This device is registered to another account");
          addLog("Conflict: Multiple accounts detected");
        } else {
          setState("error"); setStatusText("VERIFICATION FAILED");
          setSubText(data.error || "An error occurred");
        }
        return;
      }

      setState("verified"); setStatusText("ACCESS GRANTED");
      setSubText("Device successfully authenticated");
      addLog("Verification complete");
      setTimeout(() => {
        window.location.href = `https://t.me/${session?.bot_username || data.bot_username}`;
      }, 2500);
    } catch {
      setState("error"); setStatusText("NETWORK ERROR");
      setSubText("Connection to server failed");
    }
  }

  const accentColor =
    state === "verified" ? "#00e5a0" :
    state === "conflict" ? "#ff4444" :
    state === "error"    ? "#ff8800" : "#6c63ff";

  const shortFp = fingerprint
    ? fingerprint.slice(0,8).toUpperCase() + "..." + fingerprint.slice(-8).toUpperCase()
    : null;

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;background:#080810}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes gridMove{from{transform:translateY(0)}to{transform:translateY(40px)}}
      `}</style>

      <div style={{ position:"fixed", inset:0, zIndex:0, backgroundImage:`linear-gradient(rgba(108,99,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,0.04) 1px,transparent 1px)`, backgroundSize:"40px 40px", animation:"gridMove 4s linear infinite" }} />
      <div style={{ position:"fixed", inset:0, zIndex:0, background:`radial-gradient(ellipse 60% 50% at 50% 50%,rgba(108,99,255,0.08) 0%,transparent 70%)` }} />

      <div style={{ position:"relative", zIndex:1, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 16px", fontFamily:"'SF Mono','Fira Code','Consolas',monospace" }}>
        <div style={{ width:"100%", maxWidth:360, background:"rgba(10,10,20,0.92)", border:`1px solid ${accentColor}22`, borderRadius:4, overflow:"hidden", boxShadow:`0 0 0 1px rgba(255,255,255,0.03),0 40px 80px rgba(0,0,0,0.6),0 0 60px ${accentColor}0d`, animation:"fadeUp 0.4s ease", transition:"box-shadow 0.5s,border-color 0.5s" }}>

          {/* Top bar */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)", background:"rgba(255,255,255,0.02)" }}>
            <div style={{ display:"flex", gap:6 }}>
              {["#ff5f57","#ffbd2e","#28ca41"].map((c,i) => (
                <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:c, opacity:0.6 }} />
              ))}
            </div>
            <span style={{ color:"rgba(255,255,255,0.2)", fontSize:9, letterSpacing:2 }}>NXTZEN · SECURITY CORE v2</span>
            <div style={{ width:6, height:6, borderRadius:"50%", background:accentColor, boxShadow:`0 0 6px ${accentColor}`, animation:"pulse 2s infinite", transition:"background 0.5s,box-shadow 0.5s" }} />
          </div>

          {/* Body */}
          <div style={{ padding:"32px 28px 28px" }}>
            <div style={{ marginBottom:28 }}><ScannerRing state={state} /></div>

            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ color:accentColor, fontSize:13, fontWeight:700, letterSpacing:3, marginBottom:6, transition:"color 0.5s" }}>
                {statusText}
                {state === "scanning" && <span style={{ animation:"blink 1s infinite" }}>_</span>}
              </div>
              <div style={{ color:"rgba(255,255,255,0.3)", fontSize:10, letterSpacing:1, lineHeight:1.5 }}>{subText}</div>
            </div>

            <div style={{ marginBottom:20 }}>
              <ProgressBar progress={progress} color={accentColor} />
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                <span style={{ color:"rgba(255,255,255,0.15)", fontSize:9, letterSpacing:1 }}>PROGRESS</span>
                <span style={{ color:accentColor, fontSize:9, letterSpacing:1, opacity:0.7 }}>{progress}%</span>
              </div>
            </div>

            <div style={{ background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.04)", borderRadius:2, padding:"10px 12px", minHeight:72, marginBottom:20 }}>
              {logs.length === 0 ? (
                <div style={{ color:"rgba(255,255,255,0.1)", fontSize:9, letterSpacing:1 }}>&gt; AWAITING SCAN...</div>
              ) : logs.map((log,i) => (
                <div key={i} style={{ color:i===logs.length-1?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.2)", fontSize:9, letterSpacing:0.5, lineHeight:1.8 }}>
                  <span style={{ color:accentColor, opacity:0.6 }}>&gt; </span>{log}
                </div>
              ))}
            </div>

            {shortFp && (
              <div style={{ background:`${accentColor}0a`, border:`1px solid ${accentColor}22`, borderRadius:2, padding:"8px 12px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ color:"rgba(255,255,255,0.2)", fontSize:8, letterSpacing:2 }}>DEVICE ID</span>
                <span style={{ color:accentColor, fontSize:9, letterSpacing:1, opacity:0.8 }}>{shortFp}</span>
              </div>
            )}

            {state === "conflict" && (
              <div style={{ background:"rgba(255,68,68,0.06)", border:"1px solid rgba(255,68,68,0.2)", borderRadius:2, padding:"12px 14px", marginBottom:16 }}>
                <div style={{ color:"#ff4444", fontSize:10, letterSpacing:2, marginBottom:6, fontWeight:700 }}>CONFLICT DETECTED</div>
                <div style={{ color:"rgba(255,255,255,0.35)", fontSize:9, lineHeight:1.7 }}>
                  This device fingerprint is already bound to a different account. Each physical device may only be associated with one account.
                </div>
                <div style={{ marginTop:10, paddingTop:8, borderTop:"1px solid rgba(255,68,68,0.1)", display:"flex", justifyContent:"space-between" }}>
                  <span style={{ color:"rgba(255,255,255,0.15)", fontSize:8, letterSpacing:1 }}>REASON</span>
                  <span style={{ color:"#ff4444", fontSize:8, letterSpacing:1, opacity:0.7 }}>DEVICE_ALREADY_REGISTERED</span>
                </div>
              </div>
            )}

            {session?.user_id && (
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color:"rgba(255,255,255,0.15)", fontSize:8, letterSpacing:2 }}>UID</span>
                <span style={{ color:"rgba(255,255,255,0.25)", fontSize:9 }}>#{session.user_id}</span>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div style={{ padding:"8px 16px", borderTop:"1px solid rgba(255,255,255,0.03)", background:"rgba(0,0,0,0.2)", display:"flex", justifyContent:"space-between" }}>
            <span style={{ color:"rgba(255,255,255,0.08)", fontSize:8, letterSpacing:1 }}>SHA-256 · AES-256 · TLS 1.3</span>
            <span style={{ color:"rgba(255,255,255,0.08)", fontSize:8, letterSpacing:1 }}>NXTZEN ENGINE</span>
          </div>

        </div>
      </div>
    </>
  );
}
