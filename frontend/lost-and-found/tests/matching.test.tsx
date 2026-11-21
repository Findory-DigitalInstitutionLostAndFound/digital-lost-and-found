import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { useMatches } from '../src/hooks/useMatches'
import { MatchesPage } from '../src/pages/MatchesPage'
import { Header } from '../src/components/layout/Header'
import { api } from '../src/services/api'
import { claimService } from '../src/services/claimService'
vi.mock('../src/services/api', () => ({ api: { get: vi.fn(), put: vi.fn(), delete: vi.fn(), getUri: ({url}: {url:string}) => url } }))
vi.mock('../src/services/claimService', () => ({ claimService: { createClaim: vi.fn() } }))
const item = { id: 'L', type: 'lost', title: 'Wallet lost', description: 'Wallet', location: 'Library', date: '2026-11-17', tags: ['black'] }
const rows = [1, 2].map(n => ({ id: `L:F${n}`, score: 90, imageSimilarity: null, status: 'pending', commonTags: ['black'], createdAt: '', lostItem: item, foundItem: { ...item, id: `F${n}`, type: 'found', title: `Found wallet ${n}` } }))
function Harness() {
  const controller = useMatches('user-A')
  const [page, setPage] = useState('matches')
  return <><Header currentPage={page} navigate={setPage} pendingMatchesCount={controller.pendingCount} />
    <output aria-label="Pending count">{controller.pendingCount}</output>
    <button onClick={() => setPage(page === 'matches' ? 'dashboard' : 'matches')}>Toggle page</button>
    {page === 'matches' && <MatchesPage controller={controller} />}</>
}
const savedDismissals = new Set<string>()
beforeEach(() => {
  localStorage.clear(); savedDismissals.clear()
  vi.mocked(api.get).mockImplementation(async () => ({ data: rows.map(r => ({ ...r, status: savedDismissals.has(r.id) ? 'dismissed' : 'pending' })) }) as never)
  vi.mocked(api.put).mockImplementation(async (_url, body) => { const pair=body as {lost_item_id:string;found_item_id:string}; savedDismissals.add(`${pair.lost_item_id}:${pair.found_item_id}`); return {data:{status:'dismissed'}} })
  vi.mocked(api.delete).mockImplementation(async (_url, config) => { const pair=config?.data; savedDismissals.delete(`${pair.lost_item_id}:${pair.found_item_id}`); return {data:{status:'restored'}} })
  vi.mocked(claimService.createClaim).mockResolvedValue({ status: 'success', claim_id: 'claim', message: 'Created' })
})

afterEach(cleanup)
const count = () => screen.getByLabelText('Pending count').textContent

