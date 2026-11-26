import { useState } from 'react'
import { Package, Hand } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { QrScanner } from './QrScanner'  
import { adminService } from '../services/adminService'       

type AdminTab = 'dropoff' | 'handover'

interface AdminPageProps {
  navigate: (page: string) => void
  user: { name: string; email: string; uni_role?: string } | null
}

export function AdminPage({ user }: AdminPageProps) {
  const [tab, setTab] = useState<AdminTab>('dropoff')
  const [scanInput, setScanInput] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleScan = async (payload: string) => {
    setScanInput(payload)
    setShowScanner(false)
    setError(null)
    setResult(null)
    setLoading(true)

    try {
        if (tab === 'dropoff') {
            const response = await adminService.confirmDropOff({ qr_token: payload })
            setResult(response.message || 'Drop-off confirmed. Item added to inventory.')
        } else{
            //later
        }

        
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Scan failed. Check the code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 min-h-screen bg-[#FAF6EC] text-[#0E0D0B]">
      {/* Header */}
      <div className="border-b border-[#0E0D0B]/10 px-6 md:px-8 py-6">
        <div className="font-mono text-[10px] text-[#0E0D0B]/60 uppercase tracking-widest mb-1">
          Staff tools
        </div>
        <h1 className="text-3xl font-black mb-1" style={{ fontFamily: 'Fraunces, serif' }}>
          Admin
        </h1>
        <p className="font-mono text-xs text-[#0E0D0B]/70">
          Scan QR codes for drop-off and owner handover
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#0E0D0B]/10 px-6 md:px-8 flex">
        <TabButton
          active={tab === 'dropoff'}
          onClick={() => { setTab('dropoff'); setResult(null); setError(null); setScanInput('') }}
        >
          <Package size={13} /> Drop-off
        </TabButton>
        <TabButton
          active={tab === 'handover'}
          onClick={() => { setTab('handover'); setResult(null); setError(null); setScanInput('') }}
        >
          <Hand size={13} /> Handover
        </TabButton>
      </div>

      {/* Content */}
      <div className="px-6 md:px-8 py-8 max-w-xl">
        <div className="border border-[#0E0D0B]/20 bg-white p-5 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#0E0D0B]/60">
            {tab === 'dropoff' ? 'Confirm item drop-off' : 'Confirm owner handover'}
          </p>

          <p className="text-sm text-[#0E0D0B]/80">
            {tab === 'dropoff'
              ? 'Scan the QR on the item when it is handed in at a campus service point.'
              : 'Scan the claimant’s handover QR to complete the return.'}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => setShowScanner(s => !s)}
              disabled={loading}
            >
              {showScanner ? 'Hide camera' : 'Open camera scanner'}
            </Button>
          </div>

          {showScanner && (
            <QrScanner
              onScan={handleScan}
              onError={(msg) => {
                setError(msg)
                setShowScanner(false)
              }}
            />
          )}

          <div>
            <label className="font-mono text-[10px] uppercase block mb-1">
              Or paste QR value
            </label>
            <input
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              placeholder="findory:..."
              className="w-full h-10 px-3 text-sm border border-[#0E0D0B]/20 bg-white"
            />
          </div>

          <Button
            variant="found"
            disabled={loading || !scanInput.trim()}
            onClick={() => handleScan(scanInput.trim())}
          >
            {loading ? 'Processing…' : tab === 'dropoff' ? 'Confirm Drop-off' : 'Confirm Handover'}
          </Button>

          {result && (
            <div className="p-3 bg-[#06C167]/15 border border-[#06C167] text-sm text-[#0E0D0B]">
              {result}
            </div>
          )}
          {error && (
            <div className="p-3 bg-[#D93B2B]/10 border border-[#D93B2B] text-sm text-[#D93B2B]">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 md:px-5 py-3.5 font-mono text-[10px] md:text-xs uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
        active
          ? 'text-[#0E0D0B] border-[#06C167] bg-[#FAF6EC] font-bold'
          : 'text-[#0E0D0B]/60 border-transparent hover:text-[#0E0D0B]'
      }`}
    >
      {children}
    </button>
  )
}