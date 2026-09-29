import React, { useState } from 'react'
import { Menu, X, LogOut, Zap } from 'lucide-react'

const MOCK_NAV = [
  { label: 'Dashboard', page: 'dashboard', stamp: '01' },
  { label: 'Browse', page: 'browse', stamp: '02' },
  { label: 'Matches', page: 'matches', stamp: '03' },
  { label: 'Report Lost', page: 'report-lost' },
  { label: 'Report Found', page: 'report-found' },
]

interface SidebarProps {
  currentPage: string
  navigate: (page: string) => void
  user?: { name: string; email: string } | null
  logout?: () => void
  pendingMatchesCount?: number
}

export function Sidebar({
  currentPage = 'dashboard',
  navigate,
  user = { name: 'Alex Rivera', email: 'alex.rivera@university.edu' },
  logout = () => alert('Signed out successfully'),
  pendingMatchesCount = 1,
}: SidebarProps) {
  const [open, setOpen] = useState(false)

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#0E0D0B] text-white">
      {/* Web name Header - Shows on Desktop sidebar & Mobile Drawer */}
      <div className="px-6 py-5 border-b border-[#2A2925] shrink-0 flex items-center justify-between">
        <button 
          onClick={() => { navigate('dashboard'); setOpen(false) }} 
          className="text-lg font-bold text-left hover:opacity-90 transition-opacity"
          style={{ fontFamily: 'Fraunces, serif' }}
        >
          Findory
        </button>
      </div>

      {/* User Section */}
      {user && (
        <div className="px-6 py-4 border-b border-[#2A2925] shrink-0 bg-[#0E0D0B]">
          <div className="font-mono text-[10px] text-[#6B6560] uppercase tracking-widest mb-1">Signed in as</div>
          <div className="text-[#F0EAD6] text-sm font-semibold truncate">{user.name}</div>
          <div className="font-mono text-[11px] text-[#6B6560] truncate">{user.email}</div>
        </div>
      )}

      {/* Nav Section */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {MOCK_NAV.map((item, index) => {
          const isActive = currentPage === item.page
          const isSeparated = !item.stamp

          return (
            <React.Fragment key={item.page}>
              {isSeparated && index > 0 && (
                <div className="h-px bg-[#2A2925] my-2 mx-3" />
              )}
              <button
                onClick={() => { navigate(item.page); setOpen(false) }}
                className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors text-left w-full shrink-0 ${
                  isActive
                    ? 'bg-[#F0EAD6] text-[#0E0D0B]'
                    : 'text-[#B8B2A8] hover:text-[#F0EAD6] hover:bg-[#1E1D1A]'
                }`}
              >
                {item.stamp && (
                  <span className={`font-mono text-[10px] w-5 shrink-0 ${isActive ? 'text-[#6B6250]' : 'text-[#3A3832]'}`}>
                    {item.stamp}
                  </span>
                )}
                <span>{item.label}</span>

                {item.page === 'matches' && pendingMatchesCount > 0 && (
                  <span className="ml-auto flex items-center gap-1 bg-[#D93B2B] text-white font-mono text-[10px] px-1.5 py-0.5">
                    <Zap size={9} />{pendingMatchesCount}
                  </span>
                )}
                {item.page === 'report-lost' && (
                  <span className="ml-auto font-mono text-[10px] text-[#D93B2B]">LOST</span>
                )}
                {item.page === 'report-found' && (
                  <span className="ml-auto font-mono text-[10px] text-[#06C167]">FOUND</span>
                )}
              </button>
            </React.Fragment>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-6 py-4 border-t border-[#2A2925] shrink-0 bg-[#0E0D0B]">
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-[#6B6560] hover:text-[#D93B2B] transition-colors w-full"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-[#0E0D0B] h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile trigger bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0E0D0B] border-b border-[#2A2925] flex items-center justify-between px-4 h-14">
        <button 
          onClick={() => { navigate('dashboard'); setOpen(false) }} 
          className="text-[#F0EAD6] font-bold text-lg" 
          style={{ fontFamily: 'Fraunces, serif' }}
        >
          Findory
        </button>
        <div className="flex items-center gap-3">
          {pendingMatchesCount > 0 && (
            <span className="flex items-center gap-1 bg-[#D93B2B] text-white font-mono text-[10px] px-1.5 py-0.5">
              <Zap size={9} />{pendingMatchesCount}
            </span>
          )}
          <button onClick={() => setOpen(!open)} className="text-[#F0EAD6] p-1">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-14 bottom-0 w-72 bg-[#0E0D0B] flex flex-col z-50 shadow-2xl border-r border-[#2A2925]">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  )
}