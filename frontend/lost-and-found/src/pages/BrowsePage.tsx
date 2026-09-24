import React, { useState, useMemo } from 'react'
import { Search, X, ArrowRight, ArrowLeft } from 'lucide-react'
import { ItemCard } from '../components/ui/ItemCard'
import type { Item } from '../components/ui/ItemCard'
import { Button } from '../components/ui/Button'

const CATEGORIES = ['Electronics', 'Personal', 'Apparel', 'Books', 'Accessories']

const MOCK_ITEMS: Item[] = [
  {
    id: 1,
    type: 'lost',
    title: 'Black Leather Wallet',
    description: 'Black bifold wallet, worn on the corners. Contains transit cards and a library card.',
    tags: ['black', 'leather', 'small', 'bifold'],
    location: 'Main Library, 2nd Floor',
    date: '2026-09-15',
    category: 'Personal',
    status: 'matched',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    type: 'found',
    title: 'Leather Wallet Found Near Library',
    description: 'Found a dark leather wallet near the study tables on 2nd floor. No cash inside.',
    tags: ['black', 'leather', 'bifold'],
    location: 'Main Library',
    date: '2026-09-16',
    category: 'Personal',
    status: 'matched',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    type: 'lost',
    title: 'AirPods Pro (White)',
    description: 'White AirPods Pro in a white MagSafe case. Left them at a study carrel.',
    tags: ['white', 'small', 'electronics'],
    location: 'Science Building, Room 204',
    date: '2026-09-17',
    category: 'Electronics',
    status: 'active',
  },
  {
    id: 4,
    type: 'found',
    title: 'Hydroflask Water Bottle',
    description: 'Dark green 32oz Hydroflask. Found near the gym entrance.',
    tags: ['green', 'large', 'metal'],
    location: 'Athletics Center',
    date: '2026-09-18',
    category: 'Accessories',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 5,
    type: 'lost',
    title: 'Calculus Textbook (Stewarts)',
    description: "Stewart's Calculus 8th edition. Name written inside front cover in blue ink.",
    tags: ['book', 'textbook', 'calculus'],
    location: 'Math Department, 3rd Floor',
    date: '2026-09-14',
    category: 'Books',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 6,
    type: 'found',
    title: 'Set of Keys with Blue Keychain',
    description: 'Found 3 keys on a ring with a small blue rubber keychain shaped like a star.',
    tags: ['keys', 'blue', 'small'],
    location: 'Student Union, Cafeteria',
    date: '2026-09-18',
    category: 'Personal',
    status: 'active',
  },
]

type BrowsePageProps = {
  navigate: (page: string, itemId?: number) => void
}

