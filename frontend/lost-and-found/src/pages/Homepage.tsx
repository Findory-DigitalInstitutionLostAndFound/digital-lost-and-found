import {
  ArrowRight,
  ShieldCheck,
  Search,
  ClipboardList,
} from 'lucide-react'

import { Button } from '../components/ui/Button'

const MOCK_ITEMS = [
  {
    id: 1,
    type: 'lost',
    title: 'Black Leather Wallet',
    tags: ['black', 'leather', 'small'],
    location: 'Main Library, 2nd floor',
  },
  {
    id: 2,
    type: 'found',
    title: 'Leather Wallet Found Near Library',
    tags: ['black', 'leather', 'bifold'],
    location: 'Main Library',
  },
  {
    id: 3,
    type: 'lost',
    title: 'AirPods Pro (White)',
    tags: ['white', 'small', 'electronics'],
    location: 'Science Building, Room 204',
  },
  {
    id: 4,
    type: 'found',
    title: 'Blue Water Bottle',
    tags: ['blue', 'metal', 'bottle'],
    location: 'Student Cafeteria',
  },
  {
    id: 5,
    type: 'lost',
    title: 'Black Backpack',
    tags: ['black', 'backpack', 'large'],
    location: 'Engineering Building',
  },
]

// Homepage component with navigation prop

type HomepageProps = {
  navigate: (page: string) => void
}

