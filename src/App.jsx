import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root { --bg: #08080a; --panel: #111216; --panel-light: #18191e; --border: #23242b; --border-light: #383a45; --fg: #f0f0f2; --muted: #787a85; --accent: #ffffff; }
  [data-theme="light"] { --bg: #f4f4f6; --panel: #ffffff; --panel-light: #f0f0f2; --border: #d8d8dd; --border-light: #b8b8c0; --fg: #111216; --muted: #6a6a75; --accent: #111216; }
  body { background: var(--bg); color: var(--fg); font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; transition: background 0.4s, color 0.4s; }
  header, section, nav, div { transition: background-color 0.4s, border-color 0.4s; }
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg); }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-light); }
  .corners { position: relative; }
  .corners::before, .corners::after { content: ''; position: absolute; width: 8px; height: 8px; border: 1px solid var(--border-light); transition: border-color 0.3s ease; }
  .corners::before { top: 0; left: 0; border-right: none; border-bottom: none; }
  .corners::after { top: 0; right: 0; border-left: none; border-bottom: none; }
  .corners-inner { position: absolute; inset: 0; pointer-events: none; }
  .corners-inner::before, .corners-inner::after { content: ''; position: absolute; width: 8px; height: 8px; border: 1px solid var(--border-light); transition: border-color 0.3s ease; }
  .corners-inner::before { bottom: 0; left: 0; border-right: none; border-top: none; }
  .corners-inner::after { bottom: 0; right: 0; border-left: none; border-top: none; }
  .corners:hover::before, .corners:hover::after, .corners:hover .corners-inner::before, .corners:hover .corners-inner::after { border-color: var(--accent); }
  @keyframes scan { 0% { top: -10%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 110%; opacity: 0; } }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes radial-pulse { 0% { transform: scale(0.1); opacity: 0; border-width: 4px; } 50% { opacity: 0.5; } 100% { transform: scale(2.5); opacity: 0; border-width: 1px; } }
  @keyframes data-fall { from { transform: translateY(-100%); } to { transform: translateY(100%); } }
  @keyframes electric-arc { 0%, 100% { opacity: 0; } 10%, 90% { opacity: 0; } 50% { opacity: 1; stroke-dashoffset: 0; } }
  @keyframes particle-drift { 0% { transform: translate(0,0) scale(1); opacity: 0; } 50% { opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; } }
  @keyframes moveParticle { 0% { offset-distance: 0%; opacity: 0; transform: scale(0.5); } 5% { opacity: 1; transform: scale(1); } 95% { opacity: 1; transform: scale(1); } 100% { offset-distance: 100%; opacity: 0; transform: scale(0.5); } }
  @keyframes glitch { 0% { transform: translateX(0); opacity: 1; } 20% { transform: translateX(-3px); opacity: 0.8; } 40% { transform: translateX(3px); opacity: 0.9; } 60% { transform: translateX(-1px); opacity: 0.85; } 80% { transform: translateX(1px); opacity: 0.95; } 100% { transform: translateX(0); opacity: 1; } }
  @keyframes tickerScroll { from { transform: translateY(0); } to { transform: translateY(-50%); } }
  @keyframes navRipple { 0% { transform: translate(-50%,-50%) scale(0); opacity: 1; } 100% { transform: translate(-50%,-50%) scale(3); opacity: 0; } }
  @keyframes waveShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes waveSweepOnce { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

const M = ({ children, style = {} }) => <span style={{ fontFamily: "'JetBrains Mono', monospace", ...style }}>{children}</span>;
const DotP = ({ opacity = 0.08 }) => <div style={{ position: 'absolute', inset: 0, backgroundSize: '24px 24px', backgroundImage: 'radial-gradient(var(--border-light) 1px, transparent 1px)', opacity, pointerEvents: 'none' }} />;
const GridP = ({ opacity = 0.06 }) => <div style={{ position: 'absolute', inset: -20, backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)', opacity, pointerEvents: 'none' }} />;
const ScanL = () => <div style={{ position: 'absolute', width: '100%', height: 2, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)', top: 0, left: 0, animation: 'scan 8s linear infinite', zIndex: 10, pointerEvents: 'none' }} />;
const MetB = ({ label, value, unit }) => <div><M style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{label}</M><M style={{ fontSize: 12, color: 'var(--fg)' }}>{value}{unit && <span style={{ color: 'var(--muted)' }}>{unit}</span>}</M></div>;
const MobileCtx = createContext(false);
const ThemeCtx = createContext('dark');
const useIsMobile = () => { const [m, setM] = useState(false); useEffect(() => { const c = () => setM(window.innerWidth < 768); c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c); }, []); return m; };

const UTCClock = () => { const [t, setT] = useState(''); useEffect(() => { const tick = () => setT(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'); tick(); const iv = setInterval(tick, 1000); return () => clearInterval(iv); }, []); return <M style={{ fontSize: 10, color: 'var(--border-light)', textTransform: 'uppercase', letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums' }}>{t}</M>; };

const STitle = ({ children }) => {
  const mob = useContext(MobileCtx); const ref = useRef(null);
  const [swept, setSwept] = useState(false); const [done, setDone] = useState(false);
  useEffect(() => { const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSwept(true); obs.disconnect(); setTimeout(() => setDone(true), 1300); } }, { threshold: 0.5 }); if (ref.current) obs.observe(ref.current); return () => obs.disconnect(); }, []);
  const sweeping = swept && !done;
  return <h2 ref={ref} style={{ fontSize: mob ? '1.5rem' : '2.25rem', fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.2, fontFamily: "'Inter', sans-serif", ...(sweeping ? { background: 'linear-gradient(90deg, var(--fg) 0%, var(--fg) 35%, rgba(130,170,255,0.7) 45%, rgba(110,155,255,0.85) 50%, rgba(130,170,255,0.7) 55%, var(--fg) 65%, var(--fg) 100%)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'waveSweepOnce 1.2s ease-in-out forwards' } : { color: 'var(--fg)' }) }}>{children}</h2>;
};

// BOOT
const bootLines = [{ text: 'SATAIKKO v1.0', delay: 0 }, { text: 'Initializing research platform...', delay: 400 }, { text: 'Connecting market data feeds', delay: 800 }, { text: 'Calibrating signal models', delay: 1200 }, { text: 'All systems operational', delay: 1600 }, { text: '', delay: 1900 }, { text: 'READY', delay: 2000, accent: true }];
const BootScreen = ({ onComplete }) => {
  const mob = useContext(MobileCtx); const [lines, setLines] = useState([]); const [progress, setProgress] = useState(0); const [fading, setFading] = useState(false);
  useEffect(() => { bootLines.forEach((l) => setTimeout(() => setLines(p => [...p, l]), l.delay)); const piv = setInterval(() => setProgress(p => Math.min(p + 2.5, 100)), 50); const done = setTimeout(() => { setFading(true); setTimeout(onComplete, 500); }, 2800); return () => { clearInterval(piv); clearTimeout(done); }; }, [onComplete]);
  return (<div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: fading ? 0 : 1, transition: 'opacity 0.5s ease', padding: 24 }}><div style={{ width: '100%', maxWidth: 400, fontFamily: "'JetBrains Mono', monospace" }}>{lines.map((l, i) => <div key={i} style={{ fontSize: mob ? 10 : 11, color: l.accent ? 'var(--accent)' : l.text === '' ? 'transparent' : 'var(--muted)', marginBottom: 6, letterSpacing: '0.05em' }}>{l.text === '' ? '.' : (l.accent ? '> ' : '  ') + l.text}</div>)}<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}><div style={{ flex: 1, height: 1, background: 'var(--border)' }}><div style={{ height: '100%', background: progress < 100 ? 'var(--muted)' : 'var(--accent)', width: `${progress}%`, transition: 'width 0.1s, background 0.3s' }} /></div><M style={{ fontSize: 10, color: 'var(--muted)', width: 36, textAlign: 'right' }}>{progress}%</M></div></div></div>);
};

// TICKER
const SidebarTicker = () => {
  const mob = useContext(MobileCtx);
  const [data] = useState(() => { const types = ['SYS','MKT','SIG','RSK','MDL','DAT']; const rows = []; for (let i = 0; i < 60; i++) { rows.push(`${types[Math.floor(Math.random()*types.length)]} 0x${Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,'0').toUpperCase()} ${Math.random()>0.15?'OK':'WN'}`); } return rows; });
  if (mob) return null;
  return (<div style={{ position: 'fixed', right: 0, top: 56, bottom: 0, width: 22, zIndex: 40, overflow: 'hidden', borderLeft: '1px solid var(--border)', background: 'var(--bg)', opacity: 0.4 }}><div style={{ animation: 'tickerScroll 60s linear infinite', writingMode: 'vertical-rl', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace", fontSize: 7, color: 'var(--border-light)', letterSpacing: '0.05em', paddingTop: 8 }}>{[...data,...data].map((r,i) => <div key={i} style={{ marginBottom: 12, color: r.endsWith('WN') ? 'rgba(160,50,50,0.4)' : 'var(--border-light)' }}>{r}</div>)}</div></div>);
};

// SCRAMBLE TEXT
const GL = '\u2310\u2591\u2592\u2593\u256C\u256B\u256A\u253C\u2524\u251C\u2500\u2502\u2588\u2580\u2584\u00B1\u00D7\u00F7\u2261\u221E\u2234\u2235\u03B1\u03B2\u03B3\u03B4\u03A3\u03A9\u03BC';

// NAV BUTTON
const NavButton = ({ n, label, id, isActive, onClick }) => {
  const [hov, setHov] = useState(false); const [numDisplay, setNumDisplay] = useState(n); const [scanX, setScanX] = useState(-100); const [ripple, setRipple] = useState(false); const scrambleRef = useRef(null);
  useEffect(() => { if (hov) { let tick = 0; scrambleRef.current = setInterval(() => { tick++; if (tick > 6) { clearInterval(scrambleRef.current); setNumDisplay(n); return; } setNumDisplay(String(Math.floor(Math.random()*10))+String(Math.floor(Math.random()*10))); }, 50); setScanX(0); setTimeout(() => setScanX(110), 10); } else { if (scrambleRef.current) clearInterval(scrambleRef.current); setNumDisplay(n); setScanX(-100); } return () => { if (scrambleRef.current) clearInterval(scrambleRef.current); }; }, [hov, n]);
  const handleClick = () => { setRipple(true); setTimeout(() => setRipple(false), 400); onClick(); };
  return (<button onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={handleClick} style={{ height: '100%', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: isActive ? 'var(--fg)' : hov ? 'var(--fg)' : 'var(--muted)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', position: 'relative', transition: 'color 0.2s', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: `${scanX}%`, width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)', transition: hov ? 'left 0.4s ease-out' : 'none', pointerEvents: 'none' }} />
    {ripple && <div style={{ position: 'absolute', top: '50%', left: '50%', width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', transform: 'translate(-50%,-50%) scale(0)', animation: 'navRipple 0.4s ease-out forwards', pointerEvents: 'none' }} />}
    {isActive && <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(130,170,255,0.8)', boxShadow: '0 0 6px rgba(130,170,255,0.5)', animation: 'blink 2s infinite', flexShrink: 0 }} />}
    <M style={{ fontSize: 9, color: isActive ? 'var(--muted)' : hov ? 'rgba(130,170,255,0.7)' : 'var(--border-light)', transition: 'color 0.2s', fontVariantNumeric: 'tabular-nums', minWidth: 16 }}>{numDisplay}</M>
    <span style={{ position: 'relative' }}>{label}<span style={{ position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)', opacity: hov ? 0.5 : 0, transition: 'opacity 0.2s', color: 'var(--border-light)', fontSize: 9 }}>[</span><span style={{ position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)', opacity: hov ? 0.5 : 0, transition: 'opacity 0.2s', color: 'var(--border-light)', fontSize: 9 }}>]</span></span>
    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 1, background: isActive ? 'var(--accent)' : hov ? 'rgba(130,170,255,0.6)' : 'transparent', transform: (isActive||hov) ? 'scaleX(1)' : 'scaleX(0)', transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), background 0.3s', transformOrigin: 'left', boxShadow: hov && !isActive ? '0 0 8px rgba(130,170,255,0.3)' : 'none' }} />
    <div style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', height: 1, background: 'rgba(130,170,255,0.15)', transform: hov ? 'scaleX(1)' : 'scaleX(0)', transition: hov ? 'transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s' : 'transform 0.2s', transformOrigin: 'left' }} />
  </button>);
};

// THEME TOGGLE
const ThemeToggle = () => {
  const theme = useContext(ThemeCtx);
  const isDark = theme.mode === 'dark';
  return (
    <button onClick={theme.toggle} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 20, width: 36, height: 20, position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.3s' }} title={isDark ? 'Switch to light' : 'Switch to dark'}>
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--accent)', position: 'absolute', top: 2, left: isDark ? 2 : 18, transition: 'left 0.3s cubic-bezier(0.16,1,0.3,1)', boxShadow: isDark ? '0 0 6px rgba(130,170,255,0.4)' : 'none' }} />
    </button>
  );
};

// HEADER
const TARGET = 'SATAIKKO';
const Header = ({ active }) => {
  const mob = useContext(MobileCtx); const [menuOpen, setMenuOpen] = useState(false);
  const [chars, setChars] = useState(TARGET.split('')); const [phase, setPhase] = useState('idle');
  useEffect(() => { let to, iv; const run = () => { setPhase('scramble'); let t = 0; iv = setInterval(() => { setChars(TARGET.split('').map((ch, i) => t > 6+i*2 ? ch : GL[Math.floor(Math.random()*GL.length)])); t++; if (t > 24) { clearInterval(iv); setChars(TARGET.split('')); setPhase('idle'); to = setTimeout(run, 6000+Math.random()*4000); } }, 50); }; to = setTimeout(run, 3000); return () => { clearTimeout(to); clearInterval(iv); }; }, []);
  const nav = [{ n:'01',l:'Intelligence',id:'hero' },{ n:'02',l:'Technology',id:'tech' },{ n:'03',l:'Contact',id:'contact' }];
  return (<>
    <header style={{ height: 56, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: 'var(--panel)', flexShrink: 0, zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: mob ? 12 : 28, height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', width: 12, height: 12, transform: 'rotate(45deg)' }}>{[0,1,2,3].map(i => <div key={i} style={{ background: 'var(--accent)', width: 5, height: 5, transform: i===1?'translateY(6px)':i===2?'translateY(-6px)':'none' }} />)}</div>
          <div style={{ display: 'flex', position: 'relative' }}>{chars.map((ch,i) => <span key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, letterSpacing: '0.14em', color: phase==='scramble'&&ch!==TARGET[i]?'var(--muted)':'var(--fg)', transition: 'color 0.15s', display: 'inline-block', width: '0.95em', textAlign: 'center' }}>{ch}</span>)}<div style={{ position: 'absolute', bottom: -3, left: 0, right: 0, height: 1, background: phase==='scramble'?'linear-gradient(90deg, transparent, var(--accent), transparent)':'var(--border-light)', transition: 'background 0.3s', opacity: phase==='scramble'?0.8:0.3 }} /></div>
        </div>
        {!mob && <nav style={{ display: 'flex', alignItems: 'center', gap: 28, height: '100%' }}>{nav.map(item => <NavButton key={item.id} n={item.n} label={item.l} id={item.id} isActive={active===item.id} onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })} />)}</nav>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!mob && <><div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'blink 2s infinite' }} /><M style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--fg)', textTransform: 'uppercase' }}>Systems Active</M></>}
        {/* Theme toggle */}
        <ThemeToggle />
        {mob && <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}><div style={{ width: 18, height: 2, background: 'var(--fg)', marginBottom: 4 }} /><div style={{ width: 18, height: 2, background: 'var(--fg)', marginBottom: 4 }} /><div style={{ width: 12, height: 2, background: 'var(--fg)' }} /></button>}
      </div>
    </header>
    {mob && menuOpen && <div style={{ position: 'fixed', top: 56, left: 0, right: 0, bottom: 0, background: 'var(--bg)', zIndex: 49, padding: '32px 24px', backdropFilter: 'blur(8px)', opacity: 0.98 }}>{nav.map(item => <button key={item.id} onClick={() => { document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', color: active===item.id?'var(--fg)':'var(--muted)', fontSize: 14, padding: '14px 0', width: '100%', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}><M style={{ fontSize: 10, color: 'var(--border-light)' }}>{item.n}</M>{item.l}</button>)}</div>}
  </>);
};

// 01 HERO
const HeroSection = () => {
  const mob = useContext(MobileCtx); const cornersRef = useRef(null); const [vol, setVol] = useState(0.5);
  useEffect(() => { let t = 0; const iv = setInterval(() => { t += 0.02; setVol(0.5 + Math.sin(t*0.3)*0.3 + Math.sin(t*0.7)*0.15); }, 50); return () => clearInterval(iv); }, []);
  useEffect(() => { if (mob) return; const h = (e) => { if (!cornersRef.current) return; cornersRef.current.style.transform = `translate(${(e.clientX/window.innerWidth-0.5)*15}px, ${(e.clientY/window.innerHeight-0.5)*15}px)`; }; window.addEventListener('mousemove', h); return () => window.removeEventListener('mousemove', h); }, [mob]);
  const pulseSpeed = 4/(0.5+vol);
  return (
    <section id="hero" style={{ minHeight: '100vh', display: 'flex', flexDirection: mob ? 'column' : 'row', position: 'relative' }}>
      <div style={{ width: mob ? '100%' : '40%', minWidth: mob ? 'auto' : 420, borderRight: mob ? 'none' : '1px solid var(--border)', borderBottom: mob ? '1px solid var(--border)' : 'none', background: 'var(--panel)', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 20 }}>
        <GridP opacity={0.1} />
        <div style={{ padding: mob ? '40px 24px' : '64px 56px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
          <div style={{ marginBottom: mob ? 28 : 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}><span style={{ width: 20, height: 1, background: 'var(--border-light)' }} /><M style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--muted)', textTransform: 'uppercase' }}>Systematic Investment Management</M></div>
            <h1 style={{ fontSize: mob ? '2.2rem' : '3.8rem', fontWeight: 300, lineHeight: 1.08, letterSpacing: '-0.02em', fontFamily: "'Inter', sans-serif", background: 'linear-gradient(90deg, var(--fg) 0%, var(--fg) 35%, rgba(130,170,255,0.9) 45%, rgba(100,150,255,1) 50%, rgba(130,170,255,0.9) 55%, var(--fg) 65%, var(--fg) 100%)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'waveShimmer 8s ease-in-out infinite' }}>A scientific<br/>approach to<br/>finding value<br/><span style={{ WebkitTextFillColor: 'transparent', background: 'linear-gradient(90deg, var(--muted) 0%, var(--muted) 35%, rgba(100,130,200,0.8) 45%, rgba(90,120,190,0.9) 50%, rgba(100,130,200,0.8) 55%, var(--muted) 65%, var(--muted) 100%)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text', animation: 'waveShimmer 8s ease-in-out infinite', animationDelay: '1.5s' }}>in global markets.</span></h1>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: mob ? 13 : 15, maxWidth: 340, lineHeight: 1.7, borderLeft: '1px solid var(--border-light)', paddingLeft: 16 }}>We apply quantitative techniques, rigorous research, and advanced technology to systematically identify value opportunities across diversified global strategies.</p>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel-light)' }}><M style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SATAIKKO</M><UTCClock /></div>
      </div>
      <div style={{ flex: 1, background: 'var(--bg)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: mob ? 400 : 600 }}>
        <ScanL /><DotP opacity={0.15} />
        <div style={{ flex: 1, position: 'relative' }}>
          {!mob && <><div style={{ position: 'absolute', height: 1, background: 'var(--border-light)', width: '100%', top: '50%' }} /><div style={{ position: 'absolute', width: 1, background: 'var(--border-light)', height: '100%', left: '50%' }} /></>}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: mob ? 280 : 400, height: mob ? 220 : 300, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <div ref={cornersRef} className="corners" style={{ width: '100%', height: '100%', background: 'rgba(17,18,22,0.4)', backdropFilter: 'blur(4px)', padding: mob ? 16 : 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div className="corners-inner" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><M style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--accent)', textTransform: 'uppercase' }}>Research_Platform</M><M style={{ fontSize: 10, color: 'var(--muted)' }}>RP-01</M></div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', width: mob ? 120 : 192, height: mob ? 120 : 192, border: '1px solid rgba(130,170,255,0.5)', borderRadius: '50%', animation: `radial-pulse ${pulseSpeed}s cubic-bezier(0.165,0.84,0.44,1) infinite`, opacity: 0 }} />
                <svg style={{ position: 'absolute', width: mob ? 160 : 256, height: mob ? 160 : 256, pointerEvents: 'none', zIndex: 20 }} viewBox="0 0 100 100">{[{d:'M 50 50 L 70 30',dl:0.5},{d:'M 50 50 L 30 70',dl:1.2},{d:'M 50 50 L 65 65',dl:2.1}].map((a,i)=><path key={i} d={a.d} stroke="rgba(140,180,255,0.9)" strokeWidth="0.5" fill="none" style={{ strokeDasharray:50, strokeDashoffset:50, animation:`electric-arc ${2/(0.5+vol)}s linear infinite`, animationDelay:`${a.dl}s` }} />)}</svg>
                {[{w:mob?80:128,o:0.5,t:10},{w:mob?120:192,o:0.3,t:15},{w:mob?160:256,o:0.2,t:20}].map((r,i)=><div key={i} style={{ width:r.w, height:r.w, borderRadius:'50%', border:`1px solid ${i===2?'rgba(35,36,43,0.5)':'var(--border-light)'}`, position:'absolute', opacity:r.o, animation:`blink ${r.t/(0.5+vol)}s linear infinite`, animationDirection:i===1?'reverse':'normal' }}><div style={{ position:'absolute', top:-4, left:'50%', width:4, height:4, background:'var(--accent)', borderRadius:'50%', boxShadow:'0 0 8px rgba(130,170,255,0.6)' }} /></div>)}
                <div style={{ width: 8, height: 8, background: 'var(--accent)', position: 'absolute', boxShadow: '0 0 15px rgba(130,170,255,0.6), 0 0 4px white' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}><M style={{ fontSize: 10, color: 'var(--border-light)' }}>SYSTEMATIC RESEARCH</M><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg></div>
            </div>
          </div>
          {!mob && <><div style={{ position:'absolute', top:'20%', right:'15%', display:'flex', alignItems:'center', zIndex:20 }}><div style={{ width:64, height:1, background:'var(--border-light)', transform:'rotate(-30deg)', transformOrigin:'right' }} /><div style={{ display:'flex', alignItems:'center', gap:12 }}><div style={{ width:6, height:6, background:'var(--accent)' }} /><div style={{ display:'flex', flexDirection:'column' }}><M style={{ fontSize:9, letterSpacing:'0.15em', color:'var(--muted)', textTransform:'uppercase' }}>Research Infrastructure</M><M style={{ fontSize:10, letterSpacing:'0.1em', color:'var(--fg)', textTransform:'uppercase' }}>{'100,000+ Simulations'}</M></div></div></div>
          <div style={{ position:'absolute', bottom:'30%', left:'10%', display:'flex', alignItems:'center', flexDirection:'row-reverse', zIndex:20 }}><div style={{ width:96, height:1, background:'var(--border-light)', transform:'rotate(12deg)', transformOrigin:'left' }} /><div style={{ display:'flex', alignItems:'center', gap:12, flexDirection:'row-reverse' }}><div style={{ width:6, height:6, background:'var(--accent)' }} /><div style={{ display:'flex', flexDirection:'column', textAlign:'right' }}><M style={{ fontSize:9, letterSpacing:'0.15em', color:'var(--muted)', textTransform:'uppercase' }}>Proprietary Data</M><M style={{ fontSize:10, letterSpacing:'0.1em', color:'var(--fg)', textTransform:'uppercase' }}>Pipeline Active</M></div></div></div></>}
        </div>
        <div style={{ borderTop:'1px solid var(--border)', background:'var(--panel)', display:'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr 1fr', position:'relative', zIndex:20, flexShrink:0 }}>
          {[{n:'01',l:'Data Sources',v:'10,000',u:'+'},{n:'02',l:'Simulations Daily',v:'48,000',u:''},{n:'03',l:'System Uptime',v:'99.99',u:'%'}].map((s,i)=><div key={s.n} style={{ borderRight: !mob&&i<2?'1px solid var(--border)':'none', borderBottom: mob&&i<2?'1px solid var(--border)':'none', padding: mob ? '16px 24px' : 24, display:'flex', flexDirection: mob ? 'row' : 'column', justifyContent:'space-between', alignItems: mob ? 'center' : 'flex-start' }}><div style={{ display:'flex', alignItems:'center', gap:8 }}><M style={{ fontSize:10, color:'var(--border-light)' }}>{s.n}</M><M style={{ fontSize:10, letterSpacing:'0.1em', color:'var(--muted)', textTransform:'uppercase' }}>{s.l}</M></div><div style={{ fontSize: mob ? '1.5rem' : '2.25rem', fontWeight:300, color:'var(--fg)', letterSpacing:'-0.02em', fontFamily:"'Inter', sans-serif" }}>{s.v}{s.u&&<span style={{ fontSize: mob ? '0.9rem' : '1.25rem', color:'var(--muted)' }}>{s.u}</span>}</div></div>)}
        </div>
      </div>
    </section>
  );
};

// 02 TECHNOLOGY — signal canvas + stack
const TechSection = () => {
  const mob = useContext(MobileCtx); const theme = useContext(ThemeCtx); const canvasRef = useRef(null); const mouseRef = useRef({ x: 0.5, y: 0.5 }); const themeRef = useRef(theme.mode);
  useEffect(() => { themeRef.current = theme.mode; }, [theme.mode]);
  useEffect(() => { const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); let animId, time = 0;
    const resize = () => { const r = canvas.parentElement.getBoundingClientRect(); canvas.width = r.width * 2; canvas.height = r.height * 2; ctx.scale(2, 2); }; resize(); window.addEventListener('resize', resize);
    const hm = (e) => { const r = canvas.getBoundingClientRect(); mouseRef.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; }; canvas.addEventListener('mousemove', hm);
    canvas.addEventListener('touchmove', (e) => { const t = e.touches[0]; const r = canvas.getBoundingClientRect(); mouseRef.current = { x: (t.clientX - r.left) / r.width, y: (t.clientY - r.top) / r.height }; }, { passive: true });
    const draw = () => { const w = canvas.width / 2, h = canvas.height / 2, my = mouseRef.current.y, mx = mouseRef.current.x; time += 0.015; const isLight = themeRef.current === 'light'; ctx.fillStyle = isLight ? 'rgba(244,244,246,0.12)' : 'rgba(8,8,10,0.12)'; ctx.fillRect(0, 0, w, h); const cy = h / 2;
      ctx.strokeStyle = isLight ? 'rgba(180,180,190,0.3)' : 'rgba(56,58,69,0.3)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke(); for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(0, cy + i * 30); ctx.lineTo(w, cy + i * 30); ctx.moveTo(0, cy - i * 30); ctx.lineTo(w, cy - i * 30); ctx.stroke(); }
      const na = (1 - my) * 0.9 + 0.1; ctx.beginPath(); ctx.strokeStyle = `rgba(150,90,90,${na * 0.35})`; ctx.lineWidth = 1; for (let x = 0; x < w; x++) { const n = Math.sin(x * 0.02 + time * 2) * 20 * na + Math.sin(x * 0.05 + time * 3.7) * 15 * na + (Math.random() - 0.5) * 30 * na; x === 0 ? ctx.moveTo(x, cy + n) : ctx.lineTo(x, cy + n); } ctx.stroke();
      const ss = my; ctx.beginPath(); ctx.strokeStyle = isLight ? `rgba(30,30,40,${ss * 0.8 + 0.1})` : `rgba(240,240,242,${ss * 0.8 + 0.1})`; ctx.lineWidth = 1.5; ctx.shadowColor = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'; ctx.shadowBlur = ss * 12; for (let x = 0; x < w; x++) { const ph = x * 0.008 + time * 0.8; const s = Math.sin(ph) * 45 * ss + Math.sin(ph * 2.1 + 0.5) * 20 * ss; x === 0 ? ctx.moveTo(x, cy + s) : ctx.lineTo(x, cy + s); } ctx.stroke(); ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.strokeStyle = `rgba(130,170,255,${ss * 0.6})`; ctx.lineWidth = 0.8; ctx.shadowColor = 'rgba(100,150,255,0.8)'; ctx.shadowBlur = ss * 20; const freq = 0.003 + mx * 0.012; for (let x = 0; x < w; x++) { const a = Math.sin(x * freq + time * 1.2) * 60 * ss * ss; x === 0 ? ctx.moveTo(x, cy + a) : ctx.lineTo(x, cy + a); } ctx.stroke(); ctx.shadowBlur = 0;
      animId = requestAnimationFrame(draw); }; animId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); }; }, []);

  const stack = [
    { layer: 'L1', name: 'DATA SOURCING', desc: 'Structured and alternative data from thousands of sources, organized and enriched', metric: '10,000+ sources' },
    { layer: 'L2', name: 'MODELING', desc: 'Quantitative techniques from ridge regressions to deep learning to capture persistent signals', metric: '< 0.04ms' },
    { layer: 'L3', name: 'PORTFOLIO CONSTRUCTION', desc: 'Systematic strategy selection with rigorous out-of-sample validation', metric: '48,000 sims/day' },
    { layer: 'L4', name: 'RISK MANAGEMENT', desc: 'Multi-layered controls, correlation monitoring, drawdown containment', metric: '5 layers' },
    { layer: 'L5', name: 'EXECUTION', desc: 'Efficient multi-venue trade implementation and position management', metric: '24/7' },
  ];

  return (
    <section id="tech" style={{ minHeight: mob ? 'auto' : '100vh', display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border)', position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: mob ? 'column' : 'row', flex: 1 }}>
        {/* Left: Interactive signal canvas */}
        <div style={{ width: mob ? '100%' : '55%', position: 'relative', minHeight: mob ? 300 : 'auto', background: 'var(--bg)' }}>
          <DotP opacity={0.05} /><ScanL />
          <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 20 }}><M style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--accent)', textTransform: 'uppercase' }}>Signal_Extraction</M></div>
          <div style={{ position: 'absolute', bottom: 24, left: 24, zIndex: 20 }}><M style={{ fontSize: 9, color: 'var(--border-light)', textTransform: 'uppercase' }}>{mob ? '↑ TOUCH Y = CLARITY' : '↑ CURSOR Y = SIGNAL CLARITY'}</M></div>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair', minHeight: mob ? 300 : 500 }} />
        </div>
        {/* Right: Technology stack */}
        <div style={{ width: mob ? '100%' : '45%', borderLeft: mob ? 'none' : '1px solid var(--border)', borderTop: mob ? '1px solid var(--border)' : 'none', background: 'var(--panel)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <GridP opacity={0.06} />
          <div style={{ padding: mob ? '32px 24px' : '48px 40px', position: 'relative', zIndex: 10, borderBottom: '1px solid var(--border)' }}>
            <M style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 16, display: 'block' }}>SECTION // TECHNOLOGY</M>
            <STitle>Full-Stack Quantitative<br/>Intelligence</STitle>
          </div>
          <div style={{ flex: 1, padding: mob ? '0 24px' : '0 40px', position: 'relative', zIndex: 10 }}>
            {stack.map((s, i) => (
              <div key={s.layer} style={{ padding: mob ? '16px 0' : '20px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <M style={{ fontSize: 9, color: 'var(--border-light)' }}>{s.layer}</M>
                    <M style={{ fontSize: 11, color: 'var(--fg)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.name}</M>
                  </div>
                  <M style={{ fontSize: 10, color: 'rgba(130,170,255,0.6)' }}>{s.metric}</M>
                </div>
                <div style={{ marginLeft: 28, fontSize: 12, color: 'var(--muted)', fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: mob ? '12px 24px' : '16px 40px', borderTop: '1px solid var(--border)', background: 'var(--panel-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <M style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>RIGOROUS VALIDATION</M>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px rgba(120,160,255,0.5)' }} /><M style={{ fontSize: 10, color: 'var(--border-light)' }}>OUT-OF-SAMPLE TESTED</M></div>
          </div>
        </div>
      </div>
    </section>
  );
};

// 03 CONTACT — structured split layout matching sections 1+2
const ContactSection = () => {
  const mob = useContext(MobileCtx);
  const [vis, setVis] = useState(false); const secRef = useRef(null);
  useEffect(() => { const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.2 }); if (secRef.current) obs.observe(secRef.current); return () => obs.disconnect(); }, []);

  return (
    <section id="contact" ref={secRef} style={{ minHeight: mob ? 'auto' : '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: mob ? 'column' : 'row', flex: 1 }}>
        {/* Left panel — philosophy */}
        <div style={{ width: mob ? '100%' : '55%', background: 'var(--panel)', borderRight: mob ? 'none' : '1px solid var(--border)', borderBottom: mob ? '1px solid var(--border)' : 'none', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <GridP opacity={0.06} /><ScanL />
          <div style={{ padding: mob ? '32px 24px' : '48px 56px', borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 10 }}>
            <M style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 16, display: 'block' }}>SECTION // PHILOSOPHY</M>
            <STitle>We believe the best<br/>investment decisions are<br/>driven by data.</STitle>
          </div>
          <div style={{ padding: mob ? '32px 24px' : '48px 56px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
            <p style={{ color: 'var(--muted)', fontSize: mob ? 13 : 15, lineHeight: 1.8, fontFamily: "'Inter', sans-serif", maxWidth: 520, marginBottom: 32 }}>Our scientific approach is grounded in rigorous inquiry, systematic process, and disciplined risk management. We develop and deploy quantitative strategies on leading-edge systems, applying advanced statistical modeling to identify and act on investment opportunities across global markets.</p>
            <p style={{ color: 'var(--muted)', fontSize: mob ? 13 : 15, lineHeight: 1.8, fontFamily: "'Inter', sans-serif", maxWidth: 520, marginBottom: 40 }}>We seek the highest and best use of capital through continuous research, robust validation, and efficient execution — operating with the conviction that markets reward those who treat every assumption as a hypothesis to be tested.</p>
            <div style={{ display: 'flex', gap: mob ? 24 : 40, flexWrap: 'wrap' }}>
              {[{ l: 'Validation', v: 'Out-of-Sample' }, { l: 'Process', v: 'Systematic' }, { l: 'Risk Framework', v: 'Multi-Layer' }].map(s => <div key={s.l} style={{ padding: '12px 0', borderTop: '1px solid var(--border)' }}><M style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{s.l}</M><M style={{ fontSize: 12, color: 'var(--fg)' }}>{s.v}</M></div>)}
            </div>
          </div>
        </div>
        {/* Right panel — contact + institutional */}
        <div style={{ width: mob ? '100%' : '45%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <DotP opacity={0.06} />
          {/* Contact block */}
          <div style={{ padding: mob ? '32px 24px' : '48px 40px', borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 10 }}>
            <M style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 24, display: 'block' }}>Contact</M>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                <M style={{ fontSize: 9, color: 'var(--border-light)', textTransform: 'uppercase', display: 'block', marginBottom: 8, letterSpacing: '0.1em' }}>General Inquiries</M>
                <M style={{ fontSize: 13, color: 'var(--fg)' }}>contact@sataikko.com</M>
              </div>
              <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                <M style={{ fontSize: 9, color: 'var(--border-light)', textTransform: 'uppercase', display: 'block', marginBottom: 8, letterSpacing: '0.1em' }}>Careers</M>
                <M style={{ fontSize: 13, color: 'var(--fg)' }}>careers@sataikko.com</M>
              </div>
              <div style={{ padding: '16px 0' }}>
                <M style={{ fontSize: 9, color: 'var(--border-light)', textTransform: 'uppercase', display: 'block', marginBottom: 8, letterSpacing: '0.1em' }}>Investor Relations</M>
                <M style={{ fontSize: 13, color: 'var(--fg)' }}>ir@sataikko.com</M>
              </div>
            </div>
          </div>
          {/* Institutional details */}
          <div style={{ padding: mob ? '32px 24px' : '48px 40px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
            <M style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 24, display: 'block' }}>Firm Overview</M>
            {[
              { label: 'Founded', value: '2024' },
              { label: 'Headquarters', value: 'Helsinki' },
              { label: 'Approach', value: 'Systematic Quantitative' },
              { label: 'Markets', value: 'Global Multi-Asset' },
              { label: 'Research Infrastructure', value: '100,000+ Simulations / Day' },
              { label: 'Status', value: 'Privately Held' },
            ].map((m, i) => (
              <div key={m.label} style={{ padding: '12px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <M style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</M>
                <M style={{ fontSize: 11, color: 'var(--fg)' }}>{m.value}</M>
              </div>
            ))}
          </div>
          {/* System status */}
          <div style={{ padding: mob ? '12px 24px' : '16px 40px', borderTop: '1px solid var(--border)', background: 'var(--panel-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
            <M style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>ALL SYSTEMS OPERATIONAL</M>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px rgba(120,160,255,0.5)', animation: 'blink 2s infinite' }} /><UTCClock /></div>
          </div>
        </div>
      </div>
      {/* Footer bar */}
      <div style={{ padding: mob ? '16px 24px' : '20px 48px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: mob ? 'column' : 'row', justifyContent: 'space-between', alignItems: mob ? 'flex-start' : 'center', gap: mob ? 12 : 0, background: 'var(--panel)' }}>
        <div style={{ display: 'flex', gap: mob ? 24 : 48, flexWrap: 'wrap' }}><MetB label="Founded" value="MMXXIV" /><MetB label="Approach" value="Systematic" /><MetB label="Focus" value="Global Markets" /></div>
        <M style={{ fontSize: 10, color: 'var(--border-light)' }}>© SATAIKKO</M>
      </div>
      <div style={{ padding: '12px 24px', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
        <M style={{ fontSize: 9, color: 'var(--border)', letterSpacing: '0.03em', lineHeight: 1.6 }}>Sataikko Ltd. This website does not constitute an offer to sell, a solicitation to buy, or a recommendation for any security, nor does it constitute investment advice. Past performance is not indicative of future results.</M>
      </div>
    </section>
  );
};

// APP
export default function Sataikko() {
  const isMobile = useIsMobile();
  const [booted, setBooted] = useState(false); const [active, setActive] = useState('hero'); const [glitch, setGlitch] = useState(false);
  const [themeMode, setThemeMode] = useState('dark');
  const themeValue = { mode: themeMode, toggle: () => setThemeMode(t => t === 'dark' ? 'light' : 'dark') };
  const scrollRef = useRef(null); const lastSection = useRef('hero');
  useEffect(() => { document.documentElement.setAttribute('data-theme', themeMode); }, [themeMode]);
  useEffect(() => { const c = scrollRef.current; if (!c) return; const h = () => { for (const id of ['hero','tech','contact']) { const el = document.getElementById(id); if (el) { const r = el.getBoundingClientRect(); if (r.top <= 200 && r.bottom > 200) { if (id !== lastSection.current) { lastSection.current = id; if (!isMobile) { setGlitch(true); setTimeout(() => setGlitch(false), 120); } } setActive(id); break; } } } }; c.addEventListener('scroll', h); return () => c.removeEventListener('scroll', h); }, [isMobile]);
  const handleBoot = useCallback(() => setBooted(true), []);
  return (
    <ThemeCtx.Provider value={themeValue}>
    <MobileCtx.Provider value={isMobile}>
      <div data-theme={themeMode} style={{ height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontSize: 14, fontFamily: "'Inter', sans-serif", background: 'var(--bg)', color: 'var(--fg)', transition: 'background 0.4s, color 0.4s' }}>
        <style>{globalStyles}</style>
        {!booted && <BootScreen onComplete={handleBoot} />}
        {booted && <><Header active={active} />{!isMobile && <SidebarTicker />}<div ref={scrollRef} className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', scrollBehavior: 'smooth', paddingRight: isMobile ? 0 : 22, animation: glitch ? 'glitch 0.12s linear' : 'none' }}><HeroSection /><TechSection /><ContactSection /></div></>}
      </div>
    </MobileCtx.Provider>
    </ThemeCtx.Provider>);
}
