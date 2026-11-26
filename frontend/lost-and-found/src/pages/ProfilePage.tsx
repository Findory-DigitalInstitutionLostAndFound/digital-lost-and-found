import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, FileText, Mail, Plus, Trash2, X } from "lucide-react"
import { api } from "../services/api"
import { ItemCard } from "../components/ui/ItemCard"
import type { Item } from "../components/ui/ItemCard"

type ReportFilter = "all" | "lost" | "found"

interface ProfilePageProps {
  user: { name: string; email: string; phone?: string; user_id: string } | null
  navigate: (page: string, itemId?: number) => void
  onDeleteAccount: () => void
}

export function ProfilePage({ user, navigate, onDeleteAccount }: ProfilePageProps) {
  const [filter, setFilter] = useState<ReportFilter>("all")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [myItems, setMyItems] = useState<Item[]>([])

  useEffect(() => {
    if (!user) return

    async function fetchUserItems() {
      setLoading(true)
      try {
        const itemsResponse = await api.get("/items")
        const rawItems: any[] = itemsResponse.data?.items || []

        const formattedItems: Item[] = rawItems
          .filter((i: any) => i.user_id === user!.user_id)
          .map((i: any) => ({
            id: i.id,
            type: i.item_type,
            title: i.title,
            description: i.public_description,
            tags: i.ai_tags || [],
            location: i.location_name,
            date: i.event_timestamp ? i.event_timestamp.split("T")[0] : "",
            category: i.category || "Other",
            status: "active",
            imageUrl: i.blurred_image_url,
            user_id: i.user_id,
            drop_off_location: i.drop_off_location,
            custody_status: i.custody_status,
            qr_token: i.qr_token
          }))

        setMyItems(formattedItems)
      } catch (err) {
        console.error("Failed to load user reports from backend:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserItems()
  }, [user])

  const visibleItems = useMemo(() => {
    if (filter === "all") return myItems
    return myItems.filter((item) => item.type === filter)
  }, [myItems, filter])

  const lostCount = useMemo(
    () => myItems.filter((item) => item.type === "lost").length,
    [myItems]
  )

  const foundCount = useMemo(
    () => myItems.filter((item) => item.type === "found").length,
    [myItems]
  )

  if (!user) return null

  return (
    <div className="flex-1 min-h-screen bg-[#FAF6EC] text-[#0E0D0B]">
      {/* Page Header */}
      <header className="border-b border-[#2A2925]/20 px-5 py-6 sm:px-8">
        <div className="font-mono mb-1 text-[10px] uppercase tracking-widest text-[#6B6560]">
          Account / Profile
        </div>
        <h1 className="text-3xl font-black">Your profile</h1>
      </header>

      {/* User Details & Email */}
      <section className="border-b border-[#2A2925]/20 px-5 py-7 sm:px-8">
        <h2 className="truncate text-3xl font-black">{user.name}</h2>
        <div className="mt-3 flex flex-col gap-1.5 text-xs text-[#6B6560] sm:flex-row sm:flex-wrap sm:gap-x-5">
          <span className="font-mono flex items-center gap-1.5">
            <Mail size={12} />
            {user.email}
          </span>
        </div>
      </section>

      {/* Clickable Report Counts Bar */}
      <section className="grid grid-cols-3 border-b border-[#2A2925]/20">
        <ProfileStat
          value={myItems.length}
          label="All reports"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <ProfileStat
          value={lostCount}
          label="Lost items"
          active={filter === "lost"}
          onClick={() => setFilter("lost")}
        />
        <ProfileStat
          value={foundCount}
          label="Found items"
          active={filter === "found"}
          onClick={() => setFilter("found")}
          last
        />
      </section>

      {/* User's Reported Items and Tab Switcher */}
      <section>
        <div className="flex flex-col gap-4 border-b border-[#2A2925]/20 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div>
            <div className="font-mono mb-1 text-[10px] uppercase tracking-widest text-[#6B6560]">
              Your reports
            </div>
            <h2 className="text-2xl font-black">
              {filter === "all"
                ? "All reported items"
                : filter === "lost"
                  ? "Lost items you reported"
                  : "Found items you reported"}
            </h2>
          </div>

          {/* Segmented Tab Switcher */}
          <div
            role="tablist"
            aria-label="Filter reported items"
            className="inline-flex w-fit border border-[#0E0D0B]/20 bg-[#F0EAD6] p-1"
          >
            {(
              [
                ["all", "All", myItems.length],
                ["lost", "Lost", lostCount],
                ["found", "Found", foundCount],
              ] as [ReportFilter, string, number][]
            ).map(([id, label, count]) => {
              const isActive = filter === id
              const activeClasses =
                id === "lost"
                  ? "bg-[#D93B2B] text-[#FAF6EC]"
                  : id === "found"
                    ? "bg-[#06C167] text-[#0E0D0B]"
                    : "bg-[#0E0D0B] text-[#FAF6EC]"

              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setFilter(id)}
                  className={`font-mono flex items-center gap-2 px-3.5 py-2 text-[10px] uppercase tracking-widest transition-colors cursor-pointer ${
                    isActive
                      ? `${activeClasses} font-bold`
                      : "text-[#0E0D0B]/70 hover:text-[#0E0D0B]"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] ${
                      isActive ? "bg-black/15" : "bg-[#0E0D0B]/10"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between border-b border-[#2A2925]/20 bg-[#0E0D0B]/5 px-5 py-2.5 sm:px-8">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#0E0D0B]/65">
            Showing {visibleItems.length} {filter === "all" ? "" : `${filter} `}
            {visibleItems.length === 1 ? "item" : "items"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("report-found")}
              className="flex items-center gap-1 border border-[#2A2925]/30 bg-[#06C167] px-2.5 py-1 text-[11px] font-bold hover:bg-black/5 cursor-pointer"
            >
              <Plus size={12} />
              Report Found
            </button>
            <button
              type="button"
              onClick={() => navigate("report-lost")}
              className="flex items-center gap-1 bg-[#D93B2B] px-2.5 py-1 text-[11px] font-bold text-white hover:opacity-90 cursor-pointer"
            >
              <Plus size={12} />
              Report Lost
            </button>
          </div>
        </div>

        {/* Items List */}
        {loading ? (
          <div className="px-8 py-14 text-center font-mono text-xs uppercase tracking-widest text-[#6B6560]">
            Loading your reported items...
          </div>
        ) : visibleItems.length > 0 ? (
          <div>
            {visibleItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                navigate={navigate}
                currentUserId={user.user_id}
              />
            ))}
          </div>
        ) : (
          <EmptyReports
            filter={filter}
            onReport={() =>
              navigate(filter === "found" ? "report-found" : "report-lost")
            }
          />
        )}
      </section>

      {/* Danger Zone */}
      <section className="border-t border-[#D93B2B] bg-[#D93B2B]/5 px-5 py-8 sm:px-8">
        <div className="flex max-w-3xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-mono mb-1 text-[10px] uppercase tracking-widest text-[#D93B2B]">
              Danger zone
            </div>
            <h2 className="text-xl font-black">Delete your Findory account</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#6B6560]">
              Permanently remove your profile and reported items. This action
              cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="flex shrink-0 items-center justify-center gap-2 bg-[#D93B2B] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 cursor-pointer"
          >
            <Trash2 size={14} />
            Delete account
          </button>
        </div>
      </section>

      {deleteOpen && (
        <DeleteAccountDialog
          userEmail={user.email}
          onClose={() => setDeleteOpen(false)}
          onConfirm={onDeleteAccount}
        />
      )}
    </div>
  )
}

function ProfileStat({
  value,
  label,
  active = false,
  onClick,
  last = false,
}: {
  value: number
  label: string
  active?: boolean
  onClick: () => void
  last?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-6 text-left transition-colors cursor-pointer sm:px-8 ${
        active ? "bg-[#F0EAD6]" : "hover:bg-black/2"
      } ${last ? "" : "border-r border-[#2A2925]/20"}`}
    >
      <div className="text-3xl font-black leading-none">
        {String(value).padStart(2, "0")}
      </div>
      <div className="font-mono mt-2 text-[10px] uppercase tracking-widest text-[#6B6560]">
        {label}
      </div>
    </button>
  )
}

function EmptyReports({
  filter,
  onReport,
}: {
  filter: ReportFilter
  onReport: () => void
}) {
  return (
    <div className="flex flex-col items-center border-b border-[#2A2925]/20 px-8 py-14 text-center">
      <FileText size={26} className="mb-4 text-[#6B6560]/40" />
      <h3 className="text-lg font-bold">
        No {filter === "all" ? "" : `${filter} `}items reported yet
      </h3>
      <p className="font-mono mt-1 mb-5 text-[10px] uppercase tracking-widest text-[#6B6560]">
        Items you report will show up here.
      </p>
      <button
        type="button"
        onClick={onReport}
        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white cursor-pointer ${
          filter === "found" ? "bg-[#06A958]" : "bg-[#D93B2B]"
        }`}
      >
        <Plus size={13} />
        Report {filter === "found" ? "found" : "lost"} item
      </button>
    </div>
  )
}

function DeleteAccountDialog({
  userEmail,
  onClose,
  onConfirm,
}: {
  userEmail: string
  onClose: () => void
  onConfirm: () => void
}) {
  const [confirmation, setConfirmation] = useState("")
  const canDelete = confirmation.trim().toUpperCase() === "DELETE"

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-[#0E0D0B]/75 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg border-2 border-[#D93B2B] bg-[#F0EAD6] text-[#0E0D0B] shadow-[10px_10px_0_#0E0D0B]"
      >
        <div className="flex items-start justify-between border-b border-[#2A2925]/20 p-5 sm:p-6">
          <div className="flex gap-3">
            <AlertTriangle
              size={22}
              className="mt-0.5 shrink-0 text-[#D93B2B]"
            />
            <div>
              <div className="font-mono mb-1 text-[10px] uppercase tracking-widest text-[#D93B2B]">
                Final confirmation
              </div>
              <h2 className="text-2xl font-black">Delete this account?</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#6B6560] transition-colors hover:text-[#0E0D0B]"
            aria-label="Close delete account dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-[#6B6560]">
            You are deleting{" "}
            <strong className="text-[#0E0D0B]">{userEmail}</strong>. Your
            profile and reported items will be removed from this session.
          </p>
          <label
            htmlFor="delete-confirmation"
            className="font-mono mt-6 mb-2 block text-[10px] uppercase tracking-widest"
          >
            Type <strong className="text-[#D93B2B]">DELETE</strong> to confirm
          </label>
          <input
            id="delete-confirmation"
            autoFocus
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="h-11 w-full border border-[#2A2925]/30 bg-[#FAF6EC] px-3 font-mono text-sm uppercase outline-none focus:border-[#D93B2B] focus:ring-2 focus:ring-[#D93B2B]/20"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#2A2925]/20 p-5 sm:flex-row sm:justify-end sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="border border-[#2A2925]/30 px-4 py-2 text-sm font-bold hover:bg-black/5 cursor-pointer"
          >
            Keep my account
          </button>
          <button
            type="button"
            disabled={!canDelete}
            onClick={onConfirm}
            className={`flex items-center justify-center gap-2 bg-[#D93B2B] px-4 py-2 text-sm font-bold text-white ${
              !canDelete
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:opacity-90"
            }`}
          >
            <Trash2 size={14} />
            Permanently delete
          </button>
        </div>
      </div>
    </div>
  )
}