describe('matching UI and shared state', () => {
  it('loads the same count for navigation and pending filter, not a hardcoded one', async () => {
    render(<Harness />)
    await screen.findByRole('button', { name: 'pending (2)' })
    expect(count()).toBe('2')
    expect(screen.getByTitle('View Matches').textContent).toContain('2')
  })
  it('dismisses consistently and preserves decisions across navigation and refresh', async () => {
    const user = userEvent.setup(); render(<Harness />)
    await screen.findByRole('button', { name: 'pending (2)' })
    await user.click(screen.getAllByRole('button', { name: 'Not mine' })[0])
    expect(count()).toBe('1')
    await user.click(screen.getByText('Toggle page')); await user.click(screen.getByText('Toggle page'))
    expect(screen.getByRole('button', { name: 'dismissed (1)' })).toBeTruthy()
    await user.click(screen.getByText('Refresh matches'))
    await waitFor(() => expect(count()).toBe('1'))
  })
  it('creates a real claim only in live mode and updates counts after success', async () => {
    const user = userEvent.setup(); render(<Harness />)
    await screen.findByRole('button', { name: 'pending (2)' })
    await user.click(screen.getAllByRole('button', { name: 'Create claim' })[0])
    await waitFor(() => expect(count()).toBe('1'))
    expect(claimService.createClaim).toHaveBeenCalledWith({ item_id: 'F1' })
    expect(screen.getByRole('button', { name: 'confirmed (1)' })).toBeTruthy()
  })
  it('does not confirm a failed claim', async () => {
    vi.mocked(claimService.createClaim).mockRejectedValue(new Error('failed'))
    const user = userEvent.setup(); render(<Harness />)
    await screen.findByRole('button', { name: 'pending (2)' })
    await user.click(screen.getAllByRole('button', { name: 'Create claim' })[0])
    await screen.findByRole('alert'); expect(count()).toBe('2')
  })
  it('keeps dataset confirmation out of the claims API and restores it after remount', async () => {
    const user = userEvent.setup(); const view = render(<Harness />)
    await screen.findByRole('button', { name: 'pending (2)' })
    await user.selectOptions(screen.getByLabelText('Reports'), 'dataset')
    await screen.findAllByRole('button', { name: 'Confirm demo match' })
    await user.click(screen.getAllByRole('button', { name: 'Confirm demo match' })[0])
    expect(claimService.createClaim).not.toHaveBeenCalled()
    view.unmount(); render(<Harness />)
    await screen.findByRole('button', { name: 'pending (2)' })
    await user.selectOptions(screen.getByLabelText('Reports'), 'dataset')
    await screen.findByRole('button', { name: 'confirmed (1)' })
    expect(count()).toBe('1')
  })
  it('keeps live dismissals across matching methods', async () => {
    const user = userEvent.setup(); render(<Harness />)
    await screen.findByRole('button', { name: 'pending (2)' })
    await user.click(screen.getAllByRole('button', { name: 'Not mine' })[0])
    await user.selectOptions(screen.getByLabelText('Matching method'), 'baseline')
    await waitFor(() => expect(count()).toBe('1'))
    expect(api.get).toHaveBeenLastCalledWith('/matches/live', { params: { source: 'baseline', top_k: 3 } })
    await user.selectOptions(screen.getByLabelText('Matching method'), 'combined')
    await waitFor(() => expect(count()).toBe('1'))
  })
  it('shows errors with no fake count, and supports retry', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('network'))
    const user = userEvent.setup(); render(<Harness />)
    await screen.findByRole('alert'); expect(count()).toBe('0')
    await user.click(screen.getByText('Refresh matches'))
    await waitFor(() => expect(count()).toBe('2'))
  })
  it('shows an empty state when no candidate qualifies', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] }); render(<Harness />)
    await screen.findByText(/No eligible suggestions/); expect(count()).toBe('0')
  })
})

describe('request and identity isolation', () => {
  it('does not show a previous account’s cards while the next account loads', async () => {
    function AccountHarness({id}:{id:string}) {
      const c=useMatches(id)
      return <><output aria-label="account-count">{c.pendingCount}</output><MatchesPage controller={c}/></>
    }
    const view=render(<AccountHarness id="A"/>)
    await screen.findByRole('button',{name:'pending (2)'})
    let resolve!: (value: unknown) => void
    vi.mocked(api.get).mockImplementationOnce(() => new Promise(r => {resolve=r}) as never)
    view.rerender(<AccountHarness id="B"/>)
    expect(screen.getByLabelText('account-count').textContent).toBe('0')
    expect(screen.queryByText('Found wallet 1')).toBeNull()
    resolve({data:[]})
    await screen.findByText(/No eligible suggestions/)
  })
  it('ignores a stale response when the method changes during loading',async()=>{
    let resolve!: (value:unknown)=>void
    vi.mocked(api.get).mockImplementationOnce(()=>new Promise(r=>{resolve=r}) as never)
    const user=userEvent.setup();render(<Harness/>);
    await user.selectOptions(screen.getByLabelText('Matching method'),'baseline')
    await screen.findByRole('button',{name:'pending (2)'})
    resolve({data:[]})
    await waitFor(()=>expect(screen.getByRole('button',{name:'pending (2)'})).toBeTruthy())
    expect(count()).toBe('2')
  })
  it('restores a submitted claim from the backend after a reload',async()=>{
    vi.mocked(api.get).mockResolvedValue({data:[{...rows[0],status:'confirmed'}]})
    render(<Harness/>);
    await screen.findByRole('button',{name:'confirmed (1)'})
    expect(count()).toBe('0')
    expect(claimService.createClaim).not.toHaveBeenCalled()
  })
})

