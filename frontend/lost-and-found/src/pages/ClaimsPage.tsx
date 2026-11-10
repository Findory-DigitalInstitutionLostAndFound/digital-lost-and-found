import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Image, MessageSquare, Send, ShieldAlert, X } from 'lucide-react';
import { Button } from '../components/ui/Button';

type ClaimTab = 'mine' | 'incoming' | 'archived';

interface ClaimsPageProps {
  navigate: (page: string) => void;
  user?: { name: string; email: string; phone: string; user_id: string } | null;
}

export function ClaimsPage({ user }: ClaimsPageProps) {
  const currentUserId = user?.user_id ?? 'user-current';

  // Mock claims data 
  const [claims, setClaims] = useState([
    {
      id: '000c1',
      itemId: 'item-2',
      ownerId: currentUserId,
      claimantId: 'user-casey',
      claimantName: 'Casey Lin',
      status: 'pending',
      messages: [
        {
          id: 'm1',
          senderId: 'user-casey',
          senderName: 'Casey Lin',
          body: 'I found a pair of white AirPods in the science wing. Can you describe the case and where you were sitting?',
          createdAt: new Date(Date.now() - 49 * 86400000).toISOString(),
        },
        {
          id: 'm2',
          senderId: currentUserId,
          senderName: 'You',
          body: 'The case has a small grey scratch beside the charging port. I was at the window-side study carrel in room 204.',
          createdAt: new Date(Date.now() - 49 * 86400000 + 1620000).toISOString(),
        }
      ]
    },
    {
      id: '000c2',
      itemId: 'item- hydro',
      ownerId: 'user-sam',
      claimantId: currentUserId,
      claimantName: 'You',
      status: 'pending',
      messages: [
        {
          id: 'm3',
          senderId: 'user-sam',
          senderName: 'Sam Chen',
          body: 'Thanks. What colour is the lid sticker on your bottle?',
          createdAt: new Date(Date.now() - 50 * 86400000).toISOString(),
        }
      ]
    },
    {
      id: '000c3',
      itemId: 'item-1',
      ownerId: currentUserId,
      claimantId: 'user-maya',
      claimantName: 'Maya Johnson',
      status: 'approved',
      messages: [
        {
          id: 'm4',
          senderId: 'user-maya',
          senderName: 'Maya Johnson',
          body: 'That is mine. The library card is inside the flap.',
          createdAt: new Date(Date.now() - 52 * 86400000).toISOString(),
        }
      ]
    }
  ]);

  const [items] = useState([
    { id: 'item-1', title: 'Black Leather Wallet', userName: 'Maya Johnson', imageUrl: '' },
    { id: 'item-2', title: 'AirPods Pro (White)', userName: 'Casey Lin', imageUrl: '' },
    { id: 'item- hydro', title: 'Hydroflask Water Bottle', userName: 'Sam Chen', imageUrl: '' }
  ]);

  const [tab, setTab] = useState<ClaimTab>('incoming');
  const [selectedId, setSelectedId] = useState<string | null>('000c1');
  const [message, setMessage] = useState('');

  const visibleClaims = useMemo(() => claims.filter(claim => {
    if (tab === 'archived') {
      return (claim.ownerId === currentUserId || claim.claimantId === currentUserId) && claim.status !== 'pending';
    }
    if (claim.status !== 'pending') return false;
    return tab === 'incoming' ? claim.ownerId === currentUserId : claim.claimantId === currentUserId;
  }), [claims, tab, currentUserId]);

  const selectedClaim = claims.find(claim => claim.id === selectedId);
  const pendingIncoming = claims.filter(claim => claim.ownerId === currentUserId && claim.status === 'pending').length;

  const selectTab = (nextTab: ClaimTab) => {
    setTab(nextTab);
    setSelectedId(null);
    setMessage('');
  };

  const updateClaimStatus = (claimId: string, newStatus: 'approved' | 'rejected' | 'cancelled') => {
    setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: newStatus } : c));
  };

  const addClaimMessage = (claimId: string, text: string) => {
    const newMessage = {
      id: `m-${Date.now()}`,
      senderId: currentUserId,
      senderName: 'You',
      body: text,
      createdAt: new Date().toISOString(),
    };
    setClaims(prev => prev.map(c => c.id === claimId ? { ...c, messages: [...c.messages, newMessage] } : c));
  };

  const submitMessage = () => {
    if (!selectedClaim || !message.trim()) return;
    addClaimMessage(selectedClaim.id, message);
    setMessage('');
  };

  return (
    <div className="flex-1 min-h-screen bg-[#FAF6EC] text-[#0E0D0B]">
      <div className="border-b border-[#0E0D0B]/10 px-6 md:px-8 py-6">
        <div className="font-mono text-[10px] text-[#0E0D0B]/60 uppercase tracking-widest mb-1">Ownership verification</div>
        <h1 className="text-3xl font-black text-[#0E0D0B] mb-2" style={{ fontFamily: 'Fraunces, serif' }}>Claims</h1>
        <p className="font-mono text-xs text-[#0E0D0B]/70">Review the register, then open a claim to continue verification</p>
      </div>

      <div className="border-b border-[#0E0D0B]/10 px-6 md:px-8 flex overflow-x-auto">
        <TabButton active={tab === 'mine'} onClick={() => selectTab('mine')}>My claims</TabButton>
        <TabButton active={tab === 'incoming'} onClick={() => selectTab('incoming')}>
          Claims to me
          {pendingIncoming > 0 && <span className="bg-[#06C167] text-[#0E0D0B] px-1.5 py-0.5 text-[9px] font-bold ml-1.5">{pendingIncoming}</span>}
        </TabButton>
        <TabButton active={tab === 'archived'} onClick={() => selectTab('archived')}>Archived</TabButton>
      </div>

      <section>
        <div className="px-6 md:px-8 py-5 flex items-end justify-between border-b border-[#0E0D0B]/10">
          <div>
            <div className="font-mono text-[10px] text-[#0E0D0B]/60 uppercase tracking-widest mb-1">
              {tab === 'mine' ? 'Outgoing' : tab === 'incoming' ? 'Incoming' : 'Completed'}
            </div>
            <h2 className="text-xl font-black" style={{ fontFamily: 'Fraunces, serif' }}>Claims list</h2>
          </div>
          <span className="font-mono text-[10px] text-[#0E0D0B]/60 uppercase tracking-widest">
            {visibleClaims.length.toString().padStart(2, '0')} records
          </span>
        </div>

        {visibleClaims.length === 0 ? (
          <div className="px-8 py-20 text-center border-b border-[#0E0D0B]/10">
            <MessageSquare size={28} className="mx-auto text-[#0E0D0B]/30 mb-4" />
            <p className="font-mono text-xs text-[#0E0D0B]/60 uppercase tracking-widest">
              {tab === 'incoming' ? 'No one has claimed your items' : tab === 'mine' ? 'You have no active claims' : 'No archived claims'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[minmax(0,1.5fr)_minmax(10rem,0.65fr)_minmax(11rem,0.7fr)_2rem] gap-5 px-8 py-2.5 bg-[#0E0D0B]">
              <span className="font-mono text-[10px] text-[#6B6560] uppercase tracking-widest">Claim ID / Item</span>
              <span className="font-mono text-[10px] text-[#6B6560] uppercase tracking-widest">Status</span>
              <span className="font-mono text-[10px] text-[#6B6560] uppercase tracking-widest">Last message</span>
              <span />
            </div>
            <div>
              {visibleClaims.map(claim => {
                const item = items.find(entry => entry.id === claim.itemId);
                const isSelected = claim.id === selectedClaim?.id;
                const lastMessage = claim.messages.at(-1);
                return (
                  <button key={claim.id} onClick={() => {
                    setSelectedId(isSelected ? null : claim.id);
                    setMessage('');
                  }}
                    className={`w-full text-left grid md:grid-cols-[minmax(0,1.5fr)_minmax(10rem,0.65fr)_minmax(11rem,0.7fr)_2rem] gap-4 md:gap-5 items-center px-6 md:px-8 py-4 border-b border-[#0E0D0B]/10 transition-colors ${
                      isSelected ? 'bg-white border-l-4 border-l-[#06C167]' : 'hover:bg-[#0E0D0B]/5 border-l-4 border-l-transparent'
                    }`}>
                    <div className="flex items-center gap-4 min-w-0">
                      <ItemThumbnail item={item} />
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] text-[#0E0D0B]/60 uppercase tracking-widest mb-1">
                          Claim #{claim.id.toUpperCase()}
                        </div>
                        <div className="font-black text-base leading-tight truncate" style={{ fontFamily: 'Fraunces, serif' }}>{item?.title ?? 'Unknown item'}</div>
                        <div className="font-mono text-[10px] text-[#0E0D0B]/60 mt-1">
                          {tab === 'mine' ? `With ${item?.userName ?? 'item reporter'}` : tab === 'incoming' ? `From ${claim.claimantName}` : claim.claimantName}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="md:hidden font-mono text-[9px] text-[#0E0D0B]/60 uppercase tracking-widest mb-1">Status</div>
                      <ClaimStatus claim={claim} />
                    </div>
                    <div className="min-w-0">
                      <div className="md:hidden font-mono text-[9px] text-[#0E0D0B]/60 uppercase tracking-widest mb-1">Last message</div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-medium">{relativeTime(lastMessage?.createdAt)}</span>
                        {claim.status === 'pending' && <span className="w-2 h-2 bg-[#06C167] rounded-full shrink-0" />}
                      </div>
                      <p className="text-xs text-[#0E0D0B]/70 truncate mt-1">{lastMessage?.body}</p>
                    </div>
                    <span className="text-[#0E0D0B]/60 justify-self-end">
                      {isSelected ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      {selectedClaim && (
        <ClaimConversation
          claim={selectedClaim}
          itemTitle={items.find(item => item.id === selectedClaim.itemId)?.title ?? 'Unknown item'}
          currentUserId={currentUserId}
          tab={tab}
          message={message}
          onMessageChange={setMessage}
          onSend={submitMessage}
          onStatusChange={status => updateClaimStatus(selectedClaim.id, status)}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 md:px-5 py-3.5 font-mono text-[10px] md:text-xs uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
        active ? 'text-[#0E0D0B] border-[#06C167] bg-[#FAF6EC] font-bold' : 'text-[#0E0D0B]/60 border-transparent hover:text-[#0E0D0B]'
      }`}>
      {children}
    </button>
  );
}

function ItemThumbnail({ item }: { item?: { title: string; imageUrl?: string } }) {
  return (
    <div className="w-16 h-16 shrink-0 border border-[#0E0D0B]/20 bg-white overflow-hidden flex items-center justify-center">
      {item?.imageUrl
        ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
        : <Image size={18} className="text-[#0E0D0B]/40" />}
    </div>
  );
}

function ClaimStatus({ claim }: { claim: { status: string } }) {
  const isApproved = claim.status === 'approved';
  const isPending = claim.status === 'pending';
  
  return (
    <span className={`inline-block font-mono text-[10px] uppercase font-bold px-2.5 py-1 border border-[#0E0D0B]/20 bg-white ${
      isApproved ? 'text-[#06C167]' : isPending ? 'text-[#0E0D0B]' : 'text-[#D93B2B]'
    }`}>
      {isPending ? 'Pending Verification' : claim.status}
    </span>
  );
}

function ClaimConversation({ claim, itemTitle, currentUserId, tab, message, onMessageChange, onSend, onStatusChange }: {
  claim: { id: string; status: string; messages: Array<{ id: string; senderId: string; senderName: string; body: string; createdAt: string }> };
  itemTitle: string;
  currentUserId: string;
  tab: ClaimTab;
  message: string;
  onMessageChange: (val: string) => void;
  onSend: () => void;
  onStatusChange: (status: 'approved' | 'rejected' | 'cancelled') => void;
}) {
  const isPending = claim.status === 'pending';

  return (
    <section className="border-t-4 border-[#0E0D0B] bg-[#FAF6EC]">
      <div className="px-6 md:px-8 py-4 border-b border-[#0E0D0B]/10 bg-[#FAF6EC] flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] text-[#0E0D0B]/60 uppercase tracking-widest mb-1">
            Verification chat · Claim #{claim.id.toUpperCase()}
          </div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>{itemTitle}</h2>
        </div>
        <ClaimStatus claim={claim} />
      </div>

      <div className="border-b border-[#D93B2B] bg-[#D93B2B]/5 px-6 md:px-8 py-3 flex items-start gap-3">
        <ShieldAlert size={15} className="text-[#D93B2B] shrink-0 mt-0.5" />
        <p className="font-mono text-[10px] text-[#D93B2B] leading-relaxed">
          Do not share passwords, full ID numbers, card details, or money. Ask for a private identifying detail only the true owner would know.
        </p>
      </div>

      <div className="px-6 md:px-8 py-8 space-y-4 min-h-70">
        {claim.messages.map(entry => {
          const isMine = entry.senderId === currentUserId;
          return (
            <div key={entry.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl border p-4 ${isMine ? 'bg-[#0E0D0B] text-[#FAF6EC] border-[#0E0D0B]' : 'bg-white border-[#0E0D0B]/20 text-[#0E0D0B]'}`}>
                <div className={`font-mono text-[9px] uppercase tracking-widest mb-2 ${isMine ? 'text-[#FAF6EC]/60' : 'text-[#0E0D0B]/60'}`}>
                  {isMine ? 'You' : entry.senderName} · {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <p className="text-sm leading-relaxed">{entry.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#0E0D0B]/10 bg-[#FAF6EC] p-5 md:px-8">
        {isPending && tab !== 'archived' ? (
          <>
            <div className="flex gap-2 mb-4 max-w-3xl">
              <input
                value={message}
                onChange={event => onMessageChange(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    onSend();
                  }
                }}
                placeholder="Ask or answer a verification question…"
                className="flex-1 h-10 px-3 text-sm bg-white border border-[#0E0D0B]/20 focus:outline-none focus:ring-2 focus:ring-[#0E0D0B]"
              />
              <Button size="icon" onClick={onSend} disabled={!message.trim()} title="Send message">
                <Send size={14} />
              </Button>
            </div>
            {tab === 'incoming' ? (
              <div className="flex gap-3">
                <Button variant="found" onClick={() => onStatusChange('approved')} className="font-mono text-xs uppercase">
                  <Check size={14} /> Approve claim
                </Button>
                <Button variant="danger" onClick={() => onStatusChange('rejected')} className="font-mono text-xs uppercase">
                  <X size={14} /> Reject
                </Button>
              </div>
            ) : (
              <Button variant="danger" onClick={() => onStatusChange('cancelled')} className="font-mono text-xs uppercase">
                <X size={14} /> Cancel claim
              </Button>
            )}
          </>
        ) : (
          <p className="font-mono text-[10px] text-[#0E0D0B]/60 uppercase tracking-widest">
            This claim is {claim.status}. The conversation is now read-only.
          </p>
        )}
      </div>
    </section>
  );
}

function relativeTime(value?: string) {
  if (!value) return 'No messages';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}