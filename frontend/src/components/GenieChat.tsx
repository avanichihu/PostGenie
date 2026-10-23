import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
const LINES = ['Your wish is my command ✨', 'Need a hand? Ask the Genie', 'Let me show you some magic ✨']
export default function GenieChat({ page }: { page: string }) {
  const [open, setOpen] = useState(false), [m, setM] = useState<{ u: boolean, t: string }[]>([{ u: false, t: 'Hey there! What magic do you need today?' }]), [q, setQ] = useState('')
  const [show, setShow] = useState(false), [i, setI] = useState(0), [big, setBig] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => { const t = setTimeout(() => setShow(true), 2000); return () => clearTimeout(t) }, [])
  useEffect(() => { const t = setInterval(() => setI(x => (x + 1) % LINES.length), 4000); return () => clearInterval(t) }, [])
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight }, [m, open, big])
  const send = async () => { if (!q.trim()) return; const t = q; setQ(''); setM(x => [...x, { u: true, t }]); try { const r = await api.post('/api/chat', { message: t, page }); setM(x => [...x, { u: false, t: r.reply }]) } catch (e: any) { setM(x => [...x, { u: false, t: 'I could not reach the server: ' + e.message }]) } }
  return <>
    <style>{`@keyframes pgFade{0%{opacity:0;transform:translateY(6px)}15%{opacity:1;transform:none}85%{opacity:1}100%{opacity:0}}@keyframes pgGlow{0%,100%{box-shadow:0 0 14px rgba(99,102,241,.45)}50%{box-shadow:0 0 30px rgba(99,102,241,.95)}}`}</style>
    {open && <div className="card" style={{ position: 'fixed', right: 18, bottom: 100, zIndex: 250, width: big ? 'min(760px,calc(100vw - 36px))' : 'min(340px,calc(100vw - 36px))', height: big ? 'calc(100vh - 130px)' : 400, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid #243055' }}><b style={{ color: '#A5B4FC' }}>Genie</b><span><button aria-label="Maximize chat" title={big ? 'Make smaller' : 'Make bigger'} onClick={() => setBig(!big)} style={{ background: 'none', border: 0, color: '#8A94B8', cursor: 'pointer', fontSize: 18, marginRight: 8 }}>{big ? '⤡' : '⤢'}</button><button aria-label="Close chat" onClick={() => setOpen(false)} style={{ background: 'none', border: 0, color: '#8A94B8', cursor: 'pointer', fontSize: 18 }}>×</button></span></div>
      <div ref={box} style={{ flex: 1, overflow: 'auto', fontSize: big ? 16 : 14 }}>{m.map((x, k) => <p key={k} style={{ margin: '0 0 8px', padding: '8px 10px', borderRadius: 10, background: x.u ? 'rgba(99,102,241,.22)' : '#0e0b06', marginLeft: x.u ? 30 : 0 }}>{x.t}</p>)}</div>
      <div style={{ display: 'flex', gap: 6 }}><input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ask me about your posts…" /><button className="btn" onClick={send}>Send</button></div></div>}
    {show && !open && <div key={i} onClick={() => setOpen(true)} style={{ position: 'fixed', right: 94, bottom: 34, zIndex: 250, background: '#16120a', border: '1px solid #6366F1', color: '#E8ECF8', padding: '10px 14px', borderRadius: 14, borderBottomRightRadius: 4, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', animation: 'pgFade 4s ease-in-out forwards', boxShadow: '0 4px 18px rgba(0,0,0,.5)' }}>{LINES[i]}</div>}
    <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 250, width: 64, height: 64 }}>
      <button aria-label="Open Genie chat" onClick={() => setOpen(!open)} style={{ width: 64, height: 64, borderRadius: '50%', border: '1px solid #6366F1', background: '#0f0c07', cursor: 'pointer', animation: 'pgGlow 2.4s ease-in-out infinite', padding: 6 }}><img src="/genie.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></button>
      <span style={{ position: 'absolute', left: '50%', bottom: -8, transform: 'translateX(-50%)', background: '#6366F1', color: '#111', fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 10, pointerEvents: 'none' }}>Chat</span></div></>
}
