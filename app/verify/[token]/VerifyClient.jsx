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
  try { components.plugins = Array.from(navigator.plugins).map(p => p.name).slice(0,5).join(","); } catch { components.plugins = ""; }
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top"; ctx.font = "14px Arial";
    ctx.fillStyle = "#f60"; ctx.fillRect(125,1,62,20);
    ctx.fillStyle = "#069"; ctx.fillText("NxtZen",2,15);
    ctx.fillStyle = "rgba(102,204,0,0.7)"; ctx.fillText("NxtZen",4,17);
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
    components.audio = freqData.slice(0,5).join(",");
  } catch { components.audio = ""; }
  const raw = Object.values(components).join("|");
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const fingerprint = hashArray.map(b => b.toString(16).padStart(2,"0")).join("");
  return { fingerprint, components };
}

/* ── Amber/Gold professional theme ── */
const THEMES = {
  dark: {
    pageBg: "#0a0a0f",
    gridLine: "rgba(234,179,8,0.04)",
    cardBg: "rgba(10,10,16,0.99)",
    cardBorder: "rgba(234,179,8,0.1)",
    cardShadow: "0 50px 120px rgba(0,0,0,0.95)",
    topBarBg: "rgba(234,179,8,0.03)",
    divider: "rgba(255,255,255,0.05)",
    bottomBarBg: "rgba(0,0,0,0.5)",
    labelFaint: "rgba(255,255,255,0.2)",
    textMuted: "rgba(255,255,255,0.38)",
    logBg: "rgba(0,0,0,0.55)",
    logBorder: "rgba(255,255,255,0.04)",
    logTextOld: "rgba(255,255,255,0.18)",
    logTextNew: "rgba(255,255,255,0.78)",
    toggleBg: "rgba(234,179,8,0.1)",
    toggleBorder: "rgba(234,179,8,0.25)",
    toggleText: "rgba(234,179,8,0.9)",
    nameText: "#ffffff",
    idText: "rgba(255,255,255,0.38)",
    radialGlow: "rgba(234,179,8,0.05)",
    avatarBg: "rgba(234,179,8,0.1)",
    avatarBorder: "rgba(234,179,8,0.3)",
    userCardBg: "rgba(234,179,8,0.04)",
    userCardBorder: "rgba(234,179,8,0.1)",
  },
  light: {
    pageBg: "#fafaf5",
    gridLine: "rgba(161,122,4,0.06)",
    cardBg: "#ffffff",
    cardBorder: "rgba(161,122,4,0.12)",
    cardShadow: "0 30px 80px rgba(234,179,8,0.12)",
    topBarBg: "#fffef5",
    divider: "rgba(0,0,0,0.06)",
    bottomBarBg: "#fdf9e8",
    labelFaint: "rgba(0,0,0,0.28)",
    textMuted: "rgba(0,0,0,0.48)",
    logBg: "#fdf9e8",
    logBorder: "rgba(161,122,4,0.1)",
    logTextOld: "rgba(0,0,0,0.25)",
    logTextNew: "rgba(0,0,0,0.72)",
    toggleBg: "#ca8a04",
    toggleBorder: "#a16207",
    toggleText: "#ffffff",
    nameText: "#0a0a0f",
    idText: "rgba(0,0,0,0.4)",
    radialGlow: "rgba(234,179,8,0.07)",
    avatarBg: "rgba(234,179,8,0.12)",
    avatarBorder: "rgba(161,122,4,0.3)",
    userCardBg: "rgba(234,179,8,0.05)",
    userCardBorder: "rgba(161,122,4,0.12)",
  }
};

/* ── Clean initials avatar — no dots, no silhouette ── */
function UserAvatar({ name, accentColor, t, size = 54 }) {
  const initials = name
    ? name.trim().split(/\s+/).map(w => w[0]).slice(0,2).join("").toUpperCase()
    : "?";
  return (
    <div style={{
      width: size, height: size,
      borderRadius: "50%",
      flexShrink: 0,
      background: t.avatarBg,
      border: `2px solid ${t.avatarBorder}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 0 20px ${accentColor}25`,
    }}>
      <span style={{
        color: accentColor,
        fontSize: size * 0.36,
        fontWeight: 800,
        letterSpacing: 1,
        lineHeight: 1,
        fontFamily: "'SF Mono','Fira Code','Consolas',monospace",
        textShadow: `0 0 16px ${accentColor}88`,
        userSelect: "none",
      }}>
        {initials}
      </span>
    </div>
  );
}

