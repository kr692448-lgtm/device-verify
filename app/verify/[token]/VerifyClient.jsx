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
  try { components.plugins = Array.from(navigator.plugins).map(p=>p.name).slice(0,5).join(","); } catch { components.plugins=""; }
  try {
    const canvas=document.createElement("canvas"); const ctx=canvas.getContext("2d");
    ctx.textBaseline="top"; ctx.font="14px Arial";
    ctx.fillStyle="#f60"; ctx.fillRect(125,1,62,20);
    ctx.fillStyle="#069"; ctx.fillText("NxtZen",2,15);
    ctx.fillStyle="rgba(102,204,0,0.7)"; ctx.fillText("NxtZen",4,17);
    components.canvas=canvas.toDataURL().slice(-50);
  } catch { components.canvas=""; }
  try {
    const gl=document.createElement("canvas").getContext("webgl");
    if(gl){const ext=gl.getExtension("WEBGL_debug_renderer_info");components.webgl=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);}
  } catch { components.webgl=""; }
  try {
    const ac=new(window.AudioContext||window.webkitAudioContext)();
    const osc=ac.createOscillator();const analyser=ac.createAnalyser();
    const gain=ac.createGain();gain.gain.value=0;
    osc.connect(analyser);analyser.connect(gain);gain.connect(ac.destination);
    osc.start(0);
    const freqData=new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(freqData);osc.stop();await ac.close();
    components.audio=freqData.slice(0,5).join(",");
  } catch { components.audio=""; }
  const raw=Object.values(components).join("|");
  const encoder=new TextEncoder();
  const data=encoder.encode(raw);
  const hashBuffer=await crypto.subtle.digest("SHA-256",data);
  const hashArray=Array.from(new Uint8Array(hashBuffer));
  const fingerprint=hashArray.map(b=>b.toString(16).padStart(2,"0")).join("");
  return { fingerprint, components };
}

/* ── STATE COLORS ── */
function getStateColor(state) {
  if (state==="verified") return { main:"#00ff88", dim:"rgba(0,255,136,0.15)", glow:"rgba(0,255,136,0.4)", track:"rgba(0,255,136,0.08)" };
  if (state==="conflict") return { main:"#ff3366", dim:"rgba(255,51,102,0.15)", glow:"rgba(255,51,102,0.4)", track:"rgba(255,51,102,0.08)" };
  if (state==="error")    return { main:"#ff9500", dim:"rgba(255,149,0,0.15)",  glow:"rgba(255,149,0,0.4)",  track:"rgba(255,149,0,0.08)"  };
  return                         { main:"#00cfff", dim:"rgba(0,207,255,0.15)",  glow:"rgba(0,207,255,0.4)",  track:"rgba(0,207,255,0.08)"  };
}

/* ── AVATAR ── */
function Avatar({ name, userId, color }) {
  const initials = name
    ? name.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase()
    : "?";
  return (
    <div style={{
      width:56, height:56, borderRadius:"50%", flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center",
      background:`radial-gradient(circle at 35% 35%, ${color}28, ${color}08)`,
      border:`1.5px solid ${color}45`,
      boxShadow:`0 0 0 4px ${color}10, 0 0 24px ${color}30`,
      position:"relative",
    }}>
      <span style={{
        fontSize:20, fontWeight:900, color:color, letterSpacing:1,
        textShadow:`0 0 20px ${color}`,
        fontFamily:"'SF Mono','Fira Code',monospace",
      }}>{initials}</span>
    </div>
  );
}

/* ── USER STRIP ── */
function UserStrip({ name, userId, color }) {
  if (!name && !userId) return null;
  const displayName = name || "User";
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:14,
      padding:"13px 14px", marginBottom:20,
      background:"rgba(255,255,255,0.02)",
      border:"1px solid rgba(255,255,255,0.06)",
      borderRadius:10,
      animation:"slideIn 0.4s cubic-bezier(0.4,0,0.2,1)",
    }}>
      <Avatar name={displayName} userId={userId} color={color} />
      <div style={{ display:"flex", flexDirection:"column", gap:5, minWidth:0 }}>
        <span style={{
          color:"#fff", fontSize:17, fontWeight:800, lineHeight:1,
          letterSpacing:0.3, fontFamily:"'SF Mono','Fira Code',monospace",
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
        }}>{displayName}</span>
        {userId && (
          <span style={{
            color:"rgba(255,255,255,0.28)", fontSize:10, letterSpacing:2,
            fontFamily:"'SF Mono','Fira Code',monospace",
          }}># {userId}</span>
        )}
      </div>
    </div>
  );
}

