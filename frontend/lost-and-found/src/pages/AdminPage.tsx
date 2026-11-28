import { useState } from 'react'
import { Package, Hand } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { QrScanner } from './QrScanner'  
import { adminService } from '../services/adminService'   
import { handOverService } from '../services/handOverService'    

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
            const response = await handOverService.verifyQr(payload)
            setResult(response.message || 'Handover confirmed. Item returned to owner.')
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
      <div className="grid grid-cols-2 border-b border-[#0E0D0B]/10">
        <TabButton
          active={tab === 'dropoff'}
          onClick={() => { setTab('dropoff'); setResult(null); setError(null); setScanInput(''); setShowScanner(false) }}
        >
          <Package size={14} /> Drop-off
        </TabButton>
        <TabButton
          active={tab === 'handover'}
          onClick={() => { setTab('handover'); setResult(null); setError(null); setScanInput(''); setShowScanner(false) }}
        >
          <Hand size={14} /> Handover
        </TabButton>
      </div>

      {/* Content */}
      <div className="px-6 md:px-8 py-8">
        <div className="border border-[#0E0D0B]/15 bg-white">
          {/* Title strip */}
          <div className="border-b border-[#0E0D0B]/10 px-5 py-4 md:px-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#0E0D0B]/50 mb-1">
              {tab === 'dropoff' ? 'Inventory' : 'Return'}
            </p>
            <h2 className="text-lg font-bold" style={{ fontFamily: 'Fraunces, serif' }}>
              {tab === 'dropoff' ? 'Confirm item drop-off' : 'Confirm owner handover'}
            </h2>
            <p className="mt-1 text-sm text-[#0E0D0B]/70 leading-relaxed max-w-2xl">
              {tab === 'dropoff'
                ? 'Scan the QR on the item when it is handed in at a campus service point.'
                : 'Scan the claimant’s handover QR to complete the return. Code is valid for a short time only.'}
            </p>
          </div>

          {/* Actions */}
          <div className="px-5 py-5 md:px-6 space-y-4">
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
              <div className="overflow-hidden border border-[#0E0D0B]/15 bg-[#0E0D0B]/5">
                <QrScanner
                  onScan={handleScan}
                  onError={(msg) => {
                    setError(msg)
                    setShowScanner(false)
                  }}
                />
              </div>
            )}

            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#0E0D0B]/50 block mb-1.5">
                Or paste QR value
              </label>
              <input
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                placeholder="findory:..."
                className="w-full h-11 px-3 text-sm border border-[#0E0D0B]/20 bg-[#FAF6EC] focus:outline-none focus:ring-2 focus:ring-[#0E0D0B]"
              />
            </div>

            <Button
              variant="found"
              disabled={loading || !scanInput.trim()}
              onClick={() => handleScan(scanInput.trim())}
              className="w-full sm:w-auto"
            >
              {loading ? 'Processing…' : tab === 'dropoff' ? 'Confirm Drop-off' : 'Confirm Handover'}
            </Button>

            {result && (
              <div className="flex items-start gap-2 p-4 border border-[#06C167] bg-[#06C167]/10 text-sm text-[#0E0D0B]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#06C167] shrink-0 pt-0.5">
                  OK
                </span>
                <p>{result}</p>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 p-4 border border-[#D93B2B] bg-[#D93B2B]/10 text-sm text-[#D93B2B]">
                <span className="font-mono text-[10px] uppercase tracking-widest shrink-0 pt-0.5">
                  Error
                </span>
                <p>{error}</p>
              </div>
            )}
          </div>
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
      className={`flex items-center justify-center gap-2 w-full py-4 font-mono text-[10px] md:text-xs uppercase tracking-widest border-b-2 transition-colors ${
        active
          ? 'text-[#0E0D0B] border-[#06C167] bg-white font-bold'
          : 'text-[#0E0D0B]/55 border-transparent bg-transparent hover:text-[#0E0D0B] hover:bg-[#0E0D0B]/5'
      }`}
    >
      {children}
    </button>
  )
}