export function Homepage({ navigate }: HomepageProps) {
  const previewItems = MOCK_ITEMS.slice(0, 3)

  return (
    <div className="min-h-screen bg-[#0E0D0B] text-[#F0EAD6]">
      {/* Header section with logo and navigation buttons*/}
      <header className="flex items-center justify-between border-b border-[#2A2925] px-8 py-5">

        {/* Logo */}

        <button
          onClick={() => navigate('home')}
          className="text-2xl font-bold"
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
            className="mono text-xs uppercase tracking-[0.2em] text-[#6B6560] transition-colors hover:text-[#F0EAD6]"
          >
            Browse
          </button>

          <button
            onClick={() => navigate('login')}
            className="mono text-xs uppercase tracking-[0.2em] text-[#6B6560] transition-colors hover:text-[#F0EAD6]"
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


      {/* HERO SECTION */}

      <section className="grid min-h-170 lg:grid-cols-2">

        {/* HERO LEFT*/}

        <div className="flex flex-col justify-between border-r border-[#2A2925] p-8 md:p-12 lg:p-16">

          <div>

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

          <div className="mt-12">

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


        {/* RECENTLY REPORTED RIGHT SIDE */}

        <div className="flex flex-col bg-[#F0EAD6] p-8 text-[#0E0D0B] md:p-12 lg:p-16">

          {/* Section heading */}

          <div className="mb-8 flex items-baseline justify-between">

            <h2
              className="text-base font-bold"
              style={{
                fontFamily: 'Fraunces, serif',
              }}
            >
              Recently reported
            </h2>

            <span className="mono text-[10px] uppercase tracking-widest text-[#6B6250]">
              {MOCK_ITEMS.length} active items
            </span>

          </div>


          {/*LEDGER*/}

          <div className="border border-[#C4BAA6]">

            {/* Ledger header */}

            <div className="flex items-center gap-4 bg-[#0E0D0B] px-4 py-3">

              <span className="mono w-16 shrink-0 text-[10px] uppercase tracking-widest text-[#ddd8d4]">
                Type
              </span>

              <span className="mono flex-1 text-[10px] uppercase tracking-widest text-[#ddd8d4]">
                Item
              </span>

              <span className="mono hidden w-36 text-[10px] uppercase tracking-widest text-[#ddd8d4] sm:block">
                Location
              </span>

            </div>


            {/* Ledger items */}

            {previewItems.map((item) => {

              const isLost = item.type === 'lost'

              return (
                <div
                  key={item.id}
                  onClick={() => navigate('login')}
                  className="flex cursor-pointer items-center gap-4 border-b border-[#C4BAA6] px-4 py-5 transition-colors last:border-0 hover:bg-[#E4DCCA]"
                  style={{
                    borderLeft: `4px solid ${
                      isLost ? '#D93B2B' : '#06C167'
                    }`,
                  }}
                >

                  {/* LOST / FOUND badge */}

                  <span
                    className="stamp shrink-0 px-2 py-1 text-[10px]"
                    style={{
                      backgroundColor: isLost
                        ? '#D93B2B'
                        : '#06C167',

                      color: isLost
                        ? '#FAF6EC'
                        : '#0E0D0B',
                    }}
                  >
                    {item.type.toUpperCase()}
                  </span>


                  {/* Item information */}

                  <div className="min-w-0 flex-1">

                    <p
                      className="truncate text-sm font-semibold"
                      style={{
                        fontFamily: 'Fraunces, serif',
                      }}
                    >
                      {item.title}
                    </p>

                    <p className="mono mt-1 truncate text-[10px] text-[#6B6250]">
                      {item.tags.slice(0, 3).join(' · ')}
                    </p>

                  </div>


                  {/* Location */}

                  <p className="mono hidden w-36 truncate text-[10px] text-[#6B6250] sm:block">
                    {item.location}
                  </p>

                </div>
              )
            })}

          </div>


          {/* View all */}

          <button
            onClick={() => navigate('browse')}
            className="mono mt-5 flex items-center gap-2 self-end text-[10px] uppercase tracking-widest text-[#6B6250] transition-colors hover:text-[#D93B2B]"
          >
            View all items
            <ArrowRight size={12} />
          </button>

        </div>

      </section>


      {/* PROCESS / STATS STRIP*/}

      <section className="grid grid-cols-2 border-t border-[#2A2925] md:grid-cols-4">

        <div className="border-r border-[#2A2925] px-8 py-8">

          <span className="mono text-3xl text-[#D93B2B]">
            01
          </span>

          <p
            className="mt-3 text-lg font-bold"
            style={{
              fontFamily: 'Fraunces, serif',
            }}
          >
            Report
          </p>

          <p className="mt-2 text-sm text-[#ddd8d4]">
            Tell us what was lost or found.
          </p>

        </div>


        <div className="border-r border-[#2A2925] px-8 py-8">

          <span className="mono text-3xl text-[#D93B2B]">
            02
          </span>

          <p
            className="mt-3 text-lg font-bold"
            style={{
              fontFamily: 'Fraunces, serif',
            }}
          >
            Match
          </p>

          <p className="mt-2 text-sm text-[#ddd8d4]">
            Compare reports using item details.
          </p>

        </div>


        <div className="border-r border-[#2A2925] px-8 py-8">

          <span className="mono text-3xl text-[#D93B2B]">
            03
          </span>

          <p
            className="mt-3 text-lg font-bold"
            style={{
              fontFamily: 'Fraunces, serif',
            }}
          >
            Verify
          </p>

          <p className="mt-2 text-sm text-[#ddd8d4]">
            Check ownership before returning.
          </p>

        </div>


        <div className="px-8 py-8">

          <span className="mono text-3xl text-[#D93B2B]">
            04
          </span>

          <p
            className="mt-3 text-lg font-bold"
            style={{
              fontFamily: 'Fraunces, serif',
            }}
          >
            Recover
          </p>

          <p className="mt-2 text-sm text-[#ddd8d4]">
            Get your belongings back safely.
          </p>

        </div>

      </section>


      {/* HOW IT WORKS */}

      <section className="border-t border-[#2A2925]">

        {/* Heading */}

        <div className="px-8 py-12 md:px-16">

          <div className="mono mb-4 text-[10px] uppercase tracking-[0.2em] text-[#ddd8d4]">
            How it works
          </div>

          <h2
            className="max-w-xl text-4xl font-bold md:text-5xl"
            style={{
              fontFamily: 'Fraunces, serif',
            }}
          >
            From missing
            <br />
            to found.
          </h2>

        </div>


        {/* Three steps */}

        <div className="grid border-t border-[#2A2925] md:grid-cols-3">

          {/* Step 01 */}

          <div className="border-r border-[#2A2925] p-8">

            <ClipboardList
              size={30}
              strokeWidth={1.5}
              className="mb-6 text-[#D93B2B]"
            />

            <div className="mono mb-4 text-sm text-[#ddd8d4]">
              01
            </div>

            <h3
              className="mb-3 text-xl font-bold"
              style={{
                fontFamily: 'Fraunces, serif',
              }}
            >
              Report an item
            </h3>

            <p className="text-sm leading-7 text-[#ddd8d4]">
              Describe a lost or found item using useful
              information such as category, color, location,
              date and description.
            </p>

          </div>


          {/* Step 02 */}

          <div className="border-r border-[#2A2925] p-8">

            <Search
              size={30}
              strokeWidth={1.5}
              className="mb-6 text-[#D93B2B]"
            />

            <div className="mono mb-4 text-sm text-[#ddd8d4]">
              02
            </div>

            <h3
              className="mb-3 text-xl font-bold"
              style={{
                fontFamily: 'Fraunces, serif',
              }}
            >
              Find a possible match
            </h3>

            <p className="text-sm leading-7 text-[#ddd8d4]">
              Lost and found reports can be compared using
              information such as item type, category,
              location and date.
            </p>

          </div>


          {/* Step 03 */}

          <div className="p-8">

            <ShieldCheck
              size={30}
              strokeWidth={1.5}
              className="mb-6 text-[#D93B2B]"
            />

            <div className="mono mb-4 text-sm text-[#ddd8d4]">
              03
            </div>

            <h3
              className="mb-3 text-xl font-bold"
              style={{
                fontFamily: 'Fraunces, serif',
              }}
            >
              Verify and recover
            </h3>

            <p className="text-sm leading-7 text-[#ddd8d4]">
              Relevant item details can be checked before
              arranging a safe return through the institution.
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

      <footer className="flex flex-col justify-between gap-4 border-t border-[#2A2925] px-8 py-6 md:flex-row md:items-center">

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

