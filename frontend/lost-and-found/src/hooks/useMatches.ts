import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { claimService } from '../services/claimService'

export type MatchStatus = 'pending' | 'confirmed' | 'dismissed'
export type MatchSource = 'combined' | 'robust' | 'baseline'
export type MatchMode = 'live' | 'dataset'
export interface MatchItem {
  id: string; type: string; title: string; description: string
  location: string; date: string; tags: string[]; imageUrl?: string | null
}
export interface ItemMatch {
  id: string; score: number; imageSimilarity: number | null
  rankingScore?: number | null; evidence?: string; imageStatus?: string
  status: MatchStatus; commonTags: string[]; createdAt: string
  lostItem: MatchItem; foundItem: MatchItem
}

type Decisions = Record<string, MatchStatus>
function readDecisions(key: string): Decisions {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '{}')
    return Object.fromEntries(Object.entries(raw).filter(([, v]) => ['confirmed', 'dismissed'].includes(String(v)))) as Decisions
  } catch { return {} }
}
function saveDecision(key: string, id: string, status: MatchStatus) {
  try { localStorage.setItem(key, JSON.stringify({ ...readDecisions(key), [id]: status })) } catch { /* Browser storage may be disabled. */ }
}

export function useMatches(userId?: string) {
  const [mode, setMode] = useState<MatchMode>('live')
  const [source, setSource] = useState<MatchSource>('combined')
  const [revision, setRevision] = useState(0)
  const key = `matching-review-v1:${userId || 'signed-out'}:${mode}:${source}`
  const [state, setState] = useState<{ key: string; rows: ItemMatch[]; loading: boolean; error: string }>({ key: '', rows: [], loading: false, error: '' })
  const [action, setAction] = useState({ key: '', id: '', error: '' })

  useEffect(() => {
    if (!userId) return
    let active = true
    setState({ key, rows: [], loading: true, error: '' })
    api.get<ItemMatch[]>(`/matches/${mode}`, { params: { source, top_k: 3 } }).then(({ data }) => {
      if (!active) return
      const decisions = readDecisions(key)
      const rows = data.map(row => ({ ...row,
        // Real claims from the server take precedence over browser dismissals.
        status: row.status === 'confirmed' ? row.status :
          (mode === 'live' && decisions[row.id] === 'confirmed' ? row.status : decisions[row.id] || row.status),
        lostItem: { ...row.lostItem, imageUrl: row.lostItem.imageUrl ? api.getUri({ url: row.lostItem.imageUrl }) : null },
        foundItem: { ...row.foundItem, imageUrl: row.foundItem.imageUrl ? api.getUri({ url: row.foundItem.imageUrl }) : null },
      }))
      setState({ key, rows, loading: false, error: '' })
    }).catch(error => {
      if (active) setState({ key, rows: [], loading: false, error: typeof error.response?.data?.detail === 'string' ? error.response.data.detail : 'Could not load matches. Check the backend and try again.' })
    })
    return () => { active = false }
  }, [userId, mode, source, key, revision])

  const matches = userId && state.key === key ? state.rows : []
  const loading = !!userId && (state.key !== key || state.loading)
  const error = state.key === key ? state.error : ''
  const busyId = action.key === key ? action.id : ''
  async function confirm(id: string) {
    if (busyId) return
    const row = matches.find(m => m.id === id)
    if (!row || row.status !== 'pending') return
    const requestKey = key
    setAction({ key, id, error: '' })
    try {
      if (mode === 'live') {
        await claimService.createClaim({ item_id: row.foundItem.id })
      } else {
        saveDecision(key, id, 'confirmed')
      }
      setState(prev => prev.key !== requestKey ? prev : { ...prev, rows: prev.rows.map(m =>
        (mode === 'live' ? m.foundItem.id === row.foundItem.id : m.id === id) ? { ...m, status: 'confirmed' } : m) })
      setAction({ key: requestKey, id: '', error: '' })
    } catch (err) {
      const failure = err as { response?: { data?: { detail?: unknown } } }
      const detail = failure.response?.data?.detail
      setAction({ key: requestKey, id: '', error: typeof detail === 'string' ? detail : 'Claim could not be created. No confirmation was saved. Try again.' })
    }
  }
  function dismiss(id: string) {
    if (busyId) return
    saveDecision(key, id, 'dismissed')
    setState(prev => prev.key !== key ? prev : { ...prev, rows: prev.rows.map(m => m.id === id ? { ...m, status: 'dismissed' } : m) })
  }
  function resetReviews() {
    try { localStorage.removeItem(key) } catch { /* optional browser storage */ }
    setRevision(r => r + 1)
  }
  return { matches, mode, setMode, source, setSource, loading, error, busyId,
    actionError: action.key === key ? action.error : '', confirm, dismiss, resetReviews,
    refresh: () => setRevision(r => r + 1),
    pendingCount: loading || error ? 0 : matches.filter(m => m.status === 'pending').length }
}
export type MatchesController = ReturnType<typeof useMatches>
