import React, { useState } from 'react'
import { ArrowLeft, Search, Building2, ShieldAlert } from 'lucide-react'
import { Navbar } from '../components/ui/Navbar'

type GuestPageProps = {
  navigate: (page: string) => void
}

type GuestView = 'main' | 'found-instructions'

export function GuestPage({ navigate }: GuestPageProps) {
  const [currentView, setCurrentView] = useState<GuestView>('main')

  return (
    <div className="flex-1 min-h-screen bg-[#FAF6EC] text-[#0E0D0B] dark:bg-[#0E0D0B] dark:text-[#F0EAD6] transition-colors flex flex-col">
      <Navbar navigate={navigate} activePage="guest" />

      {/* Main Content Container */}
      <div className="flex-1 px-6 sm:px-12 py-12 max-w-5xl mx-auto w-full">
        {currentView === 'found-instructions' && (
          <div className="mb-8">
            <button
              onClick={() => setCurrentView('main')}
              className="flex items-center gap-1.5 mono text-xs text-[#524B43] dark:text-[#B8B0A4] hover:text-[#0E0D0B] dark:hover:text-[#F0EAD6] transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>CHOOSE ANOTHER OPTION</span>
            </button>
          </div>
        )}

        {currentView === 'main' ? (
          <>
            {/* Header Section */}
            <div className="mb-12">
              <div className="mono text-[10px] text-[#D93B2B] uppercase tracking-widest mb-2 font-bold">
                No Account Required
              </div>
              <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight" style={{ fontFamily: 'Fraunces, serif' }}>
                How can we help?
              </h1>
              <p className="text-sm sm:text-base text-[#524B43] dark:text-[#B8B0A4] max-w-2xl leading-relaxed">
                Guests can report a lost item and follow AI-suggested matches through a secure email link. Found items must be handed to University staff.
              </p>
            </div>

            {/* Two Column Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Lost Item */}
              <div 
                onClick={() => navigate('report-lost')}
                className="border border-[#C4BAA6] dark:border-[#2A2925] p-8 bg-[#FAF6EC] dark:bg-[#1A1916] hover:border-[#D93B2B] dark:hover:border-[#D93B2B] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="mono text-[20px] text-[#D93B2B] font-bold uppercase tracking-widest">
                      01 · I lost something
                    </span>
                    <Search size={22} className="text-[#D93B2B]" />
                  </div>
                  <h3 className="text-2xl font-black mb-3 text-[#0E0D0B] dark:text-[#F0EAD6]" style={{ fontFamily: 'Fraunces, serif' }}>
                    Create a guest report
                  </h3>
                  <p className="text-xs sm:text-sm text-[#524B43] dark:text-[#B8B0A4] leading-relaxed mb-8">
                    Tell us what went missing and where. We’ll email you a private link with relevant found items.
                  </p>
                </div>
                <div className="mono text-xs uppercase tracking-widest font-bold text-[#0E0D0B] dark:text-[#F0EAD6] group-hover:text-[#D93B2B] flex items-center gap-2">
                  <span>Start report</span>
                  <span>→</span>
                </div>
              </div>

              {/* Card 2: Found Item */}
              <div 
                onClick={() => setCurrentView('found-instructions')}
                className="border border-[#C4BAA6] dark:border-[#2A2925] p-8 bg-[#FAF6EC] dark:bg-[#1A1916] hover:border-[#06C167] dark:hover:border-[#06C167] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="mono text-[20px] text-[#06C167] font-bold uppercase tracking-widest">
                      02 · I found something
                    </span>
                    <Building2 size={22} className="text-[#06C167]" />
                  </div>
                  <h3 className="text-2xl font-black mb-3 text-[#0E0D0B] dark:text-[#F0EAD6]" style={{ fontFamily: 'Fraunces, serif' }}>
                    Hand it to the help desk
                  </h3>
                  <p className="text-xs sm:text-sm text-[#524B43] dark:text-[#B8B0A4] leading-relaxed mb-8">
                    Please don’t post the item publicly. University staff will secure it and add a verified found-item report.
                  </p>
                </div>
                <div className="mono text-xs uppercase tracking-widest font-bold text-[#0E0D0B] dark:text-[#F0EAD6] group-hover:text-[#06C167] flex items-center gap-2">
                  <span>View instructions</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Found Item Instructions Detailed View */}
            <div className="bg-[#06C167] text-[#0E0D0B] p-4 mb-8 font-mono text-xs uppercase font-bold tracking-wider">
              Found item · Guest instructions
            </div>

            <div className="mb-10">
              <div className="inline-block p-3 bg-[#06C167]/10 text-[#06C167] rounded mb-4">
                <Building2 size={28} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight" style={{ fontFamily: 'Fraunces, serif' }}>
                Please hand it to University’s help desk.
              </h1>
              <p className="text-sm sm:text-base text-[#524B43] dark:text-[#B8B0A4] max-w-2xl leading-relaxed">
                A staff member will record the item in Findory and keep it in a secure location. This protects both you and the owner and creates a verified chain of custody.
              </p>
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="border border-[#C4BAA6] dark:border-[#2A2925] p-6 bg-white dark:bg-[#1A1916]">
                <div className="mono text-xs text-[#06C167] font-bold mb-3">01</div>
                <p className="text-xs sm:text-sm text-[#0E0D0B] dark:text-[#F0EAD6] leading-relaxed">
                  Do not share photos or owner details online.
                </p>
              </div>

              <div className="border border-[#C4BAA6] dark:border-[#2A2925] p-6 bg-white dark:bg-[#1A1916]">
                <div className="mono text-xs text-[#06C167] font-bold mb-3">02</div>
                <p className="text-xs sm:text-sm text-[#0E0D0B] dark:text-[#F0EAD6] leading-relaxed">
                  Take the item to the nearest campus help desk.
                </p>
              </div>

              <div className="border border-[#C4BAA6] dark:border-[#2A2925] p-6 bg-white dark:bg-[#1A1916]">
                <div className="mono text-xs text-[#06C167] font-bold mb-3">03</div>
                <p className="text-xs sm:text-sm text-[#0E0D0B] dark:text-[#F0EAD6] leading-relaxed">
                  Tell staff where and when you found it.
                </p>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-[#D93B2B] mb-8">
              <ShieldAlert size={18} className="text-[#D93B2B] shrink-0 mt-0.5" />
              <p className="mono text-xs text-[#D93B2B] leading-relaxed font-medium">
                Never arrange a private handover or request money from someone claiming the item.
              </p>
            </div>

            {/* Return Action */}
            <button
              onClick={() => setCurrentView('main')}
              className="h-11 px-6 bg-[#D93B2B] text-[#FAF6EC] mono text-xs uppercase tracking-widest font-bold hover:bg-[#BF3323] transition-colors cursor-pointer"
            >
              Done, return home
            </button>
          </>
        )}
      </div>
    </div>
  )
}