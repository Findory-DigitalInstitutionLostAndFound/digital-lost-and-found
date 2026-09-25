type NavbarProps = {
  navigate: (page: string) => void
  activePage?: 'browse' | 'login' | 'register'
}

export function Navbar({ navigate, activePage }: NavbarProps) {
  return (
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
          className={`mono text-xs uppercase tracking-[0.2em] transition-colors cursor-pointer ${
            activePage === 'browse'
              ? 'text-[#D93B2B] font-bold'
              : 'text-[#524B43] dark:text-[#ddd8d4] hover:text-[#0E0D0B] dark:hover:text-[#FFFFFF]'
          }`}
        >
          Browse
        </button>

        <button
          onClick={() => navigate('login')}
          className={`mono text-xs uppercase tracking-[0.2em] transition-colors cursor-pointer ${
            activePage === 'login'
              ? 'text-[#D93B2B] font-bold'
              : 'text-[#524B43] dark:text-[#ddd8d4] hover:text-[#0E0D0B] dark:hover:text-[#FFFFFF]'
          }`}
        >
          Sign in
        </button>

        <button
          onClick={() => navigate('register')}
          className={`mono text-xs uppercase tracking-[0.2em] transition-colors cursor-pointer ${
            activePage === 'register'
              ? 'text-[#D93B2B] font-bold'
              : 'text-[#524B43] dark:text-[#ddd8d4] hover:text-[#0E0D0B] dark:hover:text-[#FFFFFF]'
          }`}
        >
          Join
        </button>
      </nav>
    </header>
  )
}