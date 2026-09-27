import React, { useState } from 'react'
import { CheckCircle2, XCircle, MapPin, Calendar, Info } from 'lucide-react'

export function MatchesPage() {
  const [matches, setMatches] = useState(MOCK_MATCHES)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'dismissed'>('all')

  const userId = 'user-1'
  const myMatches = matches.filter(
    m => m.lostItem.userId === userId || m.foundItem.userId === userId
  )
  const filtered = myMatches.filter(m => filter === 'all' || m.status === filter)
  const counts = {
    all: myMatches.length,
    pending: myMatches.filter(m => m.status === 'pending').length,
    confirmed: myMatches.filter(m => m.status === 'confirmed').length,
    dismissed: myMatches.filter(m => m.status === 'dismissed').length,
  }

  const confirmMatch = (id: string) => {
    setMatches(prev => prev.map(m => m.id === id ? { ...m, status: 'confirmed' } : m))
  }

  const dismissMatch = (id: string) => {
    setMatches(prev => prev.map(m => m.id === id ? { ...m, status: 'dismissed' } : m))
  }

  return (
    <div className="flex-1 bg-[#FAF6EC] text-[#0E0D0B] min-h-screen">
      {/* Header */}
      <div className="border-b border-[#0E0D0B]/10 px-8 py-6">
        <div className="font-mono text-[10px] text-[#0E0D0B]/65 uppercase tracking-widest mb-1">Matches</div>
        <h1 className="text-2xl font-black text-[#0E0D0B]" style={{ fontFamily: 'Fraunces, serif' }}>
          Item Matches
        </h1>
      </div>

      {/* How matching works */}
      <div className="border-b border-[#0E0D0B]/10 px-8 py-4 bg-[#0E0D0B] flex items-start gap-4 text-[#FAF6EC]">
        <Info size={14} className="text-[#6B6560] shrink-0 mt-0.5" />
        <p className="font-mono text-[11px] text-[#6B6560] leading-relaxed">
          Scores compare shared tags, category, location, and date proximity. Matches above 70% are surfaced.
          Confirm a match to trigger the campus security–mediated handover process.
        </p>
      </div>

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
      {filtered.length === 0 ? (
        <div className="px-8 py-20 text-center">
          <div className="font-mono text-5xl text-[#0E0D0B]/20 mb-4">∅</div>
          <p className="font-mono text-xs text-[#0E0D0B]/65 uppercase tracking-widest">
            {filter === 'pending' ? 'No pending matches. Add more tags to your reports.' : 'Nothing to show.'}
          </p>
        </div>
      ) : (
        <div>
          {filtered.map(match => (
            <MatchBlock
              key={match.id}
              match={match}
              userId={userId}
              onConfirm={() => confirmMatch(match.id)}
              onDismiss={() => dismissMatch(match.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MatchBlock({ match, userId, onConfirm, onDismiss }: {
  match: any; userId: string; onConfirm: () => void; onDismiss: () => void
}) {
  const score = match.score
  const scoreColor = score >= 85 ? '#06C167' : score >= 70 ? '#F59E0B' : '#C4BAA6'
  const isDismissed = match.status === 'dismissed'

  return (
    <div className={`border-b border-[#0E0D0B]/10 ${isDismissed ? 'opacity-50' : ''}`}>
      {/* Match header bar */}
      <div className="flex items-center justify-between px-8 py-3 bg-[#FAF6EC] border-b border-[#0E0D0B]/10">
        <div className="flex items-center gap-4">
          <div className="font-mono text-[10px] text-[#0E0D0B]/65 uppercase tracking-widest">Match confidence</div>
          <div className="text-3xl font-black leading-none" style={{ fontFamily: 'Fraunces, serif', color: scoreColor }}>
            {score}%
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-wrap gap-1">
            {match.commonTags.map((tag: string) => (
              <span key={tag} className="bg-[#0E0D0B] text-[#F0EAD6] font-mono text-[10px] px-1.5 py-0.5">#{tag}</span>
            ))}
          </div>
          <span className="font-mono text-[10px] text-[#0E0D0B]/65">{match.createdAt}</span>
        </div>
      </div>

      {/* Two-column item comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#0E0D0B]/10">
        {[match.lostItem, match.foundItem].map((item: any, i: number) => (
          <div key={i} className="p-8">
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-[10px] font-mono px-2 py-0.5 uppercase font-bold"
                style={{ background: item.type === 'lost' ? '#D93B2B' : '#06C167', color: item.type === 'lost' ? '#FAF6EC' : '#0E0D0B' }}
              >
                {item.type}
              </span>
              {item.userId === userId && (
                <span className="font-mono text-[10px] px-2 py-0.5 bg-[#0E0D0B] text-[#F0EAD6] font-bold">YOURS</span>
              )}
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
            Confirming triggers identity verification and campus security will arrange handover. Never meet directly.
          </p>
          <div className="flex gap-2">
            <button onClick={onDismiss} className="border border-[#0E0D0B]/20 px-3 py-1.5 text-xs font-mono uppercase flex items-center gap-1 hover:bg-[#0E0D0B]/5">
              <XCircle size={13} /> Not mine
            </button>
            <button onClick={onConfirm} className="bg-[#06C167] text-[#0E0D0B] font-bold px-3 py-1.5 text-xs font-mono uppercase flex items-center gap-1 hover:bg-[#06C167]/90">
              <CheckCircle2 size={13} /> This is mine
            </button>
          </div>
        </div>
      )}

      {match.status === 'confirmed' && (
        <div className="px-8 py-4 border-t border-[#06C167] bg-[#06C167]/10 flex items-center gap-3">
          <CheckCircle2 size={16} className="text-[#06C167] shrink-0" />
          <p className="font-mono text-[11px] text-[#0E0D0B]">
            Match confirmed · Campus security notified · Check your institutional email for next steps
          </p>
        </div>
      )}
    </div>
  )
}

const MOCK_MATCHES = [
  {
    id: 'match-1',
    score: 87,
    status: 'pending',
    commonTags: ['white', 'small', 'apple', 'earbuds'],
    createdAt: '2026-09-18',
    lostItem: {
      id: 'item-2',
      userId: 'user-1',
      type: 'lost',
      title: 'AirPods Pro (White)',
      description: 'White AirPods Pro in a white MagSafe case. Left them at a study carrel.',
      location: 'Science Building, Room 204',
      date: '2026-09-17',
      tags: ['white', 'small', 'electronics', 'apple', 'earbuds'],
      imageUrl: '',
    },
    foundItem: {
      id: 'item-found-1',
      userId: 'user-2',
      type: 'found',
      title: 'White Apple Earbuds in Case',
      description: 'White AirPods in charging case, found in the science wing.',
      location: 'Science Building',
      date: '2026-09-18',
      tags: ['white', 'small', 'apple', 'earbuds', 'electronics'],
      imageUrl: '',
    },
  },
  {
    id: 'match-2',
    score: 94,
    status: 'confirmed',
    commonTags: ['black', 'leather', 'bifold'],
    createdAt: '2026-09-16',
    lostItem: {
      id: 'item-1',
      userId: 'user-1',
      type: 'lost',
      title: 'Black Leather Wallet',
      description: 'Black bifold wallet, worn on the corners. Contains transit cards and a library card.',
      location: 'Main Library, 2nd Floor',
      date: '2026-09-15',
      tags: ['black', 'leather', 'small', 'bifold'],
      imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&auto=format&fit=crop&q=80',
    },
    foundItem: {
      id: 'item-found-2',
      userId: 'user-3',
      type: 'found',
      title: 'Leather Wallet Found Near Library',
      description: 'Found a dark leather wallet near the study tables on 2nd floor. No cash inside.',
      location: 'Main Library',
      date: '2026-09-16',
      tags: ['black', 'leather', 'bifold', 'worn'],
      imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&auto=format&fit=crop&q=80',
    },
  },
]