export function BrowsePage({ navigate }: BrowsePageProps) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')

  const filtered = useMemo(() => {
    return MOCK_ITEMS.filter(item => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some(t => t.includes(q)) ||
        item.location.toLowerCase().includes(q)
      const matchesType = typeFilter === 'all' || item.type === typeFilter
      const matchesCategory = !categoryFilter || item.category === categoryFilter
      return matchesQuery && matchesType && matchesCategory
    })
  }, [query, typeFilter, categoryFilter])

  return (
    <div className="flex-1 min-h-screen bg-[#FAF6EC] text-[#0E0D0B] dark:bg-[#0E0D0B] dark:text-[#F0EAD6] transition-colors flex flex-col">
      {/* Header section with logo and navigation buttons */}
      <header className="flex items-center justify-between border-b border-[#C4BAA6] dark:border-[#2A2925] px-8 py-5 shrink-0 bg-[#FAF6EC] dark:bg-[#0E0D0B]">
        {/* Logo */}
        <button
          onClick={() => navigate('home')}
          className="text-2xl font-bold text-[#0E0D0B] dark:text-[#F0EAD6] cursor-pointer"
          style={{
            fontFamily: 'Fraunces, serif',
          }}
        >
          Findory
        </button>

        {/* Navigation */}
        <nav className="flex items-center gap-5">
          <button
            onClick={() => navigate('browse')}
            className="mono text-xs uppercase tracking-[0.2em] text-[#D93B2B] font-bold transition-colors cursor-pointer"
          >
            Browse
          </button>

          <button
            onClick={() => navigate('login')}
            className="mono text-xs uppercase tracking-[0.2em] text-[#524B43] dark:text-[#6B6560] transition-colors hover:text-[#0E0D0B] dark:hover:text-[#F0EAD6] cursor-pointer"
          >
            Sign in
          </button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('register')}
            className="mono text-xs"
          >
            Join
            <ArrowRight size={13} />
          </Button>
        </nav>
      </header>

      {/* Header section with Back Button and Page Title */}
      <div className="border-b border-[#C4BAA6] dark:border-[#2A2925] px-8 py-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('home')}
            className="flex items-center gap-1.5 mono text-xs text-[#524B43] dark:text-[#B8B0A4] hover:text-[#0E0D0B] dark:hover:text-[#F0EAD6] transition-colors border border-[#C4BAA6] dark:border-[#2A2925] px-2.5 py-1 bg-[#F2ECE1] dark:bg-[#1A1916] cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>BACK</span>
          </button>
          <div className="mono text-[10px] text-[#524B43] dark:text-[#B8B0A4] uppercase tracking-widest">
            Browse
          </div>
        </div>
        <h1 className="text-2xl font-black mb-1 text-[#0E0D0B] dark:text-[#F0EAD6]" style={{ fontFamily: 'Fraunces, serif' }}>
          All Items
        </h1>
        <p className="mono text-xs text-[#524B43] dark:text-[#B8B0A4]">{MOCK_ITEMS.length} items across campus</p>
      </div>

      {/* Controls */}
      <div className="border-b border-[#C4BAA6] dark:border-[#2A2925] px-8 py-4 flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-50">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#524B43] dark:text-[#B8B0A4]" />
          <input
            type="text"
            placeholder="Search title, tag, location…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-8 mono text-xs bg-[#FAF6EC] dark:bg-[#1A1916] border border-[#C4BAA6] dark:border-[#2A2925] text-[#0E0D0B] dark:text-[#F0EAD6] placeholder:text-[#524B43] dark:placeholder:text-[#8C8377] focus:outline-none focus:ring-2 focus:ring-[#D93B2B]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#524B43] dark:text-[#B8B0A4] hover:text-[#0E0D0B] dark:hover:text-[#F0EAD6] cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Type pills */}
        <div className="flex gap-1">
          {(['all', 'lost', 'found'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`mono text-[10px] uppercase tracking-widest px-3 py-1.5 border transition-all cursor-pointer ${
                typeFilter === t
                  ? t === 'lost'
                    ? 'bg-[#D93B2B] text-[#FAF6EC] border-[#D93B2B]'
                    : t === 'found'
                    ? 'bg-[#06C167] text-[#0E0D0B] border-[#06C167]'
                    : 'bg-[#0E0D0B] text-[#F0EAD6] dark:bg-[#F0EAD6] dark:text-[#0E0D0B] border-[#0E0D0B] dark:border-[#F0EAD6]'
                  : 'bg-transparent text-[#524B43] dark:text-[#B8B0A4] border-[#C4BAA6] dark:border-[#2A2925] hover:border-[#0E0D0B] dark:hover:border-[#F0EAD6] hover:text-[#0E0D0B] dark:hover:text-[#F0EAD6]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Category */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="h-9 px-3 mono text-[11px] bg-[#FAF6EC] dark:bg-[#1A1916] border border-[#C4BAA6] dark:border-[#2A2925] text-[#0E0D0B] dark:text-[#F0EAD6] focus:outline-none focus:ring-2 focus:ring-[#D93B2B] cursor-pointer"
        >
          <option value="">[ALL CATEGORIES]</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>
              [{c.toUpperCase()}]
            </option>
          ))}
        </select>
      </div>

      {/* Results count banner */}
      <div className="px-8 py-2 border-b border-[#C4BAA6] dark:border-[#2A2925] bg-[#F2ECE1] dark:bg-[#141310] flex items-center justify-between">
        <span className="mono text-[10px] text-[#524B43] dark:text-[#B8B0A4] uppercase tracking-widest">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
        {(query || typeFilter !== 'all' || categoryFilter) && (
          <button
            onClick={() => {
              setQuery('')
              setTypeFilter('all')
              setCategoryFilter('')
            }}
            className="mono text-[10px] text-[#D93B2B] uppercase tracking-widest hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table header for desktop */}
      <div
        className="hidden md:grid px-8 py-2 bg-[#0E0D0B] text-[#F0EAD6] gap-4 items-center"
        style={{ gridTemplateColumns: '80px 1fr 180px 180px 110px' }}
      >
        <span className="mono text-[10px] text-[#A8A095] uppercase tracking-widest">Type</span>
        <span className="mono text-[10px] text-[#A8A095] uppercase tracking-widest">Item & Description</span>
        <span className="mono text-[10px] text-[#A8A095] uppercase tracking-widest">Category / Tags</span>
        <span className="mono text-[10px] text-[#A8A095] uppercase tracking-widest">Location</span>
        <span className="mono text-[10px] text-[#A8A095] uppercase tracking-widest">Date</span>
      </div>

      {/* Ledger Results */}
      {filtered.length === 0 ? (
        <div className="px-8 py-20 text-center">
          <div className="mono text-5xl text-[#524B43]/40 dark:text-[#B8B0A4]/30 mb-4">∅</div>
          <p className="mono text-xs text-[#524B43] dark:text-[#B8B0A4] uppercase tracking-widest">No items match your search</p>
        </div>
      ) : (
        <div className="flex-1">
          {filtered.map(item => (
            <ItemCard key={item.id} item={item} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  )
}