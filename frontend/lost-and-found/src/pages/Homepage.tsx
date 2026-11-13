import {
  ArrowRight,
  ShieldCheck,
  Search,
  ClipboardList,
} from 'lucide-react'

import { Button } from '../components/ui/Button'
import { Navbar } from '../components/ui/Navbar'


// Homepage component with navigation prop

type HomepageProps = {
  navigate: (page: string) => void
}

export function Homepage({ navigate }: HomepageProps) {
  
  return (
    <div className="min-h-screen bg-FAF6EC text-slate-900 dark:bg-white dark:text-slate-900]">
      {/* Navigation */}
      <Navbar navigate={navigate} />


      {/* HERO SECTION */}
      <section className="bg-[#0E0D0B] text-[#F0EAD6]">
        <div className="mx-auto max-w-7xl px-8 py-8 md:px-16 md:py-6">

          <div className="mx-auto max-w-7xl px-8 py-12 md:px-16 md:py-10">

            {/* Institution label */}

            <div className="mono mb-10 text-[11px] uppercase tracking-[0.2em] text-[#ddd8d4]">
              Educational Institution · Est. 2026
            </div>


            {/* Main heading */}

            <h1
              className="mb-8 text-6xl font-black leading-[0.9] md:text-7xl xl:text-[82px]"
              style={{
                fontFamily: 'Fraunces, serif',
              }}
            >
              Lost
              <br />

              something
              <br />

              <span className="text-[#D93B2B]">
                on campus?
              </span>
            </h1>


            {/* Description */}

            <p className="max-w-md text-base leading-8 text-[#ddd8d4]">
              A digital lost-and-found system for educational
              institutions. Report lost items, discover found
              belongings, and find potential matches in one place.
            </p>

          </div>


          {/* Hero buttons */}

          <div>

            <div className="flex flex-wrap gap-3">

              <Button
                size="lg"
                variant="primary"
                onClick={() => navigate('register')}
              >
                Report a lost item
                <ArrowRight size={16} />
              </Button>


              <Button
                size="lg"
                variant="sidebar"
                onClick={() => navigate('register')}
                className="border border-[#3A3832] text-[#F0EAD6] hover:bg-[#2A2925]"
              >
                I found something
                <ArrowRight size={16} />
              </Button>

            </div>


            {/* Small information */}

            <div className="mono mt-6 text-[10px] uppercase tracking-[0.18em] text-[#ddd8d4]">
              Institutional access · Secure reporting · Verified users
            </div>

          </div>

        </div>
      </section>  

      {/* PROCESS / STATS STRIP */}
      <section className="border-t border-black bg-white text-slate-900">
        <div className="grid grid-cols-2 md:grid-cols-4">
          
          {/* Step 01: Right & Bottom border on mobile | Right border only on desktop */}
          <div className="border-b border-r border-black p-8 md:border-b-0">
            <span className="mono text-3xl text-[#D93B2B]">01</span>
            <p
              className="mt-3 text-lg font-bold"
              style={{ fontFamily: 'Fraunces, serif' }}
            >
              Report
            </p>
            <p className="mt-2 text-sm text-[#000000]">
              Tell us what was lost or found.
            </p>
          </div>

          {/* Step 02: Bottom border on mobile | Right border only on desktop */}
          <div className="border-b border-black p-8 md:border-b-0 md:border-r">
            <span className="mono text-3xl text-[#D93B2B]">02</span>
            <p
              className="mt-3 text-lg font-bold"
              style={{ fontFamily: 'Fraunces, serif' }}
            >
              Match
            </p>
            <p className="mt-2 text-sm text-[#000000]">
              Compare reports using item details.
            </p>
          </div>

          {/* Step 03: Right border on mobile & desktop */}
          <div className="border-r border-black p-8">
            <span className="mono text-3xl text-[#D93B2B]">03</span>
            <p
              className="mt-3 text-lg font-bold"
              style={{ fontFamily: 'Fraunces, serif' }}
            >
              Verify
            </p>
            <p className="mt-2 text-sm text-[#000000]">
              Check ownership before returning.
            </p>
          </div>

          {/* Step 04 */}
          <div className="p-8">
            <span className="mono text-3xl text-[#D93B2B]">04</span>
            <p
              className="mt-3 text-lg font-bold"
              style={{ fontFamily: 'Fraunces, serif' }}
            >
              Recover
            </p>
            <p className="mt-2 text-sm text-[#000000]">
              Get your belongings back safely.
            </p>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-black bg-white text-slate-900">
        {/* Heading */}
        <div className="bg-[#0E0D0B] px-8 py-12 md:px-16">
          <div className="mono mb-4 text-[10px] uppercase tracking-[0.2em] text-[#ddd8d4]">
            How it works
          </div>
          <h2
            className="max-w-xl text-4xl font-bold md:text-5xl"
            style={{ fontFamily: 'Fraunces, serif' }}
          >
            <span className="text-[#D93B2B]">From missing</span>
            <br />
            <span className="text-[#f8f5f4]">to found.</span>
          </h2>
        </div>

        {/* Three steps grid */}
        <div className="grid border-t border-black bg-white divide-y divide-black md:grid-cols-3 md:divide-y-0 md:divide-x">
          
          {/* Step 01 */}
          <div className="p-8">
            <ClipboardList
              size={30}
              strokeWidth={1.5}
              className="mb-6 text-[#D93B2B]"
            />
            <div className="mono mb-4 text-sm text-[#000000]">01</div>
            <h3
              className="mb-3 text-xl font-bold"
              style={{ fontFamily: 'Fraunces, serif' }}
            >
              Report an item
            </h3>
            <p className="text-sm leading-7 text-[#000000]">
              Describe a lost or found item using useful information such as
              category, color, location, date and description.
            </p>
          </div>

          {/* Step 02 */}
          <div className="p-8">
            <Search
              size={30}
              strokeWidth={1.5}
              className="mb-6 text-[#D93B2B]"
            />
            <div className="mono mb-4 text-sm text-[#000000]">02</div>
            <h3
              className="mb-3 text-xl font-bold"
              style={{ fontFamily: 'Fraunces, serif' }}
            >
              Find a possible match
            </h3>
            <p className="text-sm leading-7 text-[#000000]">
              Lost and found reports can be compared using information such as
              item type, category, location and date.
            </p>
          </div>

          {/* Step 03 */}
          <div className="p-8">
            <ShieldCheck
              size={30}
              strokeWidth={1.5}
              className="mb-6 text-[#D93B2B]"
            />
            <div className="mono mb-4 text-sm text-[#000000]">03</div>
            <h3
              className="mb-3 text-xl font-bold"
              style={{ fontFamily: 'Fraunces, serif' }}
            >
              Verify and recover
            </h3>
            <p className="text-sm leading-7 text-[#000000]">
              Relevant item details can be checked before arranging a safe return
              through the institution.
            </p>
          </div>

        </div>
      </section>


      {/* PRIVACY / SECURITY CALLOUT */}

      <section className="flex flex-col justify-between gap-8 border-t border-[#2A2925] bg-[#D93B2B] px-8 py-12 md:flex-row md:items-center md:px-16">

        <div className="flex items-start gap-5">

          <ShieldCheck
            size={38}
            strokeWidth={1.5}
            className="shrink-0 text-white"
          />

          <div>

            <h2
              className="mb-2 text-2xl font-bold text-white"
              style={{
                fontFamily: 'Fraunces, serif',
              }}
            >
              Privacy matters
            </h2>

            <p className="max-w-xl text-sm leading-7 text-white/80">
              Lost-and-found reports should provide enough
              information to help identify an item without
              unnecessarily exposing sensitive personal details.
            </p>

          </div>

        </div>


        <Button
          size="lg"
          variant="outline"
          onClick={() => navigate('register')}
          className="shrink-0 border-[#FAF6EC] bg-[#FAF6EC] text-[#f9f8f8] hover:bg-white"
        >
          Get started
          <ArrowRight size={16} />
        </Button>

      </section>


      {/* FOOTER */}

      <footer className="bg-[#0E0D0B] flex flex-col justify-between gap-4 border-t border-[#2A2925] px-8 py-6 md:flex-row md:items-center">

        <span className="mono text-[10px] uppercase tracking-widest text-[#ddd8d4]">
          © 2026 Findory · Educational Institution
        </span>

        <div className="flex gap-6">

          <button
            className="mono text-[10px] uppercase tracking-widest text-[#ddd8d4] transition-colors hover:text-[#6B6560]"
          >
            Privacy
          </button>

          <button
            className="mono text-[10px] uppercase tracking-widest text-[#ddd8d4] transition-colors hover:text-[#6B6560]"
          >
            Terms
          </button>

          <button
            className="mono text-[10px] uppercase tracking-widest text-[#ddd8d4] transition-colors hover:text-[#6B6560]"
          >
            Support
          </button>

        </div>

      </footer>

    </div>
  )
}

