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
  if(state==="verified") return { main:"#1a7f5a", light:"#e8f5ef", border:"#b2dac9", text:"#155c42" };
  if(state==="conflict") return { main:"#b91c3c", light:"#fdf0f3", border:"#f0b8c4", text:"#9b1230" };
  if(state==="error")    return { main:"#c2700a", light:"#fef6ec", border:"#f5cfa0", text:"#a35e08" };
  return                        { main:"#1d4ed8", light:"#eff4ff", border:"#c3d4fc", text:"#1a3fbf" };
}

function ShieldIcon({ size=40, state }) {
  const c = getStateColor(state);
  const spinning = state==="scanning"||state==="idle";
  const done = ["verified","conflict","error"].includes(state);
  return (
    <div style={{ position:"relative", width:size*2.4, height:size*2.4, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <svg style={{ position:"absolute", inset:0 }} width={size*2.4} height={size*2.4} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="none" stroke={c.border} strokeWidth="1"/>
        {spinning && (
          <circle cx="50" cy="50" r="46" fill="none" stroke={c.main} strokeWidth="1.5"
            strokeDasharray="30 260" strokeLinecap="round"
            style={{ transformOrigin:"50px 50px", animation:"spin 2s linear infinite", opacity:0.6 }}/>
        )}
        {done && (
          <circle cx="50" cy="50" r="46" fill="none" stroke={c.main} strokeWidth="1.5" opacity="0.4"/>
        )}
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg,i) => {
          const r=(deg*Math.PI)/180;
          const major=i%3===0;
          const r1=major?43:44.5, r2=46;
          return <line key={i}
            x1={50+r1*Math.cos(r)} y1={50+r1*Math.sin(r)}
            x2={50+r2*Math.cos(r)} y2={50+r2*Math.sin(r)}
            stroke={c.main} strokeWidth={major?"1.2":"0.7"} opacity={major?0.5:0.25}/>;
        })}
      </svg>
      <div style={{
        width:size*1.5, height:size*1.5, borderRadius:"50%",
        background: done ? c.light : "rgba(248,249,252,0.9)",
        border:`1.5px solid ${c.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:`0 4px 24px rgba(0,0,0,0.06), 0 0 0 6px ${c.light}`,
        transition:"all 0.5s ease",
      }}>
        <svg width={size*0.72} height={size*0.82} viewBox="0 0 36 42" fill="none">
          <path d="M18 2L4 8v12c0 9 6.3 17.4 14 20 7.7-2.6 14-11 14-20V8L18 2z"
            fill={done ? c.light : "#f1f4fb"}
            stroke={c.main} strokeWidth="1.8" strokeLinejoin="round"/>
          {state==="verified" && (
            <polyline points="11,21 16,26 25,15"
              fill="none" stroke={c.main} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          )}
          {state==="conflict" && <>
            <line x1="13" y1="15" x2="23" y2="27" stroke={c.main} strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="23" y1="15" x2="13" y2="27" stroke={c.main} strokeWidth="2.2" strokeLinecap="round"/>
          </>}
          {state==="error" && <>
            <line x1="18" y1="14" x2="18" y2="24" stroke={c.main} strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="18" cy="28.5" r="1.5" fill={c.main}/>
          </>}
          {(state==="scanning"||state==="idle") && (
            <circle cx="18" cy="21" r="3.5" fill="none" stroke={c.main} strokeWidth="1.8"
              style={{ animation:"pulse 1.8s ease infinite" }}/>
          )}
        </svg>
      </div>
    </div>
  );
}

function Avatar({ name, color, textColor }) {
  const initials = name
    ? name.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase()
    : "?";
  return (
    <div style={{
      width:44, height:44, borderRadius:12, flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center",
      background:`linear-gradient(135deg, ${color}22, ${color}0a)`,
      border:`1.5px solid ${color}40`,
    }}>
      <span style={{
        fontSize:16, fontWeight:700, color: textColor,
        fontFamily:"'DM Sans','Segoe UI',sans-serif",
        letterSpacing:0.5,
      }}>{initials}</span>
    </div>
  );
}

function UserStrip({ name, userId, stateColors, dark }) {
  if(!name && !userId) return null;
  const displayName = name || "User";
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12,
      padding:"11px 14px", marginBottom:20,
      background: dark ? "rgba(255,255,255,0.04)" : "rgba(248,249,252,0.9)",
      border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
      borderRadius:10,
      animation:"fadeUp 0.4s ease both",
    }}>
      <Avatar name={displayName} color={stateColors.main} textColor={dark ? "#fff" : stateColors.text}/>
      <div style={{ display:"flex", flexDirection:"column", gap:3, minWidth:0 }}>
        <span style={{
          color: dark ? "#f0f2f8" : "#0f1629",
          fontSize:14, fontWeight:700, lineHeight:1.2,
          fontFamily:"'DM Sans','Segoe UI',sans-serif",
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
        }}>{displayName}</span>
        {userId && (
          <span style={{
            color: dark ? "rgba(255,255,255,0.32)" : "rgba(0,0,0,0.38)",
            fontSize:10, letterSpacing:1.5,
            fontFamily:"'IBM Plex Mono','Fira Code',monospace",
          }}>ID · {userId}</span>
        )}
      </div>
      <div style={{ marginLeft:"auto", flexShrink:0 }}>
        <div style={{
          width:7, height:7, borderRadius:"50%",
          background: stateColors.main,
          boxShadow:`0 0 0 3px ${stateColors.main}25`,
          animation:"pulse 2s ease infinite",
        }}/>
      </div>
    </div>
  );
}

function ProgressBar({ pct, stateColors, dark }) {
  return (
    <div>
      <div style={{
        height:3, borderRadius:4,
        background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
        overflow:"hidden",
      }}>
        <div style={{
          height:"100%", width:`${pct}%`,
          background:`linear-gradient(90deg, ${stateColors.main}88, ${stateColors.main})`,
          borderRadius:4,
          transition:"width 0.5s cubic-bezier(0.4,0,0.2,1)",
        }}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
        <span style={{
          color: dark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.32)",
          fontSize:9, letterSpacing:1.5,
          fontFamily:"'IBM Plex Mono','Fira Code',monospace",
        }}>VERIFICATION PROGRESS</span>
        <span style={{
          color: stateColors.main,
          fontSize:9, letterSpacing:1,
          fontFamily:"'IBM Plex Mono','Fira Code',monospace",
          fontWeight:600,
        }}>{pct}%</span>
      </div>
    </div>
  );
}

function LogPanel({ logs, stateColors, dark }) {
  return (
    <div style={{
      borderRadius:8, overflow:"hidden",
      border:`1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
      marginBottom:14,
    }}>
      <div style={{
        padding:"6px 12px",
        background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
        borderBottom:`1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
        display:"flex", alignItems:"center", gap:7,
      }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background: stateColors.main, opacity:0.7 }}/>
        <span style={{
          color: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)",
          fontSize:8.5, letterSpacing:2,
          fontFamily:"'IBM Plex Mono','Fira Code',monospace",
        }}>ACTIVITY LOG</span>
      </div>
      <div style={{
        padding:"10px 12px", minHeight:68,
        background: dark ? "rgba(0,0,0,0.2)" : "rgba(248,250,255,0.8)",
        fontFamily:"'IBM Plex Mono','Fira Code',monospace",
      }}>
        {logs.length===0
          ? <span style={{ color: dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)", fontSize:9 }}>Awaiting scan...</span>
          : logs.map((l,i)=>(
            <div key={i} style={{
              color: i===logs.length-1
                ? (dark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.7)")
                : (dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.28)"),
              fontSize:9, lineHeight:2.1, letterSpacing:0.2,
              transition:"color 0.3s",
            }}>
              <span style={{ color: stateColors.main, opacity:0.6, marginRight:6 }}>&rsaquo;</span>{l}
            </div>
          ))
        }
      </div>
    </div>
  );
}

function ProceedBtn({ stateColors, label, dark }) {
  const [hov, setHov] = useState(false);
  function go(){
    try{ window.Telegram?.WebApp?.close ? window.Telegram.WebApp.close() : window.close(); }
    catch{ window.close(); }
  }
  return (
    <button onClick={go}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        width:"100%", padding:"12px 0",
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        background: hov ? stateColors.main : (dark ? stateColors.main+"22" : stateColors.light),
        border:`1.5px solid ${stateColors.main}${hov?"":"55"}`,
        borderRadius:9,
        color: hov ? "#fff" : stateColors.main,
        cursor:"pointer", outline:"none",
        fontSize:11, letterSpacing:2, fontWeight:700,
        fontFamily:"'DM Sans','Segoe UI',sans-serif",
        transition:"all 0.2s ease",
        boxShadow: hov ? `0 8px 24px ${stateColors.main}35` : "none",
        animation:"fadeUp 0.4s ease both 0.1s",
      }}>
      {label}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function SunIcon({ size=13, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.4"/>
      {[0,45,90,135,180,225,270,315].map((deg,i)=>{
        const r=(deg*Math.PI)/180;
        return <line key={i}
          x1={8+5*Math.cos(r)} y1={8+5*Math.sin(r)}
          x2={8+6.8*Math.cos(r)} y2={8+6.8*Math.sin(r)}
          stroke={color} strokeWidth="1.3" strokeLinecap="round"/>;
      })}
    </svg>
  );
}

function MoonIcon({ size=13, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M13 10.5A6 6 0 0 1 5.5 3a6 6 0 1 0 7.5 7.5z"
        stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function VerifyClient({ token, session }) {
  const [state,       setState]      = useState("idle");
  const [pct,         setPct]        = useState(0);
  const [statusText,  setStatusText] = useState("Initializing");
  const [subText,     setSubText]    = useState("Preparing secure environment");
  const [fingerprint, setFingerprint]= useState("");
  const [logs,        setLogs]       = useState([]);
  const [dark,        setDark]       = useState(false);
  const hasRun = useRef(false);

  const C    = getStateColor(state);
  const done = ["verified","conflict","error"].includes(state);

  const userName = session?.first_name || session?.user_name || null;
  const userId   = session?.user_id    || null;

  const addLog = t => setLogs(p=>[...p.slice(-4),t]);
  const wait   = ms => new Promise(r=>setTimeout(r,ms));

  useEffect(()=>{
    if(hasRun.current)return;
    hasRun.current=true;
    try{window.Telegram?.WebApp?.ready();}catch{}
    if(!session){setState("error");setStatusText("Invalid Session");setSubText("This link does not exist");return;}
    if(session.status==="expired"||(session.expires_at&&new Date()>new Date(session.expires_at))){
      setState("error");setStatusText("Session Expired");setSubText("Request a new verification link from the bot");return;
    }
    if(session.status==="verified"){setState("verified");setStatusText("Already Verified");setSubText("Device already authenticated");setPct(100);return;}
    runScan();
  },[]);

  async function runScan(){
    setState("scanning");
    setStatusText("Scanning Device");setSubText("Collecting hardware parameters");
    addLog("Hardware profiler initiated");setPct(10);await wait(350);
    addLog("Canvas fingerprint captured");setPct(22);await wait(300);
    addLog("WebGL renderer identified");  setPct(36);await wait(300);
    addLog("Audio context fingerprinted");setPct(50);await wait(300);
    setStatusText("Generating Hash");setSubText("Computing SHA-256 fingerprint");
    addLog("Hashing entropy pool");
    let fp,comp;
    try{const r=await collectFingerprint();fp=r.fingerprint;comp=r.components;setFingerprint(fp);}
    catch{setState("error");setStatusText("Scan Failed");setSubText("Unable to read device parameters");return;}
    setPct(68);addLog("ID: "+fp.slice(0,12).toUpperCase()+"···");await wait(300);
    setStatusText("Authenticating");setSubText("Cross-referencing secure registry");
    setPct(84);await wait(400);
    try{
      const res=await fetch("/api/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,fingerprint:fp,components:comp})});
      const data=await res.json();setPct(100);
      if(!res.ok){
        if(data.code==="DEVICE_CONFLICT"){setState("conflict");setStatusText("Access Denied");setSubText("This device is bound to another account");addLog("Conflict: Duplicate identity detected");}
        else{setState("error");setStatusText("Verification Failed");setSubText(data.error||"An error occurred");}
        return;
      }
      setState("verified");setStatusText("Access Granted");setSubText("Identity confirmed — you may now proceed");addLog("Verification complete");
    }catch{setState("error");setStatusText("Network Error");setSubText("Connection to server failed");}
  }

  const shortFp = fingerprint
    ? fingerprint.slice(0,8).toUpperCase()+"···"+fingerprint.slice(-8).toUpperCase()
    : null;

  const bg        = dark ? "#0d1117"         : "#f4f6fb";
  const cardBg    = dark ? "#161b26"         : "#ffffff";
  const cardBdr   = dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";
  const cardShad  = dark
    ? "0 24px 64px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)"
    : "0 8px 48px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.9)";
  const headerBg  = dark ? "rgba(255,255,255,0.02)" : "#fafbfd";
  const headerBdr = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const footerBg  = dark ? "rgba(0,0,0,0.25)"      : "#f7f8fc";
  const labelClr  = dark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.38)";
  const titleClr  = dark ? "#eef0f8"                : "#0f1629";
  const subClr    = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)";
  const toggleBg  = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const toggleBdr = dark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.1)";
  const toggleClr = dark ? "rgba(255,255,255,0.5)"  : "rgba(0,0,0,0.45)";

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;background:${bg};transition:background 0.35s;}
        @keyframes spin    {to{transform:rotate(360deg);}}
        @keyframes fadeUp  {from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse   {0%,100%{opacity:0.6;}50%{opacity:1;}}
        @keyframes blink   {0%,100%{opacity:1;}50%{opacity:0;}}
        @keyframes subtleIn{from{opacity:0;}to{opacity:1;}}
      `}</style>

      <div style={{
        position:"fixed",inset:0,zIndex:0,
        background: dark
          ? "radial-gradient(ellipse 70% 50% at 20% 20%, rgba(29,78,216,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(26,127,90,0.05) 0%, transparent 60%), #0d1117"
          : "radial-gradient(ellipse 70% 50% at 20% 20%, rgba(219,234,254,0.6) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(209,250,229,0.4) 0%, transparent 60%), #f4f6fb",
        transition:"background 0.35s",
      }}/>

      <div style={{position:"fixed",top:16,right:16,zIndex:10}}>
        <button onClick={()=>setDark(d=>!d)} title={dark?"Light mode":"Dark mode"} style={{
          display:"flex",alignItems:"center",gap:6,
          padding:"6px 13px",
          background:toggleBg,border:`1px solid ${toggleBdr}`,borderRadius:7,
          cursor:"pointer",outline:"none",color:toggleClr,
          fontSize:10,letterSpacing:1.5,fontWeight:600,
          fontFamily:"'DM Sans','Segoe UI',sans-serif",
          transition:"all 0.25s",backdropFilter:"blur(12px)",
        }}>
          {dark ? <SunIcon color={toggleClr}/> : <MoonIcon color={toggleClr}/>}
          {dark ? "Light" : "Dark"}
        </button>
      </div>

      <div style={{
        position:"relative",zIndex:2,
        minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
        padding:"24px 16px",
        fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",
      }}>
        <div style={{
          width:"100%",maxWidth:380,
          background:cardBg,border:`1px solid ${cardBdr}`,
          borderRadius:18,overflow:"hidden",
          boxShadow:cardShad,
          animation:"fadeUp 0.45s cubic-bezier(0.4,0,0.2,1)",
          transition:"background 0.35s,border-color 0.35s,box-shadow 0.35s",
        }}>

          <div style={{
            display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"13px 18px",
            borderBottom:`1px solid ${headerBdr}`,
            background:headerBg,transition:"background 0.35s",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{
                width:28,height:28,borderRadius:8,
                background:`linear-gradient(135deg, ${C.main}22, ${C.main}0a)`,
                border:`1px solid ${C.main}35`,
                display:"flex",alignItems:"center",justifyContent:"center",
              }}>
                <svg width="13" height="13" viewBox="0 0 16 18" fill="none">
                  <path d="M8 1L2 4v6c0 4.5 2.8 8.7 6 9.5C11.2 18.7 14 14.5 14 10V4L8 1z"
                    stroke={C.main} strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{
                color:titleClr,fontSize:12,fontWeight:700,letterSpacing:0.3,
                transition:"color 0.35s",
              }}>NxtZen Verify</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{
                padding:"3px 8px",borderRadius:5,
                background:`${C.main}14`,border:`1px solid ${C.main}30`,
                color:C.main,fontSize:8.5,letterSpacing:1.5,fontWeight:600,
                fontFamily:"'IBM Plex Mono','Fira Code',monospace",
              }}>
                {done ? (state==="verified"?"VERIFIED":state==="conflict"?"BLOCKED":"ERROR") : "SCANNING"}
              </span>
            </div>
          </div>

          <div style={{padding:"24px 20px 20px"}}>
            <UserStrip name={userName} userId={userId} stateColors={C} dark={dark}/>

            <div style={{display:"flex",justifyContent:"center",marginBottom:24}}>
              <ShieldIcon size={40} state={state}/>
            </div>

            <div style={{textAlign:"center",marginBottom:22}}>
              <h2 style={{
                color:titleClr,fontSize:18,fontWeight:800,
                letterSpacing:-0.3,marginBottom:6,lineHeight:1.1,
                fontFamily:"'DM Sans','Segoe UI',sans-serif",
                transition:"color 0.35s",
              }}>
                {statusText}
                {!done&&<span style={{animation:"blink 1s step-start infinite",color:C.main}}>_</span>}
              </h2>
              <p style={{
                color:subClr,fontSize:12,lineHeight:1.6,
                transition:"color 0.35s",
              }}>{subText}</p>
            </div>

            <div style={{marginBottom:18}}>
              <ProgressBar pct={pct} stateColors={C} dark={dark}/>
            </div>

            <LogPanel logs={logs} stateColors={C} dark={dark}/>

            {shortFp && (
              <div style={{
                display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"9px 12px",marginBottom:14,
                background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)",
                border:`1px solid ${dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)"}`,
                borderRadius:8,
              }}>
                <span style={{
                  color:labelClr,fontSize:9,letterSpacing:1.5,
                  fontFamily:"'IBM Plex Mono','Fira Code',monospace",
                }}>DEVICE ID</span>
                <span style={{
                  color:C.main,fontSize:9.5,letterSpacing:0.8,fontWeight:600,
                  fontFamily:"'IBM Plex Mono','Fira Code',monospace",
                }}>{shortFp}</span>
              </div>
            )}

            {state==="conflict" && (
              <div style={{
                padding:"13px 14px",marginBottom:14,
                background: dark ? "rgba(185,28,60,0.08)" : "#fdf0f3",
                border:"1px solid rgba(185,28,60,0.2)",borderRadius:9,
                animation:"subtleIn 0.3s ease",
              }}>
                <div style={{
                  color:"#b91c3c",fontSize:10,fontWeight:700,
                  letterSpacing:1.5,marginBottom:6,
                  fontFamily:"'IBM Plex Mono','Fira Code',monospace",
                }}>DEVICE CONFLICT</div>
                <p style={{color:subClr,fontSize:11,lineHeight:1.7}}>
                  This device fingerprint is already bound to a different account. Each device may only be linked to one account.
                </p>
                <div style={{
                  display:"flex",justifyContent:"space-between",marginTop:9,
                  paddingTop:8,borderTop:"1px solid rgba(185,28,60,0.12)",
                }}>
                  <span style={{color:labelClr,fontSize:9,letterSpacing:1.5,fontFamily:"'IBM Plex Mono',monospace"}}>CODE</span>
                  <span style={{color:"#b91c3c",fontSize:9,letterSpacing:0.5,fontFamily:"'IBM Plex Mono',monospace",fontWeight:600}}>DEVICE_ALREADY_REGISTERED</span>
                </div>
              </div>
            )}

            {done && (
              <ProceedBtn stateColors={C} dark={dark}
                label={state==="verified"?"Continue to Bot":state==="conflict"?"Return to Bot":"Back to Bot"}
              />
            )}
          </div>

          <div style={{
            display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"9px 18px",
            borderTop:`1px solid ${headerBdr}`,
            background:footerBg,transition:"background 0.35s",
          }}>
            <span style={{color:labelClr,fontSize:8.5,letterSpacing:0.5,fontFamily:"'IBM Plex Mono',monospace"}}>
              TLS 1.3 · SHA-256 · AES-256
            </span>
            <span style={{color:labelClr,fontSize:8.5,letterSpacing:0.5,fontFamily:"'IBM Plex Mono',monospace"}}>
              NxtZen Engine
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
