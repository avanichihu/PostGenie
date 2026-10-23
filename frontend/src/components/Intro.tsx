import { useEffect, useRef, useState } from 'react'
const AR = 520 / 654 // genie width / height
// Rub lamp -> screen-wide smoke -> smoke sinks -> genie rises & sways (stretch) -> name + tagline -> collapse -> 360 circle (shrinking) -> corner.
export default function Intro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<'idle' | 'rub' | 'play'>('idle'), [rub, setRub] = useState(0), [say, setSay] = useState('The lamp has waited a long time.'), [logo, setLogo] = useState<'hide' | 'show' | 'collapse'>('hide')
  const g = useRef<HTMLImageElement>(null), sm = useRef<HTMLCanvasElement>(null), lamp = useRef<HTMLImageElement>(null), last = useRef<number | null>(null), mode = useRef(0), rubR = useRef(0), alive = useRef(true)
  rubR.current = rub
  useEffect(() => { // smoke
    const c = sm.current!, x = c.getContext('2d')!; let P: any[] = [], id = 0
    const rs = () => { c.width = innerWidth; c.height = innerHeight }; rs(); addEventListener('resize', rs)
    const puff = (px: number, py: number, big: boolean) => P.length < 320 && P.push({ x: px, y: py, r: big ? 90 + Math.random() * 90 : 16 + Math.random() * 16, g: big ? .6 : 1.2, dx: (Math.random() - .5) * (big ? .8 : 1), dy: big ? -(Math.random() * .3) : -(Math.random() * 1.2 + .3), l: 1, f: big ? .0012 : .008, k: Math.random() < .55 ? '255,243,210' : '212,175,55' })
    const loop = () => {
      x.clearRect(0, 0, c.width, c.height)
      if (mode.current === 0 && lamp.current && Math.random() < .1 + rubR.current / 100) { const r = lamp.current.getBoundingClientRect(); puff(r.left + r.width * (.1 + Math.random() * .8), r.top + r.height * (.3 + Math.random() * .6), false) }
      if (mode.current === 1) for (let i = 0; i < 4; i++) puff(Math.random() * c.width, Math.random() * c.height, true)
      if (mode.current === 2) P.forEach(p => { p.dy = Math.min(p.dy + .01, .9); p.f = .0065 })
      P = P.filter(p => { p.x += p.dx; p.y += p.dy; p.r += p.g; p.l -= p.f; if (p.l <= 0) return false; const gr = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); gr.addColorStop(0, `rgba(${p.k},${p.l * .3})`); gr.addColorStop(1, `rgba(${p.k},0)`); x.fillStyle = gr; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); return true })
      id = requestAnimationFrame(loop)
    }
    loop(); return () => { alive.current = false; cancelAnimationFrame(id); removeEventListener('resize', rs) }
  }, [])
  const glow = lamp.current ? { filter: `brightness(${1 + rub / 90}) drop-shadow(0 0 ${rub / 3}px #A5B4FC)` } : {}
  const awaken = () => { setStep('rub'); setRub(15); setSay('Something magical is about to happen...'); setTimeout(() => setSay('Give the lamp a little rub to awaken your Genie!'), 1600) }
  const addRub = (n: number) => setRub(r => { const v = Math.min(100, r + n); if (v >= 100 && step !== 'play') setTimeout(play, 0); return v })
  const play = () => {
    setStep('play'); setSay(''); mode.current = 1
    setTimeout(() => { mode.current = 2 }, 2200)
    setTimeout(() => {
      const el = g.current!, W = innerWidth, H = innerHeight, lr = lamp.current!.getBoundingClientRect(), sx = lr.left + lr.width * .97, sy = lr.top + lr.height * .33
      const big = Math.min(W * .8, H * .5), sm0 = 64, A = 1700, B = 3200, Cl = 800, C = 6500, D = 1300, rx = W / 2 - 50, ry = H / 2 - 50, cx = W / 2, cyh = H * .56, ecy = H / 2, ex = W - 46, ey = H - 46
      const ez = (t: number) => t * t * (3 - 2 * t); let st = 0; el.style.opacity = '1'; const t0 = performance.now()
      const f = (t: number) => {
        if (!alive.current) return; const e = t - t0; let x = 0, y = 0, s = big, sy_ = 1, rot = 0
        if (e < A) { const k = ez(e / A), q = e / A; x = sx + (cx - sx) * k; y = sy + (cyh - sy) * k; s = big * (.12 + .88 * k); sy_ = q < .85 ? .2 + .95 * q / .85 : 1.15 - .15 * (q - .85) / .15 }
        else if (e < A + B) { const q = e - A; x = cx + Math.sin(q / 700) * 14; y = cyh + Math.sin(q / 500) * 8; rot = Math.sin(q / 900) * 4; if (!st) { st = 1; setLogo('show') } if (q < 1000) sy_ = 1 + .1 * Math.sin(Math.PI * q / 1000) }
        else if (e < A + B + Cl) { const k = (e - A - B) / Cl; if (st < 2) { st = 2; setLogo('collapse') } x = cx; y = cyh; sy_ = 1 - .18 * Math.sin(Math.PI * k) }
        else if (e < A + B + Cl + C) { const k = (e - A - B - Cl) / C, a = Math.PI / 2 + k * Math.PI * 2, m = Math.min(1, k * 3); x = cx + Math.cos(a) * rx * m; y = cyh + (ecy + Math.sin(a) * ry - cyh) * m; s = big + (sm0 - big) * k; rot = Math.sin(k * 40) * 5 }
        else { const k = ez(Math.min(1, (e - A - B - Cl - C) / D)); x = cx + (ex - cx) * k; y = ecy + ry + (ey - ecy - ry) * k; s = sm0 }
        el.style.height = s + 'px'; el.style.width = s * AR + 'px'; el.style.left = x - s * AR / 2 + 'px'; el.style.top = y - s / 2 + 'px'; el.style.transform = `rotate(${rot}deg) scale(${1 + (1 - sy_) * .3},${sy_})`
        if (e < A + B + Cl + C + D) requestAnimationFrame(f); else onDone()
      }
      requestAnimationFrame(f)
    }, 2700)
  }
  return <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
    <button className="btn ghost" style={{ position: 'absolute', top: 16, right: 16, zIndex: 210 }} onClick={onDone}>Skip intro</button>
    <div style={{ position: 'absolute', top: '4%', transition: 'opacity .9s,transform .7s', opacity: logo === 'show' ? 1 : 0, transform: logo === 'show' ? 'none' : logo === 'collapse' ? 'scale(.3,0)' : 'scale(.8)', transformOrigin: '50% 0', zIndex: 140, textShadow: '0 0 30px #6366F1' }}>
      <h1 style={{ fontSize: 'clamp(46px,9vw,84px)', margin: 0, color: '#A5B4FC' }}>Post Genie</h1><div style={{ fontSize: 20, color: '#A5B4FC' }}>Your Wishes, Our Magic.</div></div>
    <div style={{ position: 'relative', width: 'min(78vw,calc(46vh*1.28))', marginTop: '12vh', transition: 'opacity .8s', opacity: step === 'play' ? .25 : 1 }}>
      <img ref={lamp} src="/lamp.png" alt="Magic lamp" style={{ width: '100%', display: 'block', ...glow }} />
      {step === 'rub' && <div style={{ position: 'absolute', inset: '5% 3%', cursor: 'grab', touchAction: 'none' }} onPointerDown={e => { last.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId) }} onPointerUp={() => (last.current = null)}
        onPointerMove={e => { if (last.current === null) return; addRub(Math.abs(e.clientX - last.current) * .15); last.current = e.clientX }} />}
    </div>
    <div style={{ margin: '16px 0 12px', fontSize: 18, color: '#8A94B8', minHeight: 28 }}>{say}</div>
    {step === 'idle' && <button className="btn" onClick={awaken}>Awaken the Genie</button>}
    {step === 'rub' && <div className="muted" style={{ width: 200 }}><div style={{ height: 4, background: '#2a2008', borderRadius: 4 }}><div style={{ width: rub + '%', height: 4, background: '#6366F1', borderRadius: 4 }} /></div>
      <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => { const t = setInterval(() => { addRub(8) }, 80); setTimeout(() => clearInterval(t), 1200) }}>Rub the lamp instead</button></div>}
    <canvas ref={sm} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 120 }} />
    <img ref={g} src="/genie.png" alt="" style={{ position: 'fixed', opacity: 0, zIndex: 130, pointerEvents: 'none', transformOrigin: '50% 88%', filter: 'drop-shadow(0 0 18px #6366F1)' }} />
  </div>
}