/* ── User info strip ── */
function UserStrip({ name, userId, accentColor, t }) {
  if (!name && !userId) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      background: t.userCardBg,
      border: `1px solid ${t.userCardBorder}`,
      borderRadius: 10, padding: "12px 14px",
      marginBottom: 20,
      animation: "fadeUp 0.35s ease both",
    }}>
      <UserAvatar name={name || String(userId)} accentColor={accentColor} t={t} size={52} />
      <div style={{ display:"flex", flexDirection:"column", gap:4, minWidth:0 }}>
        {name && (
          <span style={{
            color: t.nameText,
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: 0.2,
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontFamily: "'SF Mono','Fira Code','Consolas',monospace",
          }}>
            {name}
          </span>
        )}
        {userId && (
          <span style={{
            color: t.idText,
            fontSize: 10,
            letterSpacing: 1.5,
            lineHeight: 1,
            fontFamily: "'SF Mono','Fira Code','Consolas',monospace",
          }}>
            # {userId}
          </span>
        )}
      </div>
    </div>
  );
}

function StatusRing({ state, dark }) {
  const palette = {
    verified: { main:"#eab308", glow:"rgba(234,179,8,0.35)",  track:"rgba(234,179,8,0.12)"  },
    conflict: { main:"#ef4444", glow:"rgba(239,68,68,0.3)",   track:"rgba(239,68,68,0.12)"  },
    error:    { main:"#f97316", glow:"rgba(249,115,22,0.3)",  track:"rgba(249,115,22,0.12)" },
    scanning: { main:"#eab308", glow:"rgba(234,179,8,0.3)",   track:"rgba(234,179,8,0.1)"   },
    idle:     { main:"#eab308", glow:"rgba(234,179,8,0.3)",   track:"rgba(234,179,8,0.1)"   },
  };
  const c = palette[state] || palette.idle;
  const size = 144, cx = 72;
  const r1 = 64, r2 = 50, r3 = 36;

  return (
    <div style={{ position:"relative", width:size, height:size, margin:"0 auto" }}>
      <svg width={size} height={size} style={{ position:"absolute", inset:0 }}>
        <defs>
          <filter id="glow2">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <radialGradient id="centerFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={c.main} stopOpacity={dark?"0.14":"0.1"}/>
            <stop offset="100%" stopColor={c.main} stopOpacity="0"/>
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cx} r={r1} fill="none" stroke={c.track} strokeWidth="1"/>
        <circle cx={cx} cy={cx} r={r2} fill="none" stroke={c.track} strokeWidth="1" opacity="0.6"/>
        <circle cx={cx} cy={cx} r={r3} fill="none" stroke={c.track} strokeWidth="1" opacity="0.4"/>
        {(state==="scanning"||state==="idle") && (<>
          <circle cx={cx} cy={cx} r={r1} fill="none" stroke={c.main} strokeWidth="1.5"
            strokeDasharray={`${r1*1.1} ${r1*10}`} strokeLinecap="round"
            style={{transformOrigin:`${cx}px ${cx}px`,animation:"spin 1.6s linear infinite"}}
            filter="url(#glow2)"/>
          <circle cx={cx} cy={cx} r={r2} fill="none" stroke={c.main} strokeWidth="1"
            strokeDasharray={`${r2*0.7} ${r2*10}`} strokeLinecap="round" opacity="0.5"
            style={{transformOrigin:`${cx}px ${cx}px`,animation:"spin 2.2s linear infinite reverse"}}/>
          <circle cx={cx} cy={cx} r={r3} fill="none" stroke={c.main} strokeWidth="1"
            strokeDasharray={`${r3*0.5} ${r3*10}`} strokeLinecap="round" opacity="0.3"
            style={{transformOrigin:`${cx}px ${cx}px`,animation:"spin 3s linear infinite"}}/>
        </>)}
        {["verified","conflict","error"].includes(state) && (<>
          <circle cx={cx} cy={cx} r={r1} fill="none" stroke={c.main} strokeWidth="1.5" opacity="0.6"/>
          <circle cx={cx} cy={cx} r={r2} fill="none" stroke={c.main} strokeWidth="1" opacity="0.35"/>
        </>)}
        <circle cx={cx} cy={cx} r={r3-4} fill="url(#centerFill)"/>
        <circle cx={cx} cy={cx} r={r3-4} fill="none" stroke={c.main} strokeWidth="1.2" opacity="0.45"/>
        {state==="verified" && (
          <polyline points={`${cx-13},${cx+2} ${cx-3},${cx+13} ${cx+15},${cx-13}`}
            fill="none" stroke={c.main} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            filter="url(#glow2)"/>
        )}
        {state==="conflict" && (<>
          <line x1={cx-11} y1={cx-11} x2={cx+11} y2={cx+11} stroke={c.main} strokeWidth="2.2" strokeLinecap="round" filter="url(#glow2)"/>
          <line x1={cx+11} y1={cx-11} x2={cx-11} y2={cx+11} stroke={c.main} strokeWidth="2.2" strokeLinecap="round"/>
        </>)}
        {state==="error" && (<>
          <line x1={cx} y1={cx-13} x2={cx} y2={cx+5} stroke={c.main} strokeWidth="2.2" strokeLinecap="round" filter="url(#glow2)"/>
          <circle cx={cx} cy={cx+12} r="2.2" fill={c.main}/>
        </>)}
        {[0,60,120,180,240,300].map((deg,i) => {
          const rad=(deg*Math.PI)/180;
          return <circle key={i} cx={cx+r1*Math.cos(rad)} cy={cx+r1*Math.sin(rad)} r="1.8" fill={c.main} opacity="0.5"/>;
        })}
      </svg>
      <div style={{
        position:"absolute", inset:-10, borderRadius:"50%",
        background:`radial-gradient(circle, ${c.glow} 0%, transparent 68%)`,
        pointerEvents:"none"
      }}/>
    </div>
  );
}

