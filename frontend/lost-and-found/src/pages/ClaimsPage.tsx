import React, { useMemo, useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp, Image, MessageSquare, Send, ShieldAlert, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { claimsService, type ClaimDetail } from '../services/claimMessageService';
import { createClient } from '@supabase/supabase-js/dist/index.cjs';

type ClaimTab = 'mine' | 'incoming' | 'archived';

interface ClaimsPageProps {
  navigate: (page: string) => void;
  user?: { name: string; email: string; phone: string; user_id: string } | null;
  refreshCounts?: () => void;
}

export function ClaimsPage({ user, refreshCounts }: ClaimsPageProps) {
  const currentUserId = user?.user_id ?? 'user-current';
 
  const [claimantClaims, setClaimantClaims] = useState<ClaimDetail[]>([]);
  const [founderClaims, setFounderClaims] = useState<ClaimDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [tab, setTab] = useState<ClaimTab>('incoming');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // fetch claim on mount
  const fetchClaimsData = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      const data = await claimsService.getClaims();
      setClaimantClaims(data.claims_as_claimant);
      setFounderClaims(data.claims_as_founder);
      console.log('Fetched claims data:', data);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchClaimsData();
  }, []);

  // combine all claims to a single arrat for easier lookup
  const allClaims = useMemo(() => {
    return [...claimantClaims, ...founderClaims];
  }, [claimantClaims, founderClaims]);

  //filter claims by acttive tab
  const visibleClaims = useMemo(() => {
    if (tab === 'archived'){
      return allClaims.filter(c => c.status === 'handover_completed' || c.status === 'rejected' || c.status === 'cancelled');
    }
    if (tab === 'incoming') {
      return founderClaims.filter(c => c.status === 'pending' || c.status === 'approved');
    }
    return claimantClaims.filter(c => c.status === 'pending' || c.status === 'approved');
  }, [allClaims, tab, claimantClaims, founderClaims]);

  const selectedClaim = allClaims.find(claim => claim.id === selectedId);
  const pendingIncomingCount = founderClaims.filter(claim => claim.status === 'pending' && claim.is_unread).length;

  const selectTab = (nextTab: ClaimTab) => {
    setTab(nextTab);
    setSelectedId(null);
    setMessage('');
  };

  const handleStatusChange = async (claimId: string, newStatus: string) => {
    try {
      // Call backend API to update status
      await claimsService.updateClaimStatus(claimId, newStatus);
      // Refresh claims list
      await fetchClaimsData();
    } catch (err) {
      console.error(`Failed to update status to ${newStatus}:`, err);
    }
  };

  // Supabase realtime subscription for live chat updates
  useEffect(() => {
    if (!selectedId) return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) return;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const channel = supabase
      .channel(`claim-chat-${selectedId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'claim_messages',
          filter: `claim_id=eq.${selectedId}`,
        },
        () => {
          // Silently fetch fresh claims data when a new message comes in via Realtime
          fetchClaimsData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId]);

  // Handle Sending Message with Attachment
  const submitMessage = async () => {
    if (!selectedClaim || (!message.trim() && !imageFile)) return;

    try {
      // Send message using the claimsService
      await claimsService.sendMessage({
        claimId: selectedClaim.id,
        content: message,
        imageFile: imageFile
      });

      // Clear input fields after sending
      setMessage('');
      setImageFile(null);

      // Refresh messages
      await fetchClaimsData();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
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
          {pendingIncomingCount > 0 && <span className="bg-[#06C167] text-[#0E0D0B] px-1.5 py-0.5 text-[9px] font-bold ml-1.5">{pendingIncomingCount}</span>}
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

        {isLoading ? (
          <div className="px-8 py-20 text-center border-b border-[#0E0D0B]/10">
            <p className="font-mono text-xs text-[#0E0D0B]/60 uppercase tracking-widest">
              Loading claims…
            </p>
          </div>
        ) : visibleClaims.length === 0 ? (
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
                const isSelected = claim.id === selectedClaim?.id;
                const lastMessage = claim.messages.at(-1); 

                console.log(`Claim ${claim.id} is_unread:`, claim.is_unread);
                return (
                  <button key={claim.id} onClick={() => {
                    setSelectedId(isSelected ? null : claim.id);
                    setMessage('');
                    if (claim.is_unread) {
                      claimsService.markClaimAsRead(claim.id);
                      claim.is_unread = false; 
                      refreshCounts?.(); // Immediately updates the global header/sidebar counter!
                    }
                  }}
                    className={`w-full text-left grid md:grid-cols-[minmax(0,1.5fr)_minmax(10rem,0.65fr)_minmax(11rem,0.7fr)_2rem] gap-4 md:gap-5 items-center px-6 md:px-8 py-4 border-b border-[#0E0D0B]/10 transition-colors ${
                      isSelected ? 'bg-white border-l-4 border-l-[#06C167]' : 'hover:bg-[#0E0D0B]/5 border-l-4 border-l-transparent'
                    }`}>
                    <div className="flex items-center gap-4 min-w-0">
                      <ItemThumbnail imageUrl= {claim.item?.blurred_image_url} />
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] text-[#0E0D0B]/60 uppercase tracking-widest mb-1">
                          Claim #{claim.id.slice(0, 6).toUpperCase()} 
                        </div>
                        <div className="font-black text-base leading-tight truncate" style={{ fontFamily: 'Fraunces, serif' }}>
                          {claim.item?.title ?? 'Unknown item'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="md:hidden font-mono text-[9px] text-[#0E0D0B]/60 uppercase tracking-widest mb-1">Status</div>
                      <ClaimStatus status={claim.status} />
                    </div>
                    <div className="min-w-0">
                      <div className="md:hidden font-mono text-[9px] text-[#0E0D0B]/60 uppercase tracking-widest mb-1">Last message</div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-medium">{relativeTime(lastMessage?.created_at)}</span>
                        {claim.is_unread && (
                          <span className="bg-[#06C167] text-[#0E0D0B] font-mono text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                            New msg
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate mt-1 ${claim.is_unread ? 'font-bold text-[#0E0D0B]' : 'text-[#0E0D0B]/70'}`}>
                        {lastMessage?.content}
                      </p>
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
          currentUserId={currentUserId}
          tab={tab}
          message={message}
          imageFile={imageFile}
          onImageChange={setImageFile}
          onMessageChange={setMessage}
          onSend={submitMessage}
          onStatusChange={status => handleStatusChange(selectedClaim.id, status)}
          onRefresh={() => fetchClaimsData(false)} 
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

function ItemThumbnail({ imageUrl }: { imageUrl?: string | null }) {
  return (
    <div className="w-16 h-16 shrink-0 border border-[#0E0D0B]/20 bg-white overflow-hidden flex items-center justify-center">
      {imageUrl
        ? <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        : <Image size={18} className="text-[#0E0D0B]/40" />}
    </div>
  );
}

function ClaimStatus({ status }: { status: string }) {
  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  
  return (
    <span className={`inline-block font-mono text-[10px] uppercase font-bold px-2.5 py-1 border border-[#0E0D0B]/20 bg-white ${
      isApproved ? 'text-[#06C167]' : isPending ? 'text-[#0E0D0B]' : 'text-[#D93B2B]'
    }`}>
      {isPending ? 'Pending Verification' : status}
    </span>
  );
}

function ClaimConversation({ claim, currentUserId, tab, message, onMessageChange, imageFile, onImageChange, onSend, onStatusChange, onRefresh }: {
  claim: ClaimDetail;
  currentUserId: string;
  tab: ClaimTab;
  message: string;
  onMessageChange: (val: string) => void;
  imageFile: File | null;
  onImageChange: (file: File | null) => void;
  onSend: () => void;
  onStatusChange: (status: 'approved' | 'rejected' | 'cancelled') => void;
  onRefresh: () => void;
}) {
  const isPending = claim.status === 'pending';
  const isApproved = claim.status === 'approved';
  const isHighValue = Boolean(claim.item?.is_high_valued);

  // Found person = owner side = "incoming" tab
  const isFoundPerson = tab === 'incoming';

  // Local form state
  const [meetupLocation, setMeetupLocation] = useState(
    claim.meetup_location ?? (isHighValue ? 'Campus service point' : '')
  );
  const [meetupTime, setMeetupTime] = useState(
    claim.meetup_time ? claim.meetup_time.slice(0, 16) : ''
  );

  // Keep form in sync when claim data refreshes
  useEffect(() => {
    setMeetupLocation(
      claim.meetup_location ?? (isHighValue ? 'Campus service point' : '')
    );
    setMeetupTime(claim.meetup_time ? claim.meetup_time.slice(0, 16) : '');
  }, [claim.meetup_location, claim.meetup_time, isHighValue]);

  const hasProposal = Boolean(claim.meetup_location && claim.meetup_time);
  const bothAccepted =
    Boolean(claim.owner_accepted_meetup) &&
    Boolean(claim.claimant_accepted_meetup);

  // Found person must suggest first
  const canProposeFirst = isFoundPerson && !hasProposal;
  // Anyone can counter if there is a proposal and meetup not fully agreed
  const canCounter = hasProposal && !bothAccepted;
  // Accept if there is a proposal and this side has not accepted yet
  const iAmOwner = isFoundPerson;
  const iAlreadyAccepted = iAmOwner
    ? Boolean(claim.owner_accepted_meetup)
    : Boolean(claim.claimant_accepted_meetup);
  const canAccept = hasProposal && !bothAccepted && !iAlreadyAccepted;
  
  // Detect if the form values have changed from the current proposal
  const savedTimeLocal = claim.meetup_time ? claim.meetup_time.slice(0, 16) : '';
  const savedLocation = claim.meetup_location ?? '';

  const proposalChanged = isHighValue
    ? meetupTime !== savedTimeLocal
    : meetupLocation.trim() !== savedLocation.trim() || meetupTime !== savedTimeLocal;

  const saveProposal = async () => {
    if (hasProposal && !proposalChanged) {
      alert('Change the place or time before sending a new proposal.');
      return;
    }
    const location = isHighValue
      ? 'Campus service point'
      : meetupLocation.trim();

    if (!location || !meetupTime) {
      alert('Please set place and time.');
      return;
    }

    try {
      await claimsService.updateMeetupDetails({
        claimId: claim.id,
        location: location,
        time: meetupTime
      });
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Could not save meetup proposal.');
    }
  };

  const acceptProposal = async () => {
    try {
      await claimsService.acceptMeetup(claim.id);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Could not accept meetup.');
    }
  };

  return (
    <section className="border-t-4 border-[#0E0D0B] bg-[#FAF6EC]">
      <div className="px-6 md:px-8 py-4 border-b border-[#0E0D0B]/10 bg-[#FAF6EC] flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] text-[#0E0D0B]/60 uppercase tracking-widest mb-1">
            Verification chat · Claim #{claim.id.toUpperCase()}
          </div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>{claim.item?.title}</h2>
        </div>
        <ClaimStatus status={claim.status} />
      </div>

      <div className="border-b border-[#D93B2B] bg-[#D93B2B]/5 px-6 md:px-8 py-3 flex items-start gap-3">
        <ShieldAlert size={15} className="text-[#D93B2B] shrink-0 mt-0.5" />
        <p className="font-mono text-[10px] text-[#D93B2B] leading-relaxed">
          Do not share passwords, full ID numbers, card details, or money. Ask for a private identifying detail only the true owner would know.
        </p>
      </div>

      <div className="px-6 md:px-8 py-8 space-y-4 min-h-70">
        {claim.messages.map(entry => {
          const isMine = entry.sender_user_id === currentUserId;
          // Detect the AI-generated verification questions message and format it
          const isAiQuestions =
            entry.content.startsWith('Verification questions generated for ownership check:');

          let questions: string[] = [];
          if (isAiQuestions) {
            // Extract the numbered questions
            const raw = entry.content
              .replace('Verification questions generated for ownership check:', '')
              .trim();

            questions = raw
              .split(/\d+\.\s+/)          // split as numbered list
              .map(q => q.trim())
              .filter(Boolean);
          }
          return (
            <div key={entry.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl border p-4 ${isMine ? 'bg-[#0E0D0B] text-[#FAF6EC] border-[#0E0D0B]' : 'bg-white border-[#0E0D0B]/20 text-[#0E0D0B]'}`}>
                <div className={`font-mono text-[9px] uppercase tracking-widest mb-2 ${isMine ? 'text-[#FAF6EC]/60' : 'text-[#0E0D0B]/60'}`}>
                  {isMine ? 'You' : 'User'} · {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {/*Ai generated message special formatting*/}
                {isAiQuestions ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium leading-relaxed">
                      Verification questions for ownership check:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed">
                      {questions.map((q, idx) => (
                        <li key={idx} className="pl-1">
                          {q}
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : (
                <p className="text-sm leading-relaxed">{entry.content}</p>
                )}
                {entry.image_url && (
                  <div className="mt-2">
                    <img src={entry.image_url} alt="Attachement" className="max-w-full max-h-64 rounded border border-[#0E0D0B]/20 object-contain cursor-pointer" onClick={() => window.open(entry.image_url!, '_blank')} />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* MEETUP FORM (only after approve)*/}
        {isApproved && (
          <div className="mt-6 border border-[#0E0D0B]/20 bg-white p-4 space-y-3 max-w-xl">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#0E0D0B]/60">
                Arrange meetup
            </p>

            {bothAccepted ? (
              <p className="text-sm text-[#06C167] font-medium">
                Meetup agreed: {claim.meetup_location} ·{' '}
                {claim.meetup_time
                  ? new Date(claim.meetup_time).toLocaleString()
                  : ''}
              </p>
            ) : (
              <>
                {/*place */}
                <div>
                  <label className= "font-mono text-[10px] uppercase block mb-1">
                    Place
                  </label>
                  <input
                    value={isHighValue ? 'Campus service point' : meetupLocation}
                    onChange={e => setMeetupLocation(e.target.value)}
                    disabled={isHighValue || (!canProposeFirst && !canCounter)}
                    placeholder="e.g. Library lobby, Room 101"
                    className="w-full h-10 px-3 text-sm border border-[#0E0D0B]/20 bg-white disabled:bg-[#0E0D0B]/5"
                  />
                  {isHighValue && (
                    <p className="mt-1 font-mono text-[10px] text-[#D93B2B]">
                        High-value item: campus service point only.
                      </p>
                  )}
                </div>

                {/* Time */}
                <div>
                  <label className="font-mono text-[10px] uppercase block mb-1">
                    Date & time
                  </label>
                  <input
                    type="datetime-local"
                    value={meetupTime}
                    onChange={e => setMeetupTime(e.target.value)}
                    disabled={!canProposeFirst && !canCounter}
                    className="w-full h-10 px-3 text-sm border border-[#0E0D0B]/20 bg-white disabled:bg-[#0E0D0B]/5"
                  />
                </div>

                {/* Current proposal summary */}
                {hasProposal && (
                  <p className="text-xs text-[#0E0D0B]/70">
                    Current proposal: <strong>{claim.meetup_location}</strong> at{' '}
                    <strong>
                      {claim.meetup_time
                        ? claim.meetup_time.slice(0, 16).replace('T', ' ')
                        : '—'}
                    </strong>
                  </p>
                )}
                {/* Who accepted */}
                <p className="font-mono text-[10px] text-[#0E0D0B]/60">
                  Found person:{' '}
                  {claim.owner_accepted_meetup ? 'accepted' : 'waiting'} ·
                  Claimant:{' '}
                  {claim.claimant_accepted_meetup ? 'accepted' : 'waiting'}
                </p>

                {/* Buttons */}
                <div className="flex flex-wrap gap-2">
                  {/* First suggestion – only found person */}
                  {canProposeFirst && (
                    <Button onClick={saveProposal}>Suggest meetup</Button>
                  )}

                  {/* Counter – either side when not yet fully agreed */}
                  {canCounter && (
                    <Button onClick={saveProposal} disabled={!proposalChanged}> Suggest different </Button>
                  )}

                  {/* Accept current proposal */}
                  {canAccept && (
                    <Button variant="found" onClick={acceptProposal}>
                      <Check size={14} /> Accept this meetup
                    </Button>
                  )}

                  {/* Waiting states */}
                  {!hasProposal && !isFoundPerson && (
                    <p className="text-xs text-[#0E0D0B]/60">
                      Waiting for the found person to suggest place and time.
                    </p>
                  )}
                  {hasProposal && iAlreadyAccepted && !bothAccepted && (
                    <p className="text-xs text-[#0E0D0B]/60">
                      Waiting for the other person to accept.
                    </p>
                    )}
                </div>
              </>
            )}
          </div>
        )}
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
              {/* Image attachment button */}
              <label className="h-10 px-3 border border-[#0E0D0B]/20 bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 shrink-0" title="Attach image">
                <Image size={16} className="text-[#0E0D0B]/70" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={e => onImageChange(e.target.files?.[0] || null)} 
                />
              </label>

              <Button size="icon" onClick={onSend} disabled={!message.trim()} title="Send message">
                <Send size={14} />
              </Button>
            </div>

            {/* filename indicator so users know the image is attached */}
            {imageFile && (
              <div className="text-xs font-mono text-[#0E0D0B]/70 mb-3">
                Attached: {imageFile.name} (<button onClick={() => onImageChange(null)} className="text-red-600 underline">Remove</button>)
              </div>
            )}

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
        ) : isApproved ? (
          <p className="font-mono text-[10px] text-[#0E0D0B]/60 uppercase tracking-widest">
            Verification closed. Use the meetup form above to agree place and time.
          </p>
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