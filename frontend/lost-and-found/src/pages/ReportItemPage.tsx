import React, { useState, useRef } from 'react'
import { ArrowLeft, X, Camera } from 'lucide-react'
import { Navbar } from '../components/ui/Navbar'

const CATEGORIES = ['Accessories', 'Electronics', 'Documents', 'Clothing', 'Keys', 'Bags', 'Other']
const TAG_SUGGESTIONS = ['black', 'brown', 'blue', 'red', 'white', 'small', 'large', 'leather', 'metal', 'plastic', 'keys', 'wallet', 'phone', 'laptop', 'student-id']
const PRIVACY_PATTERNS = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/, label: 'SSN' },
  { pattern: /\b(?:\d[ -]*?){13,16}\b/, label: 'Credit Card Number' },
]

interface Props { 
  mode: 'lost' | 'found'; 
  navigate: (page: string) => void
  isGuest?: boolean // Prop to indicate if the user is a guest
 }

export function ReportItemPage({ mode, navigate, isGuest = false }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    description: '',
    category: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [privacyWarning, setPrivacyWarning] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2>(1)

  const checkPrivacy = (text: string): string | null => {
    for (const { pattern, label } of PRIVACY_PATTERNS) {
      if (pattern.test(text)) return label
    }
    return null
  }

  const handleDescriptionChange = (val: string) => {
    setForm(f => ({ ...f, description: val }))
    const warning = checkPrivacy(val)
    setPrivacyWarning(warning ? `Possible ${warning} detected — remove personal ID info before submitting.` : null)
  }

  const addTag = (tag: string) => {
    const clean = tag.toLowerCase().trim().replace(/\s+/g, '-')
    if (clean && !tags.includes(clean) && tags.length < 10) setTags(prev => [...prev, clean])
    setTagInput('')
  }

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag))

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (isGuest) {
      if (!form.name.trim()) e.name = 'Name is required'
      if (!form.email.trim()) e.email = 'Email is required'
      if (!form.phone.trim()) e.phone = 'Phone is required'
    }
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.category) e.category = 'Category is required'
    if (!form.location.trim()) e.location = 'Location is required'
    if (tags.length === 0) e.tags = 'Add at least one tag'
    return e
  }

  const handleNext = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setStep(2)
  }

  const handleSubmit = () => {
    if (privacyWarning) return
    alert(`Successfully reported ${mode} item: ${form.title}`)
    navigate(isGuest ? 'guest' : 'dashboard')
  }

  return (
    <div className="min-h-screen bg-[#FAF6EC] text-[#0E0D0B] flex flex-col">
      <Navbar navigate={navigate} activePage="guest" />

      <div className="max-w-2xl mx-auto px-8 py-8 w-full flex-1">
      {/* Back */}
      <div className="mb-6">
        <button
          onClick={() => navigate(isGuest ? 'guest' : 'dashboard')}
          className="flex items-center gap-1.5 mono text-xs text-[#282623] dark:text-[#272624] hover:text-[#0E0D0B] dark:hover:text-[#3f3f3d] transition-colors cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>{isGuest ? 'CHOOSE ANOTHER OPTION' : 'BACK'}</span>
        </button>
      </div>

      {/* Page title */}
      <div className="border-b border-[#0E0D0B]/10 pb-6 mb-6">
        <div className="font-mono text-[15px] text-[#0E0D0B]/65 uppercase tracking-widest mb-1">
          {isGuest ? 'Guest Report' : 'Report'}
        </div>
        <h1 className="text-3xl font-black text-[#0E0D0B]" style={{ fontFamily: 'Fraunces, serif' }}>
          {mode === 'lost' ? 'Lost Item' : 'Found Item'}
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-0 mb-8 border border-[#0E0D0B]/20">
        {[1, 2].map(s => (
          <div key={s} className={`flex-1 px-4 py-3 flex items-center gap-3 border-r last:border-r-0 border-[#0E0D0B]/20 ${step === s ? 'bg-[#0E0D0B]' : 'bg-[#FAF6EC]'}`}>
            <span className={`font-mono text-[10px] font-bold ${step === s ? 'text-[#F0EAD6]' : 'text-[#0E0D0B]/65'}`}>
              {String(s).padStart(2, '0')}
            </span>
            <span className={`font-mono text-[10px] uppercase tracking-widest ${step === s ? 'text-[#F0EAD6]' : 'text-[#0E0D0B]/65'}`}>
              {s === 1 ? 'Item details' : 'Tags & photo'}
            </span>
          </div>
        ))}
      </div>

      {/* Security notices */}
      <div className="flex flex-col gap-3 mb-8">
        <div className="border-l-4 px-4 py-4" style={{ borderColor: '#D93B2B', background: '#D93B2B10' }}>
          <div className="font-mono text-[10px] uppercase tracking-widest mb-1.5 font-bold" style={{ color: '#D93B2B' }}>
            {mode === 'lost' ? 'Fraud protection notice' : 'Handover security warning'}
          </div>
          <p className="text-xs text-[#0E0D0B]/80 leading-relaxed">
            {mode === 'lost'
              ? 'Once reported, bad actors may attempt to claim your item using fake accounts. Findory uses institutional email verification — but never release an item to a stranger directly. All handovers go through campus security with identity verification.'
              : 'Do NOT hand over this item to anyone directly. A known fraud pattern: scammers register fake accounts to collect high-value items before the real owner can.'}
          </p>
        </div>
        {/* Guest extra banner if needed */}
        {isGuest && (
          <div className="border-l-4 border-[#06C167] px-4 py-4 bg-[#06C167]/10">
            <div className="font-mono text-[10px] uppercase tracking-widest mb-1.5 font-bold text-[#06C167]">
              Safe Handover Process
            </div>
            <p className="text-xs text-[#0E0D0B]/80 leading-relaxed">
              After a match is confirmed, campus security contacts both parties via institutional email. The claimant must verify ownership with details only the true owner would know before pickup is arranged.
            </p>
          </div>
        )}
      </div>

      

      {/* Step 1 */}
      {step === 1 && (
        <div className="border border-[#0E0D0B]/20 bg-[#FAF6EC] flex flex-col gap-5 p-6">
          {/* Guest Contact Section */}
          {isGuest && (
            <div className="border-b border-[#0E0D0B]/20 pb-5 mb-2 flex flex-col gap-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#0E0D0B]/6ish">Your Contact Details</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest block mb-1.5">Full Name</label>
                  <input
                    placeholder="Jane Doe"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full h-11 px-3 font-mono text-xs bg-background border border-[#0E0D0B]/20 text-[#0E0D0B]"
                  />
                  {errors.name && <p className="font-mono text-[10px] text-[#D93B2B] mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest block mb-1.5">Email for Match Link</label>
                  <input
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full h-11 px-3 font-mono text-xs bg-background border border-[#0E0D0B]/20 text-[#0E0D0B]"
                  />
                  {errors.email && <p className="font-mono text-[10px] text-[#D93B2B] mt-1">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest block mb-1.5">Phone (Optional)</label>
                <input
                  placeholder="+358 40 123 4567"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full h-11 px-3 font-mono text-xs bg-background border border-[#0E0D0B]/20 text-[#0E0D0B]"
                />
                <p className="font-mono text-[10px] text-[#0E0D0B]/50 mt-1">Only used by University staff if they need to verify the report.</p>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-widest">Item title</label>
            <input
              placeholder={mode === 'lost' ? 'e.g., Black Leather Wallet' : 'e.g., Found: Blue Water Bottle'}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full h-11 px-3 font-mono text-xs bg-background border border-[#0E0D0B]/20 text-[#0E0D0B] focus:outline-none"
            />
            {errors.title && <p className="font-mono text-[10px] text-[#D93B2B]">{errors.title}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-widest">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full h-11 px-3 font-mono text-xs bg-background border border-[#0E0D0B]/20 text-[#0E0D0B] focus:outline-none">
              <option value="">[SELECT CATEGORY]</option>
              {CATEGORIES.map(c => <option key={c} value={c}>[{c.toUpperCase()}]</option>)}
            </select>
            {errors.category && <p className="font-mono text-[10px] text-[#D93B2B]">{errors.category}</p>}
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest block mb-1.5">Description</label>
            <textarea
              placeholder={mode === 'lost' ? 'Color, brand, distinguishing marks…' : 'Describe what you found and its condition…'}
              value={form.description}
              onChange={e => handleDescriptionChange(e.target.value)}
              rows={4}
              className="w-full p-3 font-mono text-xs bg-background border border-[#0E0D0B]/20 text-[#0E0D0B] focus:outline-none"
            />
            {privacyWarning && (
              <div className="mt-2 border-l-4 border-[#D93B2B] px-3 py-2 bg-[#D93B2B]/5">
                <p className="font-mono text-[10px] text-[#D93B2B]">{privacyWarning}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest block mb-1.5">Location</label>
              <input placeholder="e.g., Main Library, 2nd Floor"
                value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full h-11 px-3 font-mono text-xs bg-background border border-[#0E0D0B]/20 text-[#0E0D0B]" />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest block mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full h-11 px-3 font-mono text-xs bg-background border border-[#0E0D0B]/20 text-[#0E0D0B]" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handleNext} disabled={!!privacyWarning}
              className="bg-[#0E0D0B] text-[#F0EAD6] px-4 py-2 font-mono text-xs uppercase tracking-wider hover:opacity-90">
              Continue to tags →
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="border border-[#0E0D0B]/20 bg-[#FAF6EC] flex flex-col gap-6 p-6">
          <div>
            <label className="font-mono text-[10px] text-[#0E0D0B] uppercase tracking-widest block mb-1.5">
              Tags <span className="text-[#0E0D0B]/65 normal-case">(used for matching — more = better)</span>
            </label>
            <div className={`flex flex-wrap gap-1.5 min-h-11 p-2.5 border bg-background mb-2 ${errors.tags ? 'border-[#D93B2B]' : 'border-[#0E0D0B]/20'}`}>
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-[#0E0D0B] text-[#F0EAD6] font-mono text-[10px] px-2 py-0.5">
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:opacity-60"><X size={9} /></button>
                </span>
              ))}
              <input
                className="flex-1 min-w-20 font-mono text-xs text-[#0E0D0B] placeholder:text-[#0E0D0B]/40 bg-transparent focus:outline-none"
                placeholder={tags.length === 0 ? 'Type a tag, press Enter…' : '+ more…'}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
                  if (e.key === 'Backspace' && !tagInput && tags.length) removeTag(tags[tags.length - 1])
                }}
              />
            </div>
            {errors.tags && <p className="font-mono text-[10px] text-[#D93B2B] mb-2">{errors.tags}</p>}
            <div className="flex flex-wrap gap-1.5">
              <span className="font-mono text-[10px] text-[#0E0D0B]/65 mr-1">Suggestions:</span>
              {TAG_SUGGESTIONS.filter(s => !tags.includes(s)).slice(0, 10).map(s => (
                <button key={s} onClick={() => addTag(s)}
                  className="font-mono text-[10px] px-2 py-0.5 border border-[#0E0D0B]/20 text-[#0E0D0B]/65 hover:border-[#0E0D0B] hover:text-[#0E0D0B] transition-colors">
                  +{s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-mono text-[10px] text-[#0E0D0B] uppercase tracking-widest block mb-1.5">
              Photo <span className="text-[#0E0D0B]/65 normal-case">(optional)</span>
            </label>
            {imagePreview ? (
              <div className="relative border border-[#0E0D0B]/20 overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                <button onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="absolute top-2 right-2 p-1.5 bg-[#0E0D0B]/80 text-white hover:bg-[#0E0D0B]">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="border border-dashed border-[#0E0D0B]/30 p-8 text-center cursor-pointer bg-background"
                onClick={() => fileInputRef.current?.click()}>
                <Camera size={20} className="mx-auto text-[#0E0D0B]/65 mb-2" />
                <p className="font-mono text-[11px] text-[#0E0D0B]/65 uppercase tracking-widest">Click to upload</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(1)} className="border border-[#0E0D0B]/20 px-4 py-2 font-mono text-xs uppercase">← Back</button>
            <button
              onClick={handleSubmit}
              disabled={!!privacyWarning}
              className={`flex-1 py-2 font-mono text-xs uppercase tracking-wider text-white ${mode === 'lost' ? 'bg-[#D93B2B]' : 'bg-[#06C167] text-[#0E0D0B] font-bold'}`}
            >
              {isGuest ? 'Submit & email my match link' : `Submit ${mode === 'lost' ? 'Lost' : 'Found'} Report`}
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}