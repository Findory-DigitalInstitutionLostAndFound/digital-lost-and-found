import { ShieldCheck } from 'lucide-react'
import { Button } from './Button'
import { claimService } from '../../services/claimService'

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
  const isLost = item.type === 'lost'
  const isMatched = item.status === 'matched'

  const handleActionClick = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevents card's row onClick from firing
    try {
      // Calling backend service to initialize the claim
      const result = await claimService.createClaim({ item_id: item.id.toString() })
      console.log('Claim created:', result)
      alert(result.message || 'Claim created successfully. Check the Claims tab.')
    } catch (error: any) {
        const message =
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to create claim. Please try again.'

        console.error('Failed to create claim:', error)
        alert(message)
    }
  }

  return (
    <div
      onClick={() => navigate('detail', item.id)}
      className="border-b border-[#0E0D0B]/10 px-8 py-4 bg-[#FAF6EC] hover:bg-[#0E0D0B]/5 transition-colors cursor-pointer flex flex-col md:grid gap-4 items-start md:items-center"
      style={{ gridTemplateColumns: '80px 1fr 140px 140px 90px 130px' }}
    >
      {/* 1. TYPE */}
      <div className="flex flex-col gap-1">
        <span
          className={`font-mono text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold w-fit ${
            item.type === 'lost'
              ? 'bg-[#D93B2B] text-[#FAF6EC]'
              : 'bg-[#06C167] text-[#0E0D0B]'
          }`}
        >
          {item.type}
        </span>
        {item.status === 'matched' && (
          <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#7C3AED] text-[#FAF6EC] uppercase tracking-wider w-fit">
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
            className="w-12 h-12 object-cover border border-[#0E0D0B]/10 shrink-0"
          />
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-sm text-[#0E0D0B] truncate" style={{ fontFamily: 'Fraunces, serif' }}>
            {item.title}
          </h3>
          <p className="text-xs text-[#0E0D0B]/70 line-clamp-1 mt-0.5">
            {item.description}
          </p>
        </div>
      </div>

      {/* 3. CATEGORY & TAGS */}
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] text-[#0E0D0B]/65 uppercase">
          [{item.category}]
        </span>
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="font-mono text-[9px] px-1.5 py-0.5 bg-[#0E0D0B] text-[#FAF6EC] uppercase"
            >
              #{tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="font-mono text-[9px] text-[#0E0D0B]/65 self-center">
              +{item.tags.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* 4. LOCATION */}
      <div className="font-mono text-xs text-[#0E0D0B]/65 truncate w-full">
        {item.location}
      </div>

      {/* 5. DATE */}
      <div className="font-mono text-xs text-[#0E0D0B]/65 whitespace-nowrap">
        {item.date}
      </div>

      {/* 6. ACTION BUTTON */}
      <div className="justify-self-end w-full md:w-auto" onClick={e => e.stopPropagation()}>
        {isMatched ? (
          <div className="font-mono text-[9px] uppercase font-bold px-2 py-1.5 border border-[#0E0D0B]/20 text-[#0E0D0B]/50 flex items-center gap-1 justify-center whitespace-nowrap bg-transparent">
            <ShieldCheck size={11} /> Claim Pending
          </div>
        ) : isLost ? (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleActionClick}
            className="w-full md:w-auto font-mono text-[9px] uppercase tracking-wider py-1 px-2.5 whitespace-nowrap border-[#0E0D0B]/20 text-[#0E0D0B] hover:bg-[#0E0D0B] hover:text-[#FAF6EC]"
          >
            <ShieldCheck size={11} /> I Found This
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleActionClick}
            className="w-full md:w-auto font-mono text-[9px] uppercase tracking-wider py-1 px-2.5 whitespace-nowrap border-[#0E0D0B]/20 text-[#0E0D0B] hover:bg-[#0E0D0B] hover:text-[#FAF6EC]"
          >
            <ShieldCheck size={11} /> Claim
          </Button>
        )}
      </div>
    </div>
  )
}