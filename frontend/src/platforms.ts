import { useEffect, useState } from 'react'
import { api } from './api'
export const BASE = ['Instagram', 'Facebook', 'X', 'LinkedIn']
// The 4 defaults plus any platform connected in Settings (e.g. Snapchat).
export function usePlatforms() {
  const [list, setList] = useState<string[]>(BASE)
  useEffect(() => {
    api.get('/api/profile').then((p: any) => setList([...BASE, ...(p.connected || []).filter((c: string) => !BASE.includes(c))])).catch(() => {})
  }, [])
  return list
}
