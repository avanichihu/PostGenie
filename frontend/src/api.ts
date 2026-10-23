async function call(m: string, u: string, b?: any) {
  const r = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json' }, body: b === undefined ? undefined : JSON.stringify(b) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) { if (r.status === 402) window.dispatchEvent(new CustomEvent('pg-limit', { detail: j.detail })); throw new Error(j.detail || r.statusText) }
  return j
}
export const api = { get: (u: string) => call('GET', u), post: (u: string, b: any = {}) => call('POST', u, b), put: (u: string, b: any) => call('PUT', u, b), patch: (u: string, b: any) => call('PATCH', u, b), del: (u: string) => call('DELETE', u) }
