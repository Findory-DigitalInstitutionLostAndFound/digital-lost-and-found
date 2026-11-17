import { useState } from 'react'
import type { ItemMatch, MatchesController } from '../hooks/useMatches'
import { CheckCircle2, XCircle, MapPin, Calendar, Info } from 'lucide-react'

export function MatchesPage({ controller }: { controller: MatchesController }) {
  const { matches, source, setSource, mode, setMode, loading, error, busyId, actionError } = controller
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'dismissed'>('all')
  const filtered = matches.filter(m => filter === 'all' || m.status === filter)
  const counts = {
    all: matches.length,
    pending: matches.filter(m => m.status === 'pending').length,
    confirmed: matches.filter(m => m.status === 'confirmed').length,
    dismissed: matches.filter(m => m.status === 'dismissed').length,
  }
  return (
    <div className="flex-1 bg-[#FAF6EC] text-[#0E0D0B] min-h-screen">
      {/* Header */}
      <div className="border-b border-[#0E0D0B]/10 px-8 py-6">
        <div className="font-mono text-[10px] text-[#0E0D0B]/65 uppercase tracking-widest mb-1">Matches</div>
        <h1 className="text-2xl font-black text-[#0E0D0B]" style={{ fontFamily: 'Fraunces, serif' }}>
          {mode === 'live' ? 'Your Match Suggestions' : 'Dataset Matches'}
        </h1>
      </div>

      {/* How matching works */}
      <div className="border-b border-[#0E0D0B]/10 px-8 py-4 bg-[#0E0D0B] flex items-start gap-4 text-[#FAF6EC]">
        <Info size={14} className="text-[#6B6560] shrink-0 mt-0.5" />
        <p className="font-mono text-[11px] text-[#6B6560] leading-relaxed">
          Up to three candidates per lost report are shown at scores of 70/100 or higher. Robust matching compares description meaning and checks specific conflicting details. Combined mode fuses text and image ranks when both photos are usable. Missing images fall back to text. Images cannot override text eligibility or detected conflicts.
          {mode === 'live' ? 'Live suggestions use your open lost reports and visible found reports. Create a claim to begin ownership verification. Dismissals are saved in this browser.' : 'Dataset decisions are saved in this browser only. They do not create claims or notify anyone.'}
        </p>
      </div>

      <div className="px-8 py-3 border-b border-[#0E0D0B]/10 flex flex-wrap items-center gap-4">
        <label className="font-mono text-xs">
          Reports{' '}
          <select value={mode} disabled={!!busyId} onChange={e => { setMode(e.target.value as 'live' | 'dataset'); setFilter('all') }} className="ml-2 border border-[#0E0D0B]/20 bg-transparent p-2">
            <option value="live">My Supabase reports</option>
            <option value="dataset">Thesis dataset demo</option>
          </select>
        </label>
        <label className="font-mono text-xs">
          Matching method{' '}
          <select value={source} disabled={!!busyId} onChange={e => { setSource(e.target.value as 'combined' | 'robust' | 'baseline'); setFilter('all') }} className="ml-2 border border-[#0E0D0B]/20 bg-transparent p-2">
            <option value="combined">Combined text + image ranking</option>
            <option value="robust">Semantic + detail checks</option>
            <option value="baseline">Original text matcher</option>
          </select>
        </label>
        <button onClick={controller.refresh} disabled={loading || !!busyId} className="font-mono text-xs underline">Refresh matches</button>
        <button onClick={controller.resetReviews} disabled={loading || !!busyId} className="font-mono text-xs underline">Reset browser reviews</button>
      </div>
      {actionError && <p role="alert" className="px-8 py-4 text-red-700">{actionError}</p>}

      {/* Filter tabs */}
      <div className="border-b border-[#0E0D0B]/10 px-8 flex gap-0 overflow-x-auto">
        {(['all', 'pending', 'confirmed', 'dismissed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-3.5 font-mono text-[10px] uppercase tracking-widest font-medium whitespace-nowrap border-b-2 transition-colors ${
              filter === f ? 'text-[#0E0D0B] border-[#D93B2B]' : 'text-[#0E0D0B]/65 border-transparent hover:text-[#0E0D0B]'
            }`}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Match cards */}
      {loading || error ? (
        <p role={error ? 'alert' : 'status'} className="px-8 py-10 text-sm">{error || 'Loading matches…'}</p>
      ) : filtered.length === 0 ? (
        <div className="px-8 py-20 text-center">
          <div className="font-mono text-5xl text-[#0E0D0B]/20 mb-4">∅</div>
          <p className="font-mono text-xs text-[#0E0D0B]/65 uppercase tracking-widest">
            {filter !== 'all' ? 'No matches in this filter.' : mode === 'live' ? 'No eligible suggestions. Check your open lost reports, or refresh after new found reports arrive.' : 'No dataset candidates meet the current threshold.'}
          </p>
        </div>
      ) : (
        <div>
          {filtered.map(match => (
            <MatchBlock
              key={match.id}
              match={match}
              onConfirm={() => { void controller.confirm(match.id) }}
              onDismiss={() => controller.dismiss(match.id)}
              live={mode === 'live'}
              busy={!!busyId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MatchBlock({ match, onConfirm, onDismiss, live, busy }: {
  match: ItemMatch; live: boolean; busy: boolean; onConfirm: () => void; onDismiss: () => void
}) {
  const score = match.score
  const scoreColor = score >= 85 ? '#06C167' : score >= 70 ? '#F59E0B' : '#C4BAA6'
  const isDismissed = match.status === 'dismissed'

  return (
    <div className={`border-b border-[#0E0D0B]/10 ${isDismissed ? 'opacity-50' : ''}`}>
      {/* Match header bar */}
      <div className="flex items-center justify-between px-8 py-3 bg-[#FAF6EC] border-b border-[#0E0D0B]/10">
        <div className="flex items-center gap-4">
          <div className="font-mono text-[10px] text-[#0E0D0B]/65 uppercase tracking-widest">Text eligibility score</div>
          <div className="text-3xl font-black leading-none" style={{ fontFamily: 'Fraunces, serif', color: scoreColor }}>
            {score}/100
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-wrap gap-1">
            {match.commonTags.map((tag: string) => (
              <span key={tag} className="bg-[#0E0D0B] text-[#F0EAD6] font-mono text-[10px] px-1.5 py-0.5">#{tag}</span>
            ))}
          </div>
          {match.rankingScore != null && <span className="font-mono text-[10px]">{match.evidence === 'text+image' ? 'Text + image ranking' : 'Text-only fallback'} · index {match.rankingScore.toFixed(2)}</span>}
          {match.imageSimilarity != null && (
            <span className="font-mono text-[10px]">Image cosine: {match.imageSimilarity.toFixed(3)}</span>
          )}
          <span className="font-mono text-[10px] text-[#0E0D0B]/65">{match.createdAt}</span>
        </div>
      </div>

      {/* Two-column item comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#0E0D0B]/10">
        {[match.lostItem, match.foundItem].map((item, i: number) => (
          <div key={i} className="p-8">
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-[10px] font-mono px-2 py-0.5 uppercase font-bold"
                style={{ background: item.type === 'lost' ? '#D93B2B' : '#06C167', color: item.type === 'lost' ? '#FAF6EC' : '#0E0D0B' }}
              >
                {item.type}
              </span>

            </div>

            {item.imageUrl && (
              <div className="h-40 bg-[#0E0D0B]/5 border border-[#0E0D0B]/10 mb-4 overflow-hidden">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
              </div>
            )}

            <h3 className="font-bold text-[#0E0D0B] mb-1 text-lg" style={{ fontFamily: 'Fraunces, serif' }}>{item.title}</h3>
            <p className="text-xs text-[#0E0D0B]/70 mb-4 leading-relaxed">{item.description}</p>

            <div className="flex flex-col gap-1.5 font-mono text-[11px] text-[#0E0D0B]/65 mb-4">
              <span className="flex items-center gap-1.5"><MapPin size={10} />{item.location}</span>
              <span className="flex items-center gap-1.5"><Calendar size={10} />{item.date}</span>
            </div>

            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag: string) => (
                <span
                  key={tag}
                  className={`font-mono text-[10px] px-1.5 py-0.5 border uppercase ${
                    match.commonTags.includes(tag)
                      ? 'bg-[#0E0D0B] text-[#F0EAD6] border-[#0E0D0B]'
                      : 'bg-transparent border-[#0E0D0B]/20 text-[#0E0D0B]/65'
                  }`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      {match.status === 'pending' && (
        <div className="px-8 py-4 border-t border-[#0E0D0B]/10 flex items-center justify-between gap-4 flex-wrap bg-[#FAF6EC]">
          <p className="text-xs text-[#0E0D0B]/65 leading-relaxed max-w-md">
            {live ? 'Create a claim to begin verification. A suggestion does not prove ownership.' : 'Review this dataset candidate. Your choice is saved in this browser.'}
          </p>
          <div className="flex gap-2">
            <button disabled={busy} onClick={onDismiss} className="border border-[#0E0D0B]/20 px-3 py-1.5 text-xs font-mono uppercase flex items-center gap-1 hover:bg-[#0E0D0B]/5">
              <XCircle size={13} /> Not mine
            </button>
            <button disabled={busy} onClick={onConfirm} className="bg-[#06C167] text-[#0E0D0B] font-bold px-3 py-1.5 text-xs font-mono uppercase flex items-center gap-1 hover:bg-[#06C167]/90">
              <CheckCircle2 size={13} /> {busy ? 'Please wait…' : live ? 'Create claim' : 'Confirm demo match'}
            </button>
          </div>
        </div>
      )}

      {match.status === 'confirmed' && (
        <div className="px-8 py-4 border-t border-[#06C167] bg-[#06C167]/10 flex items-center gap-3">
          <CheckCircle2 size={16} className="text-[#06C167] shrink-0" />
          <p className="font-mono text-[11px] text-[#0E0D0B]">
            {live ? 'Claim submitted. Continue verification in Claims; ownership is not yet approved.' : 'Dataset candidate marked confirmed in this browser.'}
          </p>
        </div>
      )}
    </div>
  )
}
