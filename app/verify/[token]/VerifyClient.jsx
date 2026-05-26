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

function getStateColor(state) {
  if(state==="verified") return { main:"#6366f1", grad:"#8b5cf6", light:"#eef2ff", border:"#c7d2fe", text:"#4338ca", badge:"#4f46e5" };
  if(state==="conflict") return { main:"#e11d48", grad:"#be123c", light:"#fff1f2", border:"#fecdd3", text:"#9f1239", badge:"#be123c" };
  if(state==="error")    return { main:"#d97706", grad:"#b45309", light:"#fffbeb", border:"#fde68a", text:"#92400e", badge:"#b45309" };
  return                        { main:"#0ea5e9", grad:"#6366f1", light:"#f0f9ff", border:"#bae6fd", text:"#0369a1", badge:"#0284c7" };
}

function SunIcon({ size=13, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.4"/>
      {[0,45,90,135,180,225,270,315].map((deg,i)=>{
        const r=(deg*Math.PI)/180;
        return <line key={i} x1={8+5*Math.cos(r)} y1={8+5*Math.sin(r)} x2={8+6.8*Math.cos(r)} y2={8+6.8*Math.sin(r)} stroke={color} strokeWidth="1.3" strokeLinecap="round"/>;
      })}
    </svg>
  );
}

