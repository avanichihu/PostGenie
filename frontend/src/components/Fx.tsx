import { useEffect, useRef } from 'react'
function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number) { c.beginPath(); for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4, d = i % 2 ? r * .3 : r; c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d) } c.closePath(); c.fill() }
// Slow falling stars (bottom of page) + a slow, gentle star-pop on click.
export default function Fx({ falling }: { falling: boolean }) {
  const a = useRef<HTMLCanvasElement>(null), b = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ca = a.current!, cb = b.current!, xa = ca.getContext('2d')!, xb = cb.getContext('2d')!, rm = matchMedia('(prefers-reduced-motion:reduce)').matches
    let T = 0, id = 0, S: any[] = [], F: any[] = [], P: any[] = []
    const rs = () => { ca.width = cb.width = innerWidth; ca.height = cb.height = innerHeight; S = Array.from({ length: Math.min(150, innerWidth / 7 | 0) }, () => ({ x: Math.random() * ca.width, y: Math.random() * ca.height * .85, r: Math.random() * 1.5 + .4, a: Math.random() * 6 })) }
    rs(); addEventListener('resize', rs)
    const click = (e: MouseEvent) => { if (rm || e.detail === 0) return; P.push({ x: e.clientX, y: e.clientY, dx: 0, dy: 0, r: 12, l: 1, f: .02, rot: 0, vr: .02, c: '#FFF3C4', pop: 1 }); for (let i = 0; i < 9; i++) { const g = Math.random() * 6.28, s = Math.random() * 1 + .3; P.push({ x: e.clientX, y: e.clientY, dx: Math.cos(g) * s, dy: Math.sin(g) * s, r: Math.random() * 5 + 2, l: 1, f: .008 + Math.random() * .008, rot: Math.random() * 6, vr: (Math.random() - .5) * .08, c: Math.random() < .5 ? '#A5B4FC' : '#6366F1' }) } }
    addEventListener('click', click)
    const loop = () => {
      T++; xa.clearRect(0, 0, ca.width, ca.height); xb.clearRect(0, 0, cb.width, cb.height)
      xa.fillStyle = '#A5B4FC'; S.forEach(s => { xa.globalAlpha = .2 + .7 * Math.abs(Math.sin(T / 90 + s.a)); xa.fillRect(s.x, s.y, s.r, s.r) })
      if (falling && !rm) {
        if (F.length < 10 && Math.random() < .03) { const l = Math.random() * 70 + 12; F.push({ x: Math.random() * ca.width * 1.15, y: -20, l, v: .25 + l / 110 }) }
        F = F.filter(f => { f.x -= f.v * .45; f.y += f.v; const tx = f.x + f.l * .45, ty = f.y - f.l, g = xa.createLinearGradient(f.x, f.y, tx, ty); g.addColorStop(0, '#FFF3C4'); g.addColorStop(1, 'rgba(99,102,241,0)'); xa.globalAlpha = .85; xa.strokeStyle = g; xa.lineWidth = 1.3; xa.beginPath(); xa.moveTo(f.x, f.y); xa.lineTo(tx, ty); xa.stroke(); xa.fillStyle = '#FFF3C4'; star(xa, f.x, f.y, 3, 0); return f.y < ca.height + 20 })
      }
      P = P.filter(p => { p.x += p.dx; p.y += p.dy; p.dy += .004; p.l -= p.f; p.rot += p.vr; if (p.l <= 0) return false; xb.globalAlpha = p.l; xb.fillStyle = p.c; xb.shadowColor = '#6366F1'; xb.shadowBlur = 10; star(xb, p.x, p.y, p.r * (p.pop ? 2 - p.l : 1), p.rot); return true })
      id = requestAnimationFrame(loop)
    }
    loop(); return () => { cancelAnimationFrame(id); removeEventListener('resize', rs); removeEventListener('click', click) }
  }, [falling])
  return <><canvas ref={a} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} /><canvas ref={b} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 300 }} />
    <svg viewBox="0 0 1000 300" preserveAspectRatio="none" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, width: '100%', height: '30vh', zIndex: 0, pointerEvents: 'none' }}><defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a2a08" /><stop offset="1" stopColor="#070502" /></linearGradient></defs><path d="M0 170Q150 110 300 160T600 150T1000 130V300H0Z" fill="url(#dg)" opacity=".9" /><path d="M0 230Q200 170 420 220T800 200T1000 210V300H0Z" fill="#100b03" stroke="#6366F166" /></svg></>
}
