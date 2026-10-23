import { useEffect, useState } from 'react'
import { api } from '../api'
import { QRCodeSVG } from 'qrcode.react'
const UPI = 'jainchihu@oksbi', PAYEE = 'Avani'
const NOTES: Record<string, string> = { free: 'Try Post Genie', starter: 'For solo creators', pro: 'For busy brands' }
export default function Plans({ go }: { go: (t: string) => void }) {
  const [b, setB] = useState<any>(null), [msg, setMsg] = useState(''), [pay, setPay] = useState('')
  const load = () => api.get('/api/billing').then(setB).catch((e: any) => setMsg(e.message))
  useEffect(() => { load() }, [])
  const choose = async (p: string) => {
    try { const r = await api.post('/api/billing/plan', { plan: p }); setB(r); setMsg('You are now on the ' + r.plans[p].name + ' plan. Demo mode: no payment was taken.') } catch (e: any) { setMsg(e.message) }
  }
  if (!b) return <p className="muted">{msg || 'Loading plans…'}</p>
  return <>
    <h2>Plans</h2>
    <p className="muted">Limits reset every Monday. Next reset: {b.reset}.</p>
    {msg && <p style={{ color: '#22C55E' }}>{msg}</p>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 18, marginTop: 18 }}>
      {Object.entries(b.plans).map(([id, p]: any) => {
        const on = id === b.plan
        return <div key={id} className="card" style={{ border: on ? '2px solid #6366F1' : '1px solid #243055', padding: 22, borderRadius: 16 }}>
          <div className="muted">{NOTES[id]}</div>
          <h3 style={{ margin: '6px 0' }}>{p.name}</h3>
          <div style={{ fontSize: 34, fontWeight: 700 }}>₹{p.price}<span className="muted" style={{ fontSize: 15, fontWeight: 400 }}> /month</span></div>
          <ul style={{ lineHeight: 2, paddingLeft: 18, margin: '14px 0' }}>
            <li>{p.posts} posts per week</li>
            <li>{p.images} AI images per week</li>
            <li>Brand Kit and approval workflow</li>
          </ul>
          <button onClick={() => !on && (p.price > 0 ? setPay(id) : choose(id))} disabled={on} style={{ width: '100%', padding: '11px 0', borderRadius: 10, border: 0, cursor: on ? 'default' : 'pointer', background: on ? '#243055' : '#6366F1', color: '#fff', font: 'inherit', fontWeight: 600 }}>{on ? 'Current plan' : id === 'free' ? 'Switch to Free' : 'Choose ' + p.name}</button>
        </div>
      })}
    </div>
    {pay && (() => { const pl = b.plans[pay], link = `upi://pay?pa=${UPI}&pn=${encodeURIComponent(PAYEE)}&am=${pl.price}&cu=INR&tn=${encodeURIComponent('Post Genie ' + pl.name)}`
      return <div onClick={() => setPay('')} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 380, width: '100%', padding: 26, borderRadius: 18, textAlign: 'center', background: '#121A33', border: '1px solid #6366F1' }}>
          <h3 style={{ marginTop: 0 }}>Pay ₹{pl.price} for {pl.name}</h3>
          <div style={{ background: '#fff', padding: 14, borderRadius: 12, display: 'inline-block' }}><QRCodeSVG value={link} size={200} /></div>
          <p className="muted" style={{ fontSize: 13 }}>Scan with GPay, PhonePe, Paytm or any UPI app.<br />UPI ID: {UPI}</p>
          <a href={link} style={{ display: 'block', color: '#A5B4FC', marginBottom: 14 }}>Open in UPI app (on mobile)</a>
          <button onClick={async () => { await choose(pay); setPay('') }} style={{ width: '100%', background: '#6366F1', color: '#fff', border: 0, borderRadius: 10, padding: '11px 0', cursor: 'pointer', font: 'inherit', fontWeight: 600 }}>I have paid</button>
          <button onClick={() => setPay('')} style={{ background: 'none', border: 0, color: '#8A94B8', marginTop: 10, cursor: 'pointer', font: 'inherit' }}>Cancel</button>
        </div></div> })()}
    <p className="muted" style={{ marginTop: 18 }}>Prices are shown in INR. Pay securely by UPI QR.</p>
  </>
}