function MoonIcon({ size=13, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M13 10.5A6 6 0 0 1 5.5 3a6 6 0 1 0 7.5 7.5z" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ShieldIcon({ size=40, state }) {
  const c = getStateColor(state);
  const spinning = state==="scanning"||state==="idle";
  const done = ["verified","conflict","error"].includes(state);
  return (
    <div style={{ position:"relative", width:size*2.4, height:size*2.4, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <svg style={{ position:"absolute", inset:0 }} width={size*2.4} height={size*2.4} viewBox="0 0 100 100">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c.main}/><stop offset="100%" stopColor={c.grad}/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="none" stroke={c.border} strokeWidth="1.2"/>
        {spinning && (
          <circle cx="50" cy="50" r="46" fill="none" stroke="url(#ringGrad)" strokeWidth="2"
            strokeDasharray="40 250" strokeLinecap="round"
            style={{ transformOrigin:"50px 50px", animation:"spin 1.8s linear infinite" }}/>
        )}
        {done && (
          <circle cx="50" cy="50" r="46" fill="none" stroke="url(#ringGrad)" strokeWidth="1.8" opacity="0.6"/>
        )}
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg,i) => {
          const r=(deg*Math.PI)/180; const major=i%3===0;
          return <line key={i} x1={50+(major?43:44.5)*Math.cos(r)} y1={50+(major?43:44.5)*Math.sin(r)}
            x2={50+46*Math.cos(r)} y2={50+46*Math.sin(r)}
            stroke={c.main} strokeWidth={major?"1.2":"0.7"} opacity={major?0.6:0.2}/>;
        })}
      </svg>
      <div style={{
        width:size*1.5, height:size*1.5, borderRadius:"50%",
        background: done ? `linear-gradient(135deg, ${c.light}, #fff)` : "linear-gradient(135deg, #f8faff, #fff)",
        border:`2px solid ${c.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:`0 4px 20px ${c.main}20, 0 0 0 5px ${c.light}`,
        transition:"all 0.5s ease",
      }}>
        <svg width={size*0.72} height={size*0.82} viewBox="0 0 36 42" fill="none">
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c.main}/><stop offset="100%" stopColor={c.grad}/>
            </linearGradient>
          </defs>
          <path d="M18 2L4 8v12c0 9 6.3 17.4 14 20 7.7-2.6 14-11 14-20V8L18 2z"
            fill={`${c.main}15`} stroke="url(#shieldGrad)" strokeWidth="1.8" strokeLinejoin="round"/>
          {state==="verified" && (
            <polyline points="11,21 16,26 25,15" fill="none" stroke="url(#shieldGrad)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          )}
          {state==="conflict" && <>
            <line x1="13" y1="15" x2="23" y2="27" stroke="url(#shieldGrad)" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="23" y1="15" x2="13" y2="27" stroke="url(#shieldGrad)" strokeWidth="2.2" strokeLinecap="round"/>
          </>}
          {state==="error" && <>
            <line x1="18" y1="14" x2="18" y2="24" stroke="url(#shieldGrad)" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="18" cy="28.5" r="1.5" fill={c.main}/>
          </>}
          {(state==="scanning"||state==="idle") && (
            <circle cx="18" cy="21" r="3.5" fill="none" stroke="url(#shieldGrad)" strokeWidth="1.8"
              style={{ animation:"pulse 1.8s ease infinite" }}/>
          )}
        </svg>
      </div>
    </div>
  );
}

function Avatar({ name, color, grad, light, text, dark }) {
  const initials = name ? name.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase() : "?";
  return (
    <div style={{
      width:44, height:44, borderRadius:12, flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center",
      background: dark ? `linear-gradient(135deg, ${color}30, ${grad}18)` : `linear-gradient(135deg, ${light}, ${color}18)`,
      border:`1.5px solid ${color}45`,
    }}>
      <span style={{ fontSize:16, fontWeight:800, color: dark ? color : text, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>{initials}</span>
    </div>
  );
}

function UserStrip({ name, userId, C, dark }) {
  if(!name && !userId) return null;
  const displayName = name || "User";
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12,
      padding:"11px 14px", marginBottom:20,
      background: dark ? "rgba(255,255,255,0.04)" : "rgba(248,249,255,0.95)",
      border:`1px solid ${dark ? "rgba(255,255,255,0.08)" : C.border}`,
      borderRadius:12, animation:"fadeUp 0.4s ease both",
    }}>
      <Avatar name={displayName} color={C.main} grad={C.grad} light={C.light} text={C.text} dark={dark}/>
      <div style={{ display:"flex", flexDirection:"column", gap:3, minWidth:0 }}>
        <span style={{
          color: dark ? "#f0f4ff" : "#0f1629", fontSize:14, fontWeight:700, lineHeight:1.2,
          fontFamily:"'DM Sans','Segoe UI',sans-serif",
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
        }}>{displayName}</span>
        {userId && (
          <span style={{
            color: dark ? "rgba(255,255,255,0.32)" : "rgba(0,0,0,0.38)",
            fontSize:10, letterSpacing:1.5, fontFamily:"'IBM Plex Mono','Fira Code',monospace",
          }}>ID · {userId}</span>
        )}
      </div>
      <div style={{ marginLeft:"auto", flexShrink:0 }}>
        <div style={{
          width:8, height:8, borderRadius:"50%",
          background:`linear-gradient(135deg, ${C.main}, ${C.grad})`,
          boxShadow:`0 0 0 3px ${C.main}30`,
          animation:"pulse 2s ease infinite",
        }}/>
      </div>
    </div>
  );
}

function ProgressBar({ pct, C, dark }) {
  return (
    <div>
      <div style={{ height:4, borderRadius:4, background: dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)", overflow:"hidden" }}>
        <div style={{
          height:"100%", width:`${pct}%`,
          background:`linear-gradient(90deg, ${C.main}, ${C.grad})`,
          borderRadius:4, transition:"width 0.5s cubic-bezier(0.4,0,0.2,1)",
          boxShadow:`0 0 10px ${C.main}60`,
        }}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
        <span style={{ color:dark?"rgba(255,255,255,0.28)":"rgba(0,0,0,0.32)", fontSize:9, letterSpacing:1.5, fontFamily:"'IBM Plex Mono',monospace" }}>VERIFICATION PROGRESS</span>
        <span style={{ color:C.main, fontSize:9, letterSpacing:1, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>{pct}%</span>
      </div>
    </div>
  );
}

function LogPanel({ logs, C, dark }) {
  return (
    <div style={{ borderRadius:10, overflow:"hidden", border:`1px solid ${dark?"rgba(255,255,255,0.07)":C.border}`, marginBottom:14 }}>
      <div style={{
        padding:"7px 12px",
        background: dark ? `linear-gradient(90deg, ${C.main}10, transparent)` : `linear-gradient(90deg, ${C.light}, #fff)`,
        borderBottom:`1px solid ${dark?"rgba(255,255,255,0.05)":C.border}`,
        display:"flex", alignItems:"center", gap:7,
      }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:`linear-gradient(135deg,${C.main},${C.grad})` }}/>
        <span style={{ color:dark?"rgba(255,255,255,0.4)":C.text, fontSize:8.5, letterSpacing:2, fontFamily:"'IBM Plex Mono',monospace", fontWeight:600 }}>ACTIVITY LOG</span>
      </div>
      <div style={{ padding:"10px 12px", minHeight:70, background:dark?"rgba(0,0,0,0.25)":C.light+"88", fontFamily:"'IBM Plex Mono',monospace" }}>
        {logs.length===0
          ? <span style={{ color:dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)", fontSize:9 }}>Awaiting scan...</span>
          : logs.map((l,i)=>(
            <div key={i} style={{
              color:i===logs.length-1?(dark?"rgba(255,255,255,0.8)":"rgba(0,0,0,0.72)"):(dark?"rgba(255,255,255,0.22)":"rgba(0,0,0,0.28)"),
              fontSize:9, lineHeight:2.1, transition:"color 0.3s",
            }}>
              <span style={{ color:C.main, marginRight:6, opacity:0.7 }}>&rsaquo;</span>{l}
            </div>
          ))
        }
      </div>
    </div>
  );
}