function ProgressBar({ progress, color }) {
  return (
    <div style={{ width:"100%", height:2, background:"rgba(128,128,128,0.1)", borderRadius:2, overflow:"hidden" }}>
      <div style={{
        height:"100%", width:`${progress}%`,
        background:`linear-gradient(90deg, ${color}55, ${color}ee)`,
        transition:"width 0.4s cubic-bezier(0.4,0,0.2,1)",
        boxShadow:`0 0 12px ${color}66`
      }}/>
    </div>
  );
}

function ProceedButton({ label, color }) {
  const [hovered, setHovered] = useState(false);
  function handleClick() {
    try {
      if (window.Telegram?.WebApp?.close) { window.Telegram.WebApp.close(); }
      else { window.close(); }
    } catch { window.close(); }
  }
  return (
    <button onClick={handleClick}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        width:"100%", padding:"12px 0",
        background: hovered ? `${color}22` : `${color}0f`,
        border:`1px solid ${color}${hovered?"70":"40"}`,
        borderRadius:7,
        color:color, fontSize:10, letterSpacing:2.5, fontWeight:700,
        cursor:"pointer",
        transition:"all 0.22s ease",
        boxShadow: hovered ? `0 0 24px ${color}30` : "none",
        fontFamily:"'SF Mono','Fira Code','Consolas',monospace",
        marginTop:4,
        animation:"fadeUp 0.4s ease both",
        animationDelay:"0.1s",
        outline:"none",
      }}>
      {label}
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path d="M1.5 5.5h8M5.5 1.5l4 4-4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

