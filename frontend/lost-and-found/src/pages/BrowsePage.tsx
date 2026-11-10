import React, { useState, useMemo, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { ItemCard } from '../components/ui/ItemCard'
import type { Item } from '../components/ui/ItemCard'
import { api } from '../services/api'

const CATEGORIES = ['Accessories', 'Electronics', 'Documents', 'Clothing', 'Keys', 'Bags', 'Jewellery', 'ID', 'Other']

type BrowsePageProps = {
  navigate: (page: string, itemId?: number) => void
}

export function BrowsePage({ navigate }: BrowsePageProps) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchBackendItems() {
      try {
        const response = await api.get('/items')
        const formattedItems = response.data.items.map((i: any) => ({
          id: i.id,
          type: i.item_type,
          title: i.title,
          description: i.public_description,
          tags: i.ai_tags || [],
          location: i.location_name,
          date: i.event_timestamp ? i.event_timestamp.split('T')[0] : '2026-09-18',
          category: i.category || 'Other',
          status: 'active',
          imageUrl: i.blurred_image_url
        }))
        setItems(formattedItems)
      } catch (err) {
        console.error('Failed to load items from backend:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchBackendItems()
  }, [])

  const filtered = useMemo(() => {
    return items.filter(item => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q)) ||
        item.location.toLowerCase().includes(q)
      const matchesType = typeFilter === 'all' || item.type === typeFilter
      const matchesCategory =
        !categoryFilter ||
        item.category.toLowerCase() === categoryFilter.toLowerCase()
      return matchesQuery && matchesType && matchesCategory
    })
  }, [items, query, typeFilter, categoryFilter])

  return (
    <div className="flex-1 min-h-screen bg-[#FAF6EC] text-[#0E0D0B] flex flex-col">
      {/* Header section */}
      <div className="border-b border-[#0E0D0B]/10 px-8 py-6">
        <div className="font-mono text-[10px] text-[#0E0D0B]/65 uppercase tracking-widest mb-1">
          Browse
        </div>
        <h1 className="text-2xl font-black mb-1 text-[#0E0D0B]" style={{ fontFamily: 'Fraunces, serif' }}>
          All Items
        </h1>
        <p className="font-mono text-xs text-[#0E0D0B]/65">{items.length} items across campus</p>
      </div>

      {/* Controls Bar */}
      <div className="border-b border-[#0E0D0B]/10 px-8 py-4 flex flex-wrap gap-4 items-center bg-[#FAF6EC]">
        {/* Search */}
        <div className="relative flex-1 min-w-50">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0E0D0B]/50" />
          <input
            type="text"
            placeholder="Search title, tag, location…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-8 font-mono text-xs bg-white border border-[#0E0D0B]/20 text-[#0E0D0B] placeholder:text-[#0E0D0B]/40 focus:outline-none focus:ring-2 focus:ring-[#D93B2B]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0E0D0B]/50 hover:text-[#0E0D0B] cursor-pointer"
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
              className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border transition-all cursor-pointer ${
                typeFilter === t
                  ? t === 'lost'
                    ? 'bg-[#D93B2B] text-[#FAF6EC] border-[#D93B2B]'
                    : t === 'found'
                    ? 'bg-[#06C167] text-[#0E0D0B] border-[#06C167]'
                    : 'bg-[#0E0D0B] text-[#FAF6EC] border-[#0E0D0B]'
                  : 'bg-transparent text-[#0E0D0B]/70 border-[#0E0D0B]/20 hover:border-[#0E0D0B] hover:text-[#0E0D0B]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Category Dropdown */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="h-9 px-3 font-mono text-[11px] bg-white border border-[#0E0D0B]/20 text-[#0E0D0B] focus:outline-none focus:ring-2 focus:ring-[#D93B2B] cursor-pointer"
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
      <div className="px-8 py-2 border-b border-[#0E0D0B]/10 bg-[#0E0D0B]/5 flex items-center justify-between">
        <span className="font-mono text-[10px] text-[#0E0D0B]/65 uppercase tracking-widest">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
        {(query || typeFilter !== 'all' || categoryFilter) && (
          <button
            onClick={() => {
              setQuery('')
              setTypeFilter('all')
              setCategoryFilter('')
            }}
            className="font-mono text-[10px] text-[#D93B2B] uppercase tracking-widest hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Desktop table header */}
      <div
        className="hidden md:grid px-8 py-2.5 bg-[#0E0D0B] text-[#FAF6EC] gap-4 items-center border-b border-[#0E0D0B]/10"
        style={{ gridTemplateColumns: '80px 1fr 140px 140px 90px 130px' }}
      >
        <span className="font-mono text-[10px] text-[#FAF6EC]/70 uppercase tracking-widest">Type</span>
        <span className="font-mono text-[10px] text-[#FAF6EC]/70 uppercase tracking-widest">Item & Description</span>
        <span className="font-mono text-[10px] text-[#FAF6EC]/70 uppercase tracking-widest">Category / Tags</span>
        <span className="font-mono text-[10px] text-[#FAF6EC]/70 uppercase tracking-widest">Location</span>
        <span className="font-mono text-[10px] text-[#FAF6EC]/70 uppercase tracking-widest">Date</span>
        <span className="font-mono text-[10px] text-[#FAF6EC]/70 uppercase tracking-widest text-right">Action</span>
      </div>

      {/* Ledger Results */}
      {isLoading ? (
        <div className="px-8 py-20 text-center">
          <div className="font-mono text-xs text-[#0E0D0B]/65 uppercase tracking-widest animate-pulse">
            Loading secure items from database...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-8 py-20 text-center">
          <div className="font-mono text-5xl text-[#0E0D0B]/20 mb-4">∅</div>
          <p className="font-mono text-xs text-[#0E0D0B]/65 uppercase tracking-widest">
            No items match your search
          </p>
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