/* ── RING ── */
function Ring({ state }) {
  const c = getStateColor(state);
  const S=148, cx=74, r1=66, r2=52, r3=38;
  const spinning = state==="scanning"||state==="idle";
  const done     = ["verified","conflict","error"].includes(state);
  return (
    <div style={{ position:"relative", width:S, height:S, margin:"0 auto" }}>
      <svg width={S} height={S} style={{ position:"absolute", inset:0, overflow:"visible" }}>
        <defs>
          <filter id="f1"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="f2"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <radialGradient id="rg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={c.main} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={c.main} stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* tracks */}
        <circle cx={cx} cy={cx} r={r1} fill="none" stroke={c.track} strokeWidth="1"/>
        <circle cx={cx} cy={cx} r={r2} fill="none" stroke={c.track} strokeWidth="1" opacity="0.6"/>
        <circle cx={cx} cy={cx} r={r3} fill="none" stroke={c.track} strokeWidth="1" opacity="0.4"/>

        {/* spinning arcs */}
        {spinning && <>
          <circle cx={cx} cy={cx} r={r1} fill="none" stroke={c.main} strokeWidth="2"
            strokeDasharray={`${r1*1.3} ${r1*12}`} strokeLinecap="round"
            style={{transformOrigin:`${cx}px ${cx}px`,animation:"spin 1.8s linear infinite"}}
            filter="url(#f1)"/>
          <circle cx={cx} cy={cx} r={r2} fill="none" stroke={c.main} strokeWidth="1.5"
            strokeDasharray={`${r2*0.9} ${r2*12}`} strokeLinecap="round" opacity="0.55"
            style={{transformOrigin:`${cx}px ${cx}px`,animation:"spin 2.5s linear infinite reverse"}}/>
          <circle cx={cx} cy={cx} r={r3} fill="none" stroke={c.main} strokeWidth="1"
            strokeDasharray={`${r3*0.6} ${r3*12}`} strokeLinecap="round" opacity="0.3"
            style={{transformOrigin:`${cx}px ${cx}px`,animation:"spin 3.5s linear infinite"}}/>
        </>}

        {/* done solid rings */}
        {done && <>
          <circle cx={cx} cy={cx} r={r1} fill="none" stroke={c.main} strokeWidth="1.5" opacity="0.55" filter="url(#f1)"/>
          <circle cx={cx} cy={cx} r={r2} fill="none" stroke={c.main} strokeWidth="1" opacity="0.3"/>
        </>}

        {/* center */}
        <circle cx={cx} cy={cx} r={r3-5} fill="url(#rg)"/>
        <circle cx={cx} cy={cx} r={r3-5} fill="none" stroke={c.main} strokeWidth="1.2" opacity="0.4"/>

        {/* icons */}
        {state==="verified" && <polyline points={`${cx-14},${cx+1} ${cx-3},${cx+13} ${cx+16},${cx-14}`}
          fill="none" stroke={c.main} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#f2)"/>}
        {state==="conflict" && <>
          <line x1={cx-12} y1={cx-12} x2={cx+12} y2={cx+12} stroke={c.main} strokeWidth="2.5" strokeLinecap="round" filter="url(#f2)"/>
          <line x1={cx+12} y1={cx-12} x2={cx-12} y2={cx+12} stroke={c.main} strokeWidth="2.5" strokeLinecap="round"/>
        </>}
        {state==="error" && <>
          <line x1={cx} y1={cx-14} x2={cx} y2={cx+4} stroke={c.main} strokeWidth="2.5" strokeLinecap="round" filter="url(#f2)"/>
          <circle cx={cx} cy={cx+12} r="2.5" fill={c.main}/>
        </>}

        {/* orbit dots */}
        {[0,45,90,135,180,225,270,315].map((deg,i)=>{
          const rad=(deg*Math.PI)/180;
          return <circle key={i} cx={cx+r1*Math.cos(rad)} cy={cx+r1*Math.sin(rad)}
            r={i%2===0?2:1.2} fill={c.main} opacity={i%2===0?0.6:0.3}/>;
        })}
      </svg>

      {/* outer glow */}
      <div style={{
        position:"absolute", inset:-16, borderRadius:"50%",
        background:`radial-gradient(circle, ${c.glow} 0%, transparent 65%)`,
        pointerEvents:"none", opacity:0.6,
        animation: done ? "glowPulse 2.5s ease infinite" : "none",
      }}/>
    </div>
  );
}

/* ── PROGRESS ── */
function Progress({ pct, color }) {
  return (
    <div>
      <div style={{ height:1.5, background:"rgba(255,255,255,0.05)", borderRadius:2, overflow:"hidden" }}>
        <div style={{
          height:"100%", width:`${pct}%`,
          background:`linear-gradient(90deg, ${color}44, ${color})`,
          boxShadow:`0 0 14px ${color}88`,
          transition:"width 0.4s cubic-bezier(0.4,0,0.2,1)",
        }}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
        <span style={{ color:"rgba(255,255,255,0.18)", fontSize:7.5, letterSpacing:1.5 }}>SCAN PROGRESS</span>
        <span style={{ color, fontSize:7.5, letterSpacing:1, opacity:0.8 }}>{pct}%</span>
      </div>
    </div>
  );
}

/* ── BUTTON ── */
function ProceedBtn({ color, label }) {
  const [hov, setHov] = useState(false);
  function go() {
    try { window.Telegram?.WebApp?.close ? window.Telegram.WebApp.close() : window.close(); }
    catch { window.close(); }
  }
  return (
    <button onClick={go} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        width:"100%", padding:"13px 0",
        display:"flex", alignItems:"center", justifyContent:"center", gap:9,
        background: hov ? `${color}1a` : `${color}0d`,
        border:`1px solid ${color}${hov?"80":"38"}`,
        borderRadius:8, color, cursor:"pointer", outline:"none",
        fontSize:10, letterSpacing:3, fontWeight:700,
        fontFamily:"'SF Mono','Fira Code',monospace",
        transition:"all 0.2s ease",
        boxShadow: hov ? `0 0 30px ${color}28, inset 0 0 20px ${color}08` : "none",
        animation:"fadeUp 0.4s ease both 0.1s",
      }}>
      {label}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6h8M6 2l4 4-4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════ */
export default function VerifyClient({ token, session }) {
  const [state,       setState]      = useState("idle");
  const [pct,         setPct]        = useState(0);
  const [statusText,  setStatusText] = useState("INITIALIZING");
  const [subText,     setSubText]    = useState("Preparing secure environment");
  const [fingerprint, setFingerprint]= useState("");
  const [logs,        setLogs]       = useState([]);
  const hasRun = useRef(false);

  const C    = getStateColor(state);
  const done = ["verified","conflict","error"].includes(state);

  const userName = session?.first_name || session?.user_name || null;
  const userId   = session?.user_id   || null;

  const addLog = t => setLogs(p => [...p.slice(-4), t]);
  const wait   = ms => new Promise(r => setTimeout(r, ms));

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    try { window.Telegram?.WebApp?.ready(); } catch {}

    if (!session) {
      setState("error"); setStatusText("INVALID SESSION");
      setSubText("This link does not exist"); return;
    }
    if (session.status==="expired"||(session.expires_at&&new Date()>new Date(session.expires_at))) {
      setState("error"); setStatusText("SESSION EXPIRED");
      setSubText("Request a new verification link from the bot"); return;
    }
    if (session.status==="verified") {
      setState("verified"); setStatusText("ALREADY VERIFIED");
      setSubText("Device already authenticated"); setPct(100); return;
    }
    runScan();
  }, []);

  async function runScan() {
    setState("scanning");
    setStatusText("SCANNING DEVICE"); setSubText("Collecting hardware parameters");
    addLog("Initiating hardware profiler"); setPct(10); await wait(350);
    addLog("Canvas fingerprint sampled");  setPct(22); await wait(300);
    addLog("WebGL renderer identified");   setPct(36); await wait(300);
    addLog("Audio context fingerprinted"); setPct(50); await wait(300);
    setStatusText("GENERATING HASH"); setSubText("Computing SHA-256 fingerprint");
    addLog("Hashing entropy pool");
    let fp, comp;
    try {
      const r = await collectFingerprint();
      fp = r.fingerprint; comp = r.components;
      setFingerprint(fp);
    } catch {
      setState("error"); setStatusText("SCAN FAILED");
      setSubText("Unable to read device parameters"); return;
    }
    setPct(68); addLog("ID: "+fp.slice(0,12).toUpperCase()+"···"); await wait(300);
    setStatusText("AUTHENTICATING"); setSubText("Cross-referencing secure registry");
    setPct(84); await wait(400);
    try {
      const res = await fetch("/api/verify",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ token, fingerprint:fp, components:comp }),
      });
      const data = await res.json();
      setPct(100);
      if (!res.ok) {
        if (data.code==="DEVICE_CONFLICT") {
          setState("conflict"); setStatusText("ACCESS DENIED");
          setSubText("This device is bound to another account");
          addLog("CONFLICT: Duplicate identity detected");
        } else {
          setState("error"); setStatusText("VERIFICATION FAILED");
          setSubText(data.error||"An error occurred");
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

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;overflow-x:hidden;}

        @keyframes spin      { to{transform:rotate(360deg);} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        @keyframes slideIn   { from{opacity:0;transform:translateX(-12px);}to{opacity:1;transform:translateX(0);} }
        @keyframes blink     { 0%,100%{opacity:1;}50%{opacity:0;} }
        @keyframes pulse     { 0%,100%{opacity:0.3;}50%{opacity:1;} }
        @keyframes glowPulse { 0%,100%{opacity:0.4;}50%{opacity:0.9;} }
        @keyframes drift     { 0%{transform:translate(0,0);}50%{transform:translate(-8px,12px);}100%{transform:translate(0,0);} }
        @keyframes noiseDrift{ from{transform:translateY(0);}to{transform:translateY(40px);} }
        @keyframes scanline  { 0%{transform:translateY(-100%);}100%{transform:translateY(100vh);} }
      `}</style>

      {/* ── BACKGROUND ── */}
      <div style={{
        position:"fixed", inset:0, zIndex:0,
        background:"linear-gradient(160deg, #03040e 0%, #060818 50%, #04060f 100%)",
      }}/>

      {/* subtle grid */}
      <div style={{
        position:"fixed", inset:0, zIndex:0,
        backgroundImage:"linear-gradient(rgba(0,207,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,207,255,0.03) 1px,transparent 1px)",
        backgroundSize:"48px 48px",
        animation:"noiseDrift 8s linear infinite",
      }}/>

      {/* corner blobs */}
      <div style={{position:"fixed",top:-120,left:-120,width:400,height:400,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(0,207,255,0.06) 0%,transparent 70%)",
        animation:"drift 8s ease-in-out infinite",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:-100,right:-80,width:350,height:350,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(120,0,255,0.05) 0%,transparent 70%)",
        animation:"drift 10s ease-in-out infinite reverse",pointerEvents:"none",zIndex:0}}/>

      {/* scanline */}
      <div style={{
        position:"fixed",top:0,left:0,right:0,height:2,zIndex:1,pointerEvents:"none",
        background:"linear-gradient(90deg,transparent,rgba(0,207,255,0.15),transparent)",
        animation:"scanline 6s linear infinite",
      }}/>

      {/* ── CARD ── */}
      <div style={{
        position:"relative", zIndex:2,
        minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
        padding:"20px 16px",
        fontFamily:"'SF Mono','Fira Code','Consolas',monospace",
      }}>
        <div style={{
          width:"100%", maxWidth:365,
          background:"rgba(5,7,18,0.96)",
          border:"1px solid rgba(255,255,255,0.07)",
          borderRadius:16, overflow:"hidden",
          boxShadow:`0 60px 140px rgba(0,0,0,0.95), 0 0 80px ${C.main}0c, inset 0 1px 0 rgba(255,255,255,0.05)`,
          animation:"fadeUp 0.5s cubic-bezier(0.4,0,0.2,1)",
          backdropFilter:"blur(20px)",
          transition:"box-shadow 0.6s ease",
        }}>

          {/* ── TOP BAR ── */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"11px 16px",
            borderBottom:"1px solid rgba(255,255,255,0.05)",
            background:"rgba(255,255,255,0.01)",
          }}>
            <div style={{display:"flex",gap:6}}>
              {["#ff5f57","#ffbd2e","#28ca41"].map((c,i)=>(
                <div key={i} style={{width:8,height:8,borderRadius:"50%",background:c,opacity:0.7}}/>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{color:"rgba(255,255,255,0.15)",fontSize:8,letterSpacing:3}}>
                NXTZEN · SECURE VERIFY
              </span>
            </div>
            <div style={{
              width:7,height:7,borderRadius:"50%",
              background:C.main, boxShadow:`0 0 10px ${C.main}`,
              animation:"pulse 2s infinite",
            }}/>
          </div>

          {/* ── BODY ── */}
          <div style={{padding:"22px 20px 20px"}}>

            {/* user */}
            <UserStrip name={userName} userId={userId} color={C.main}/>

            {/* ring */}
            <div style={{marginBottom:22}}>
              <Ring state={state}/>
            </div>

            {/* status */}
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{
                color:C.main, fontSize:12, fontWeight:700, letterSpacing:4,
                marginBottom:7, lineHeight:1,
                textShadow:`0 0 30px ${C.main}66`,
                animation: done ? "glowPulse 2.5s ease infinite" : "none",
              }}>
                {statusText}
                {!done && <span style={{animation:"blink 1s step-start infinite"}}>_</span>}
              </div>
              <div style={{
                color:"rgba(255,255,255,0.35)", fontSize:9.5,
                letterSpacing:0.5, lineHeight:1.7,
              }}>
                {subText}
              </div>
            </div>

            {/* progress */}
            <div style={{marginBottom:16}}>
              <Progress pct={pct} color={C.main}/>
            </div>

            {/* logs */}
            <div style={{
              background:"rgba(0,0,0,0.45)",
              border:"1px solid rgba(255,255,255,0.04)",
              borderRadius:6, padding:"10px 12px", minHeight:74,
              marginBottom:14,
            }}>
              {logs.length===0
                ? <span style={{color:"rgba(255,255,255,0.14)",fontSize:8.5,letterSpacing:1}}>&gt; AWAITING SCAN...</span>
                : logs.map((l,i)=>(
                  <div key={i} style={{
                    color: i===logs.length-1 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.18)",
                    fontSize:8.5, letterSpacing:0.2, lineHeight:2.1,
                    transition:"color 0.3s",
                  }}>
                    <span style={{color:C.main,opacity:0.55}}>&gt; </span>{l}
                  </div>
                ))
              }
            </div>

            {/* device id */}
            {shortFp && (
              <div style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"8px 12px", marginBottom:12,
                background:`${C.main}07`,
                border:`1px solid ${C.main}20`,
                borderRadius:6,
              }}>
                <span style={{color:"rgba(255,255,255,0.2)",fontSize:7.5,letterSpacing:2}}>DEVICE ID</span>
                <span style={{color:C.main,fontSize:9,letterSpacing:1.2,opacity:0.9}}>{shortFp}</span>
              </div>
            )}

            {/* conflict note */}
            {state==="conflict" && (
              <div style={{
                padding:"12px 13px", marginBottom:12,
                background:"rgba(255,51,102,0.05)",
                border:"1px solid rgba(255,51,102,0.15)",
                borderRadius:6,
              }}>
                <div style={{color:"#ff3366",fontSize:9,letterSpacing:2,fontWeight:700,marginBottom:5}}>
                  CONFLICT DETECTED
                </div>
                <div style={{color:"rgba(255,255,255,0.38)",fontSize:8.5,lineHeight:1.9}}>
                  This device fingerprint is already bound to a different account. Each device may only link to one account.
                </div>
                <div style={{
                  display:"flex",justifyContent:"space-between",
                  marginTop:8,paddingTop:7,borderTop:"1px solid rgba(255,51,102,0.1)",
                }}>
                  <span style={{color:"rgba(255,255,255,0.18)",fontSize:7.5,letterSpacing:1}}>CODE</span>
                  <span style={{color:"#ff3366",fontSize:7.5,letterSpacing:0.5}}>DEVICE_ALREADY_REGISTERED</span>
                </div>
              </div>
            )}

            {/* button */}
            {done && (
              <ProceedBtn color={C.main}
                label={state==="verified" ? "PROCEED TO BOT" : state==="conflict" ? "RETURN TO BOT" : "BACK TO BOT"}
              />
            )}
          </div>

          {/* ── BOTTOM BAR ── */}
          <div style={{
            display:"flex", justifyContent:"space-between",
            padding:"8px 16px",
            borderTop:"1px solid rgba(255,255,255,0.04)",
            background:"rgba(0,0,0,0.35)",
          }}>
            <span style={{color:"rgba(255,255,255,0.14)",fontSize:7.5,letterSpacing:1}}>SHA-256 · AES-256 · TLS 1.3</span>
            <span style={{color:"rgba(255,255,255,0.14)",fontSize:7.5,letterSpacing:1}}>NXTZEN ENGINE</span>
          </div>

        </div>
      </div>
    </>
  );
}