function ProceedBtn({ C, label }) {
  const [hov, setHov] = useState(false);
  function go(){ try{ window.Telegram?.WebApp?.close?window.Telegram.WebApp.close():window.close(); }catch{ window.close(); } }
  return (
    <button onClick={go} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      width:"100%", padding:"15px 0",
      display:"flex", alignItems:"center", justifyContent:"center", gap:9,
      background:`linear-gradient(135deg, ${C.main}, ${C.grad})`,
      border:"none", borderRadius:12, color:"#fff",
      cursor:"pointer", outline:"none",
      fontSize:14, letterSpacing:1.5, fontWeight:700,
      fontFamily:"'DM Sans','Segoe UI',sans-serif",
      transition:"all 0.22s ease",
      boxShadow: hov ? `0 12px 36px ${C.main}60, 0 4px 12px ${C.grad}40` : `0 6px 24px ${C.main}40`,
      transform: hov ? "translateY(-1px)" : "translateY(0)",
      animation:"fadeUp 0.4s ease both 0.1s",
      opacity: hov ? 0.92 : 1,
    }}>
      {label}
      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
        <path d="M2 6h8M6 2l4 4-4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

export default function VerifyClient({ token, session }) {
  const [state,        setState]      = useState("idle");
  const [pct,          setPct]        = useState(0);
  const [statusText,   setStatusText] = useState("Initializing");
  const [subText,      setSubText]    = useState("Preparing secure environment");
  const [fingerprint,  setFingerprint]= useState("");
  const [logs,         setLogs]       = useState([]);
  const [dark,         setDark]       = useState(true);
  const hasRun = useRef(false);

  const C    = getStateColor(state);
  const done = ["verified","conflict","error"].includes(state);

  // session se name aur id lo
  const userName = session?.first_name || null;
  const userId   = session?.user_id    || null;

  const addLog = t => setLogs(p=>[...p.slice(-4), t]);
  const wait   = ms => new Promise(r=>setTimeout(r, ms));

  useEffect(()=>{
    if(hasRun.current) return;
    hasRun.current = true;
    try{ window.Telegram?.WebApp?.ready(); }catch{}

    if(!session){
      setState("error"); setStatusText("Invalid Session");
      setSubText("This link does not exist or has been removed.");
      return;
    }
    if(
      session.status === "expired" ||
      (session.expires_at && new Date() > new Date(session.expires_at))
    ){
      setState("error"); setStatusText("Session Expired");
      setSubText("Request a new verification link from the bot.");
      return;
    }
    if(session.status === "verified"){
      setState("verified"); setStatusText("Already Verified");
      setSubText("This device is already authenticated."); setPct(100);
      return;
    }

    runScan();
  }, []);

  async function runScan(){
    setState("scanning");
    setStatusText("Scanning Device"); setSubText("Collecting hardware parameters");
    addLog("Hardware profiler initiated"); setPct(10); await wait(350);
    addLog("Canvas fingerprint captured"); setPct(22); await wait(300);
    addLog("WebGL renderer identified");   setPct(36); await wait(300);
    addLog("Audio context fingerprinted"); setPct(50); await wait(300);
    setStatusText("Generating Hash"); setSubText("Computing SHA-256 fingerprint");
    addLog("Hashing entropy pool");

    let fp, comp;
    try{
      const r = await collectFingerprint();
      fp = r.fingerprint; comp = r.components;
      setFingerprint(fp);
    } catch {
      setState("error"); setStatusText("Scan Failed");
      setSubText("Unable to read device parameters.");
      return;
    }

    setPct(68); addLog("ID: " + fp.slice(0,12).toUpperCase() + "···"); await wait(300);
    setStatusText("Authenticating"); setSubText("Cross-referencing secure registry");
    setPct(84); await wait(400);

    try{
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fingerprint: fp, components: comp }),
      });
      const data = await res.json();
      setPct(100);

      if(!res.ok){
        if(data.code === "DEVICE_CONFLICT"){
          setState("conflict");
          setStatusText("Access Denied");
          setSubText("This device is bound to another account.");
          addLog("Conflict: Duplicate identity detected");
        } else {
          setState("error");
          setStatusText("Verification Failed");
          setSubText(data.error || "An error occurred.");
        }
        return;
      }

      setState("verified");
      setStatusText("Access Granted");
      setSubText("Identity confirmed — you may now proceed.");
      addLog("Verification complete");
    } catch {
      setState("error");
      setStatusText("Network Error");
      setSubText("Connection to server failed.");
    }
  }

  const shortFp = fingerprint
    ? fingerprint.slice(0,8).toUpperCase() + "···" + fingerprint.slice(-8).toUpperCase()
    : null;

  const pageBg = dark
    ? `radial-gradient(ellipse 80% 60% at 15% 15%, ${C.main}12 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 85% 85%, ${C.grad}0e 0%, transparent 55%), #0b0e1a`
    : `radial-gradient(ellipse 80% 60% at 15% 15%, ${C.light} 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 85% 85%, ${C.border}80 0%, transparent 55%), #f0f4ff`;
  const cardBg  = dark ? "rgba(14,18,32,0.97)"   : "rgba(255,255,255,0.98)";
  const cardBdr = dark ? "rgba(255,255,255,0.08)" : C.border;
  const cardShad = dark
    ? `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px ${C.main}15, inset 0 1px 0 rgba(255,255,255,0.05)`
    : `0 12px 60px rgba(0,0,0,0.10), 0 0 0 1px ${C.border}, inset 0 1px 0 #fff`;
  const hdrBg   = dark ? `linear-gradient(90deg, ${C.main}0e, ${C.grad}08)` : `linear-gradient(90deg, ${C.light}, #fff)`;
  const hdrBdr  = dark ? "rgba(255,255,255,0.06)" : C.border;
  const ftrBg   = dark ? "rgba(0,0,0,0.3)"        : C.light + "aa";
  const labelClr = dark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.38)";
  const titleClr = dark ? "#eef2ff"                : "#0f1629";
  const subClr   = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)";
  const tglBg    = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const tglBdr   = dark ? "rgba(255,255,255,0.12)" : C.border;
  const tglClr   = dark ? "rgba(255,255,255,0.55)" : C.text;

  const badgeLabel = done
    ? (state==="verified" ? "VERIFIED" : state==="conflict" ? "BLOCKED" : "ERROR")
    : "SCANNING";

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;transition:background 0.35s;}
        @keyframes spin    {to{transform:rotate(360deg);}}
        @keyframes fadeUp  {from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse   {0%,100%{opacity:0.55;}50%{opacity:1;}}
        @keyframes blink   {0%,100%{opacity:1;}50%{opacity:0;}}
        @keyframes subtleIn{from{opacity:0;}to{opacity:1;}}
      `}</style>

      <div style={{ position:"fixed", inset:0, zIndex:0, background:pageBg, transition:"background 0.4s" }}/>

      <div style={{
        position:"relative", zIndex:2,
        minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
        padding:"24px 16px",
        fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",
      }}>
        <div style={{
          width:"100%", maxWidth:390,
          background:cardBg, border:`1px solid ${cardBdr}`,
          borderRadius:20, overflow:"hidden",
          boxShadow:cardShad,
          animation:"fadeUp 0.45s cubic-bezier(0.4,0,0.2,1)",
          transition:"background 0.35s,border-color 0.35s,box-shadow 0.4s",
        }}>

          {/* HEADER */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"12px 16px",
            borderBottom:`1px solid ${hdrBdr}`,
            background:hdrBg, transition:"background 0.35s",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{
                width:30, height:30, borderRadius:9,
                background:`linear-gradient(135deg, ${C.main}25, ${C.grad}15)`,
                border:`1.5px solid ${C.main}40`,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <svg width="14" height="15" viewBox="0 0 16 18" fill="none">
                  <defs>
                    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={C.main}/><stop offset="100%" stopColor={C.grad}/>
                    </linearGradient>
                  </defs>
                  <path d="M8 1L2 4v6c0 4.5 2.8 8.7 6 9.5C11.2 18.7 14 14.5 14 10V4L8 1z"
                    stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ color:titleClr, fontSize:13, fontWeight:700, letterSpacing:0.2, transition:"color 0.35s" }}>
                NxtZen Verify
              </span>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{
                padding:"3px 9px", borderRadius:6,
                background:`linear-gradient(135deg, ${C.main}18, ${C.grad}10)`,
                border:`1px solid ${C.main}40`,
                color:C.main, fontSize:8.5, letterSpacing:1.5, fontWeight:700,
                fontFamily:"'IBM Plex Mono',monospace",
              }}>{badgeLabel}</span>

              <button onClick={()=>setDark(d=>!d)} title={dark?"Light mode":"Dark mode"} style={{
                display:"flex", alignItems:"center", gap:5,
                padding:"5px 10px",
                background:tglBg, border:`1px solid ${tglBdr}`, borderRadius:7,
                cursor:"pointer", outline:"none", color:tglClr,
                fontSize:9, letterSpacing:1.2, fontWeight:600,
                fontFamily:"'DM Sans','Segoe UI',sans-serif",
                transition:"all 0.25s", backdropFilter:"blur(8px)",
              }}>
                {dark ? <SunIcon color={tglClr}/> : <MoonIcon color={tglClr}/>}
                {dark ? "Light" : "Dark"}
              </button>
            </div>
          </div>

          {/* BODY */}
          <div style={{ padding:"24px 20px 20px" }}>
            <UserStrip name={userName} userId={userId} C={C} dark={dark}/>

            <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
              <ShieldIcon size={40} state={state}/>
            </div>

            <div style={{ textAlign:"center", marginBottom:22 }}>
              <h2 style={{
                color:titleClr, fontSize:20, fontWeight:800,
                letterSpacing:-0.4, marginBottom:7, lineHeight:1.1,
                fontFamily:"'DM Sans','Segoe UI',sans-serif",
                transition:"color 0.35s",
              }}>
                {statusText}
                {!done && <span style={{ animation:"blink 1s step-start infinite", color:C.main }}>_</span>}
              </h2>
              <p style={{ color:subClr, fontSize:12.5, lineHeight:1.65, transition:"color 0.35s" }}>{subText}</p>
            </div>

            <div style={{ marginBottom:18 }}>
              <ProgressBar pct={pct} C={C} dark={dark}/>
            </div>

            <LogPanel logs={logs} C={C} dark={dark}/>

            {shortFp && (
              <div style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"10px 13px", marginBottom:14,
                background: dark ? `linear-gradient(90deg,${C.main}0a,${C.grad}06)` : C.light,
                border:`1px solid ${dark?"rgba(255,255,255,0.07)":C.border}`, borderRadius:9,
              }}>
                <span style={{ color:labelClr, fontSize:9, letterSpacing:1.5, fontFamily:"'IBM Plex Mono',monospace" }}>DEVICE ID</span>
                <span style={{ color:C.main, fontSize:9.5, letterSpacing:0.8, fontWeight:700, fontFamily:"'IBM Plex Mono',monospace" }}>{shortFp}</span>
              </div>
            )}

            {state==="conflict" && (
              <div style={{
                padding:"13px 14px", marginBottom:14,
                background: dark?"rgba(225,29,72,0.08)":"#fff1f2",
                border:"1px solid rgba(225,29,72,0.22)", borderRadius:10,
                animation:"subtleIn 0.3s ease",
              }}>
                <div style={{ color:"#e11d48", fontSize:10, fontWeight:700, letterSpacing:1.5, marginBottom:6, fontFamily:"'IBM Plex Mono',monospace" }}>DEVICE CONFLICT</div>
                <p style={{ color:subClr, fontSize:11, lineHeight:1.7 }}>
                  This device fingerprint is already bound to a different account. Each device may only be linked to one account.
                </p>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:9, paddingTop:8, borderTop:"1px solid rgba(225,29,72,0.12)" }}>
                  <span style={{ color:labelClr, fontSize:9, letterSpacing:1.5, fontFamily:"'IBM Plex Mono',monospace" }}>CODE</span>
                  <span style={{ color:"#e11d48", fontSize:9, fontWeight:700, fontFamily:"'IBM Plex Mono',monospace" }}>DEVICE_ALREADY_REGISTERED</span>
                </div>
              </div>
            )}

            {done && <ProceedBtn C={C} label={state==="verified"?"Continue to Bot":state==="conflict"?"Return to Bot":"Back to Bot"}/>}
          </div>

          {/* FOOTER */}
          <div style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"9px 18px",
            borderTop:`1px solid ${hdrBdr}`,
            background:ftrBg, transition:"background 0.35s",
          }}>
            <span style={{ color:labelClr, fontSize:8.5, letterSpacing:0.5, fontFamily:"'IBM Plex Mono',monospace" }}>TLS 1.3 · SHA-256 · AES-256</span>
            <span style={{ color:labelClr, fontSize:8.5, letterSpacing:0.5, fontFamily:"'IBM Plex Mono',monospace" }}>NxtZen Engine</span>
          </div>
        </div>
      </div>
    </>
  );
}
