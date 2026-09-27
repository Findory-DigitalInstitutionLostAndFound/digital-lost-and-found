import { Bell, PlusCircle } from 'lucide-react'

interface HeaderProps {
  currentPage: string
  navigate: (page: string) => void
  pendingMatchesCount?: number
  title?: string
}

export function Header({
  currentPage,
  navigate,
  pendingMatchesCount = 1,
  title,
}: HeaderProps) {
  const formattedTitle = title || currentPage.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <header className="sticky top-0 lg:top-0 z-30 bg-[#d2cec1]/95 backdrop-blur-md border-b border-[#0E0D0B]/10 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Page Title & Breadcrumb context */}
      <div className="min-w-0">
        <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-[#0E0D0B]/60 truncate mb-0.5">
          Portal / <span className="text-[#0E0D0B] font-bold">{currentPage}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0E0D0B] truncate" style={{ fontFamily: 'Fraunces, serif' }}>
          {formattedTitle}
        </h1>
      </div>

      {/* Quick Action Buttons & Status */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => navigate('report-lost')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D93B2B] text-white font-mono text-xs uppercase font-bold tracking-wider hover:opacity-90 transition-opacity"
          >
            <PlusCircle size={14} /> Report Lost
          </button>
          <button
            onClick={() => navigate('report-found')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06C167] text-[#0E0D0B] font-mono text-xs uppercase font-bold tracking-wider hover:opacity-90 transition-opacity"
          >
            <PlusCircle size={14} /> Report Found
          </button>
        </div>

        <div className="h-6 w-px bg-[#0E0D0B]/10 mx-1 hidden sm:block" />

        <button
          onClick={() => navigate('matches')}
          className="relative p-2.5 bg-[#0E0D0B]/5 hover:bg-[#0E0D0B]/10 text-[#0E0D0B] transition-colors rounded-none flex items-center gap-2"
          title="View Matches"
        >
          <Bell size={16} />
          {pendingMatchesCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-[#D93B2B] text-white font-mono text-[9px] font-bold">
              {pendingMatchesCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}