describe('combined evidence display', () => {
  it('shows image evidence and its rank separately from the text score', async () => {
    vi.mocked(api.get).mockResolvedValue({data:[{...rows[0],imageSimilarity:.91,rankingScore:99.25,evidence:'text+image'}]})
    render(<Harness/>);
    await screen.findByText(/Text \+ image ranking/)
    expect(screen.getByText('Image cosine: 0.910')).toBeTruthy()
    expect(screen.getByText('90/100')).toBeTruthy()
    expect(screen.getByLabelText('Matching method')).toHaveProperty('value','combined')
  })
  it('labels a missing-image fallback without inventing an image score', async () => {
    vi.mocked(api.get).mockResolvedValue({data:[{...rows[0],rankingScore:100,evidence:'text-only'}]})
    render(<Harness/>);
    await screen.findByText(/Text-only fallback/)
    expect(screen.queryByText(/Image cosine:/)).toBeNull()
  })
})

describe('database-backed dismissals',()=>{
  it('waits for server success and does not store live dismissals in localStorage',async()=>{
    const user=userEvent.setup();render(<Harness/>);
    await screen.findByRole('button',{name:'pending (2)'})
    await user.click(screen.getAllByRole('button',{name:'Not mine'})[0])
    await waitFor(()=>expect(count()).toBe('1'))
    expect(api.put).toHaveBeenCalledWith('/matches/dismissals',{lost_item_id:'L',found_item_id:'F1'})
    expect(localStorage.length).toBe(0)
  })
  it('leaves counts and status unchanged when a dismissal cannot be saved',async()=>{
    vi.mocked(api.put).mockRejectedValueOnce(new Error('failed'))
    const user=userEvent.setup();render(<Harness/>);
    await screen.findByRole('button',{name:'pending (2)'})
    await user.click(screen.getAllByRole('button',{name:'Not mine'})[0])
    await screen.findByText('Dismissal was not saved. Please retry.')
    expect(count()).toBe('2')
  })
  it('restores a live suggestion through the backend',async()=>{
    const user=userEvent.setup();render(<Harness/>);
    await screen.findByRole('button',{name:'pending (2)'})
    await user.click(screen.getAllByRole('button',{name:'Not mine'})[0])
    await screen.findByRole('button',{name:'Restore suggestion'})
    await user.click(screen.getByRole('button',{name:'Restore suggestion'}))
    await waitFor(()=>expect(count()).toBe('2'))
    expect(api.delete).toHaveBeenCalledWith('/matches/dismissals',{data:{lost_item_id:'L',found_item_id:'F1'}})
  })
  it('disables live dismissal until database setup is available',async()=>{
    vi.mocked(api.get).mockResolvedValueOnce({data:rows.map(r=>({...r,dismissalSyncAvailable:false}))})
    render(<Harness/>);
    await screen.findByText(/Saving dismissals is currently unavailable/)
    expect(screen.getAllByRole('button',{name:'Not mine'})[0]).toHaveProperty('disabled',true)
    expect(screen.getAllByRole('button',{name:'Create claim'})[0]).toHaveProperty('disabled',false)
  })
  it('does not reuse old browser-only dismissals as live database decisions',async()=>{
    localStorage.setItem('matching-review-v1:user-A:live:combined',JSON.stringify({'L:F1':'dismissed'}))
    render(<Harness/>);
    await screen.findByRole('button',{name:'pending (2)'})
    expect(count()).toBe('2')
  })
  it('keeps dataset dismissals browser-only',async()=>{
    const user=userEvent.setup();render(<Harness/>);
    await screen.findByRole('button',{name:'pending (2)'})
    await user.selectOptions(screen.getByLabelText('Reports'),'dataset')
    await screen.findAllByRole('button',{name:'Confirm demo match'})
    await user.click(screen.getAllByRole('button',{name:'Not mine'})[0])
    await waitFor(()=>expect(count()).toBe('1'))
    expect(api.put).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(1)
  })
})
