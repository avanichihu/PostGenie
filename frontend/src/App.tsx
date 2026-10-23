import { useEffect, useState } from 'react'
import { api } from './api'
import Fx from './components/Fx'
import Intro from './components/Intro'
import Setup from './components/Setup'
import GenieChat from './components/GenieChat'
import Dashboard from './pages/Dashboard'
import CreatePosts from './pages/CreatePosts'
import Approval from './pages/Approval'
import Queue from './pages/Queue'
import Calendar from './pages/Calendar'
import Captions from './pages/Captions'
import BrandKit from './pages/BrandKit'
import Settings from './pages/Settings'
import Insights from './pages/Insights'
import Plans from './pages/Plans'
import UsageBar from './components/UsageBar'
const TABS = ['Dashboard', 'Create Posts', 'Content Calendar', 'AI Caption Studio', 'Approval Center', 'Scheduled Queue', 'Brand Kit', 'Settings', 'Insights', 'Plans']
export default function App() {
  const [phase, setPhase] = useState<'intro' | 'setup' | 'app' | 'loading'>(() => { try { return localStorage.getItem('pg_intro') === '0' ? 'loading' : 'intro' } catch { return 'intro' } }), [tab, setTab] = useState('Dashboard')
  const [falling, setFalling] = useState(() => { try { return localStorage.getItem('pg_fall') !== '0' } catch { return true } })
  const toggleFall = (v: boolean) => { setFalling(v); try { localStorage.setItem('pg_fall', v ? '1' : '0') } catch {} }
  const next = async () => { try { const p = await api.get('/api/profile'); setPhase(p.setup_done ? 'app' : 'setup') } catch { setPhase('setup') } }
  const [introOn, setIntroOn] = useState(() => { try { return localStorage.getItem('pg_intro') !== '0' } catch { return true } })
  const toggleIntro = (v: boolean) => { setIntroOn(v); try { localStorage.setItem('pg_intro', v ? '1' : '0') } catch {} }
  useEffect(() => { if (phase === 'loading') next() }, [])
  const [limitMsg, setLimitMsg] = useState('')
  useEffect(() => { const h = (e: any) => setLimitMsg(e.detail || 'Plan limit reached.'); window.addEventListener('pg-limit', h); return () => window.removeEventListener('pg-limit', h) }, [])
  const page = () => tab === 'Dashboard' ? <Dashboard go={setTab} /> : tab === 'Create Posts' ? <CreatePosts go={setTab} /> : tab === 'Content Calendar' ? <Calendar /> : tab === 'AI Caption Studio' ? <Captions /> : tab === 'Approval Center' ? <Approval /> : tab === 'Scheduled Queue' ? <Queue /> : tab === 'Brand Kit' ? <BrandKit /> : tab === 'Insights' ? <Insights /> : tab === 'Plans' ? <Plans go={setTab} /> :
    <Settings falling={falling} setFalling={toggleFall} intro={introOn} setIntro={toggleIntro} replay={() => setPhase('intro')} redo={async () => { await api.put('/api/profile', { setup_done: false }); setPhase('setup') }} />
  return <>
    <Fx falling={falling} />
    {phase === 'intro' && <Intro onDone={next} />}
    {phase === 'setup' && <Setup onDone={() => setPhase('app')} />}
    {phase === 'app' && <>
      <nav style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'rgba(11,16,32,.88)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #243055', overflowX: 'auto' }}>
        <span style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 24, color: '#A5B4FC', marginRight: 14, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}><img src="/genie.png" alt="" style={{ height: 32 }} />Post Genie</span>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={{ background: t === tab ? 'rgba(99,102,241,.12)' : 'none', border: 0, color: t === tab ? '#E8ECF8' : '#8A94B8', padding: '8px 11px', borderRadius: 9, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: t === tab ? 'inset 0 -2px #6366F1' : 'none', font: 'inherit' }}>{t}</button>)}
      </nav>
      <main key={tab} className="page" style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '24px 18px 120px' }}>{(tab === 'Dashboard' || tab === 'Create Posts') && <UsageBar go={setTab} />}{page()}</main>
      <GenieChat page={tab} />
      {limitMsg && <div onClick={() => setLimitMsg('')} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 420, padding: 28, borderRadius: 18, textAlign: 'center', background: '#121A33', border: '1px solid #6366F1' }}>
          <h3 style={{ marginTop: 0 }}>You have hit your weekly limit</h3><p className="muted">{limitMsg}</p>
          <button onClick={() => { setLimitMsg(''); setTab('Plans') }} style={{ background: '#6366F1', color: '#fff', border: 0, borderRadius: 10, padding: '11px 22px', cursor: 'pointer', font: 'inherit', fontWeight: 600 }}>See plans</button>
          <div><button onClick={() => setLimitMsg('')} style={{ background: 'none', border: 0, color: '#8A94B8', marginTop: 12, cursor: 'pointer', font: 'inherit' }}>Not now</button></div>
        </div></div>}</>}
  </>
}
