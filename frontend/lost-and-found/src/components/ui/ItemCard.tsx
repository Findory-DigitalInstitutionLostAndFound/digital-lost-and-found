export type Item = {
  id: number
  type: 'lost' | 'found'
  title: string
  description: string
  tags: string[]
  location: string
  date: string
  category: string
  status: 'active' | 'matched' | 'resolved'
  imageUrl?: string
}

type ItemCardProps = {
  item: Item
  navigate: (page: string, itemId?: number) => void
}

export function ItemCard({ item, navigate }: ItemCardProps) {
  return (
    <div
      onClick={() => navigate('detail', item.id)}
      className="border-b border-[#C4BAA6] dark:border-[#2A2925] px-8 py-4 hover:bg-[#F2ECE1] dark:hover:bg-[#1A1916] transition-colors cursor-pointer flex flex-col md:grid gap-4 items-start md:items-center"
      style={{ gridTemplateColumns: '80px 1fr 180px 180px 110px' }}
    >
      {/* 1. TYPE */}
      <div className="flex flex-col gap-1">
        <span
          className={`mono text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold w-fit ${
            item.type === 'lost'
              ? 'bg-[#D93B2B] text-[#FAF6EC]'
              : 'bg-[#06C167] text-[#0E0D0B]'
          }`}
        >
          {item.type}
        </span>
        {item.status === 'matched' && (
          <span className="mono text-[9px] px-1.5 py-0.5 bg-[#7C3AED] text-[#FAF6EC] uppercase tracking-wider w-fit">
            Match
          </span>
        )}
      </div>

      {/* 2. ITEM & DESCRIPTION */}
      <div className="flex items-start gap-3 min-w-0">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-12 h-12 object-cover border border-[#C4BAA6] dark:border-[#2A2925] shrink-0"
          />
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-sm text-[#0E0D0B] dark:text-[#F0EAD6] truncate" style={{ fontFamily: 'Fraunces, serif' }}>
            {item.title}
          </h3>
          <p className="text-xs text-[#524B43] dark:text-[#B8B0A4] line-clamp-1 mt-0.5">
            {item.description}
          </p>
        </div>
      </div>

      {/* 3. CATEGORY & TAGS */}
      <div className="flex flex-col gap-1.5">
        <span className="mono text-[10px] text-[#524B43] dark:text-[#B8B0A4] uppercase">
          [{item.category}]
        </span>
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="mono text-[9px] px-1.5 py-0.5 bg-[#F2ECE1] dark:bg-[#2A2925] border border-[#C4BAA6] dark:border-[#3A3832] uppercase text-[#0E0D0B] dark:text-[#F0EAD6]"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="mono text-[9px] text-[#524B43] dark:text-[#B8B0A4] self-center">
              +{item.tags.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* 4. LOCATION */}
      <div className="mono text-xs text-[#524B43] dark:text-[#B8B0A4] truncate w-full">
        {item.location}
      </div>

      {/* 5. DATE */}
      <div className="mono text-xs text-[#524B43] dark:text-[#B8B0A4] whitespace-nowrap">
        {item.date}
      </div>
    </div>
  )
}