export default function VerifyClient({ token, session }) {
  const [state,       setState]      = useState("idle");
  const [progress,    setProgress]   = useState(0);
  const [statusText,  setStatusText] = useState("INITIALIZING");
  const [subText,     setSubText]    = useState("Preparing secure environment");
  const [fingerprint, setFingerprint]= useState("");
  const [logs,        setLogs]       = useState([]);
  const [dark,        setDark]       = useState(true);
  const [botUser,     setBotUser]    = useState(session?.bot_username || "");
  const hasRun = useRef(false);

  const addLog = (text) => setLogs(prev => [...prev.slice(-4), text]);
  const delay  = (ms)   => new Promise(r => setTimeout(r, ms));
  const t = THEMES[dark ? "dark" : "light"];

  const accentColor =
    state === "verified" ? "#eab308" :
    state === "conflict" ? "#ef4444" :
    state === "error"    ? "#f97316" : "#eab308";

  const isDone = ["verified","conflict","error"].includes(state);

  const userName = session?.user_name || session?.first_name || null;
  const userId   = session?.user_id   || null;

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    try { window.Telegram?.WebApp?.ready(); } catch {}
    if (!session) {
      setState("error"); setStatusText("INVALID SESSION");
      setSubText("This verification link does not exist"); return;
    }
    if (session.status==="expired"||(session.expires_at && new Date()>new Date(session.expires_at))) {
      setState("error"); setStatusText("SESSION EXPIRED");
      setSubText("Request a new verification link from the bot"); return;
    }
    if (session.status==="verified") {
      setState("verified"); setStatusText("ALREADY VERIFIED");
      setSubText("Device already authenticated"); setProgress(100); return;
    }
    runScan();
  }, []);

  async function runScan() {
    setState("scanning");
    setStatusText("SCANNING DEVICE"); setSubText("Collecting hardware parameters");
    addLog("Initiating hardware profiler"); setProgress(10); await delay(350);
    addLog("Canvas fingerprint sampled");  setProgress(22); await delay(300);
    addLog("WebGL renderer identified");   setProgress(36); await delay(300);
    addLog("Audio context fingerprinted"); setProgress(50); await delay(300);
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
    setProgress(68); addLog("ID: "+fp.slice(0,12).toUpperCase()+"···"); await delay(300);
    setStatusText("AUTHENTICATING"); setSubText("Cross-referencing secure registry");
    setProgress(84); await delay(400);
    try {
      const res = await fetch("/api/verify", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ token, fingerprint:fp, components:comp }),
      });
      const data = await res.json();
      setProgress(100);
      if (data.bot_username) setBotUser(data.bot_username);
      if (!res.ok) {
        if (data.code==="DEVICE_CONFLICT") {
          setState("conflict"); setStatusText("ACCESS DENIED");
          setSubText("Device bound to another account");
          addLog("CONFLICT: Duplicate identity detected");
        } else {
          setState("error"); setStatusText("VERIFICATION FAILED");
          setSubText(data.error || "An error occurred");
        }
        return;
      }
      setState("verified"); setStatusText("ACCESS GRANTED");
      setSubText("Identity confirmed — you may now proceed");
      addLog("AUTH: Verification complete");
    } catch {
      setState("error"); setStatusText("NETWORK ERROR");
      setSubText("Connection to server failed");
    }
  }

  const shortFp = fingerprint
    ? fingerprint.slice(0,8).toUpperCase()+"···"+fingerprint.slice(-8).toUpperCase()
    : null;

  const btnLabel = isDone ? "PROCEED TO BOT" : "";

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;background:${t.pageBg};transition:background 0.4s;}
        @keyframes spin      {to{transform:rotate(360deg);}}
        @keyframes fadeUp    {from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse     {0%,100%{opacity:0.25;}50%{opacity:1;}}
        @keyframes blink     {0%,100%{opacity:1;}50%{opacity:0;}}
        @keyframes gridDrift {from{transform:translateY(0);}to{transform:translateY(40px);}}
        @keyframes glowPulse {0%,100%{opacity:0.55;}50%{opacity:1;}}
      `}</style>

      <div style={{
        position:"fixed",inset:0,zIndex:0,
        backgroundImage:`linear-gradient(${t.gridLine} 1px,transparent 1px),linear-gradient(90deg,${t.gridLine} 1px,transparent 1px)`,
        backgroundSize:"40px 40px",animation:"gridDrift 6s linear infinite",
      }}/>
      <div style={{
        position:"fixed",inset:0,zIndex:0,
        background:`radial-gradient(ellipse 60% 50% at 50% 40%,${t.radialGlow},transparent 70%)`
      }}/>

      {/* Theme toggle */}
      <div style={{position:"fixed",top:14,right:14,zIndex:10}}>
        <button onClick={()=>setDark(d=>!d)} style={{
          background:t.toggleBg, border:`1px solid ${t.toggleBorder}`, borderRadius:5,
          padding:"6px 14px", cursor:"pointer", color:t.toggleText,
          fontSize:9, letterSpacing:2.5,
          fontFamily:"'SF Mono','Fira Code','Consolas',monospace", fontWeight:700,
          transition:"all 0.3s", backdropFilter:"blur(12px)", outline:"none",
        }}>
          {dark?"LIGHT":"DARK"}
        </button>
      </div>

      <div style={{
        position:"relative",zIndex:1,
        minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
        padding:"24px 16px",
        fontFamily:"'SF Mono','Fira Code','Consolas',monospace"
      }}>
        <div style={{
          width:"100%",maxWidth:360,
          background:t.cardBg,
          border:`1px solid ${t.cardBorder}`,
          borderRadius:14,overflow:"hidden",
          boxShadow:`${t.cardShadow},0 0 60px ${accentColor}0c`,
          animation:"fadeUp 0.45s cubic-bezier(0.4,0,0.2,1)",
          transition:"background 0.4s,border-color 0.3s,box-shadow 0.5s"
        }}>

          {/* Top bar */}
          <div style={{
            display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"10px 16px",
            borderBottom:`1px solid ${t.divider}`,
            background:t.topBarBg
          }}>
            <div style={{display:"flex",gap:5}}>
              {["#ff5f57","#ffbd2e","#28ca41"].map((c,i)=>(
                <div key={i} style={{width:7,height:7,borderRadius:"50%",background:c,opacity:0.75}}/>
              ))}
            </div>
            <span style={{color:t.labelFaint,fontSize:8.5,letterSpacing:2.5}}>NXTZEN · SECURE VERIFY</span>
            <div style={{
              width:6,height:6,borderRadius:"50%",
              background:accentColor,boxShadow:`0 0 8px ${accentColor}`,
              animation:"pulse 2s infinite"
            }}/>
          </div>

          {/* Body */}
          <div style={{padding:"24px 22px 22px"}}>

            {/* ── User strip ── */}
            <UserStrip name={userName} userId={userId} accentColor={accentColor} t={t}/>

            {/* Ring */}
            <div style={{marginBottom:20}}>
              <StatusRing state={state} dark={dark}/>
            </div>

            {/* Status */}
            <div style={{textAlign:"center",marginBottom:18}}>
              <div style={{
                color:accentColor,fontSize:11.5,fontWeight:700,
                letterSpacing:3.5,marginBottom:6,
                textShadow:`0 0 24px ${accentColor}44`,
                animation:isDone?"glowPulse 2.5s ease infinite":"none"
              }}>
                {statusText}
                {state==="scanning"&&<span style={{animation:"blink 1s infinite"}}>_</span>}
              </div>
              <div style={{color:t.textMuted,fontSize:9.5,letterSpacing:0.3,lineHeight:1.7}}>
                {subText}
              </div>
            </div>

            {/* Progress */}
            <div style={{marginBottom:16}}>
              <ProgressBar progress={progress} color={accentColor}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                <span style={{color:t.labelFaint,fontSize:7.5,letterSpacing:1.5}}>SCAN PROGRESS</span>
                <span style={{color:accentColor,fontSize:7.5,letterSpacing:1,opacity:0.8}}>{progress}%</span>
              </div>
            </div>

            {/* Logs */}
            <div style={{
              background:t.logBg,border:`1px solid ${t.logBorder}`,
              borderRadius:5,padding:"9px 11px",minHeight:70,marginBottom:14
            }}>
              {logs.length===0?(
                <div style={{color:t.labelFaint,fontSize:8.5,letterSpacing:1}}>&gt; AWAITING SCAN...</div>
              ):logs.map((log,i)=>(
                <div key={i} style={{
                  color:i===logs.length-1?t.logTextNew:t.logTextOld,
                  fontSize:8.5,letterSpacing:0.2,lineHeight:2,transition:"color 0.3s"
                }}>
                  <span style={{color:accentColor,opacity:0.6}}>&gt; </span>{log}
                </div>
              ))}
            </div>

            {/* Device ID */}
            {shortFp&&(
              <div style={{
                background:`${accentColor}08`,border:`1px solid ${accentColor}22`,
                borderRadius:5,padding:"7px 11px",marginBottom:12,
                display:"flex",justifyContent:"space-between",alignItems:"center"
              }}>
                <span style={{color:t.labelFaint,fontSize:7.5,letterSpacing:2}}>DEVICE ID</span>
                <span style={{color:accentColor,fontSize:8.5,letterSpacing:1}}>{shortFp}</span>
              </div>
            )}

            {/* Conflict banner */}
            {state==="conflict"&&(
              <div style={{
                background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.18)",
                borderRadius:5,padding:"11px 13px",marginBottom:12
              }}>
                <div style={{color:"#ef4444",fontSize:9,letterSpacing:2,marginBottom:5,fontWeight:700}}>
                  CONFLICT DETECTED
                </div>
                <div style={{color:t.textMuted,fontSize:8.5,lineHeight:1.8}}>
                  This device fingerprint is already bound to a different account. Each device may only link to one account.
                </div>
                <div style={{
                  marginTop:8,paddingTop:7,borderTop:"1px solid rgba(239,68,68,0.1)",
                  display:"flex",justifyContent:"space-between"
                }}>
                  <span style={{color:t.labelFaint,fontSize:7.5,letterSpacing:1}}>CODE</span>
                  <span style={{color:"#ef4444",fontSize:7.5,letterSpacing:0.5}}>DEVICE_ALREADY_REGISTERED</span>
                </div>
              </div>
            )}

            {/* Proceed button */}
            {isDone&&<ProceedButton label={btnLabel} color={accentColor}/>}
          </div>

          {/* Bottom bar */}
          <div style={{
            padding:"8px 16px",borderTop:`1px solid ${t.divider}`,
            background:t.bottomBarBg,display:"flex",justifyContent:"space-between"
          }}>
            <span style={{color:t.labelFaint,fontSize:7.5,letterSpacing:1}}>SHA-256 · AES-256 · TLS 1.3</span>
            <span style={{color:t.labelFaint,fontSize:7.5,letterSpacing:1}}>NXTZEN ENGINE</span>
          </div>
        </div>
      </div>
    </>
  );
}
