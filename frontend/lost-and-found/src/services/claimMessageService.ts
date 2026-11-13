import {api} from "./api";

// message types
export type ClaimMessage = {
  id: string;
  claim_id: string;
  sender_user_id: string | null;
  sender_guest_id: string | null;
  image_url: string | null;
  content: string;
  created_at: string;
};

// attached item types
export type ClaimItemSummary = {
  title: string;
  item_type: 'lost' | 'found';
  public_description: string;
  blurred_image_url: string | null;
  is_high_valued: boolean;
};

// complete claim object type
export type ClaimDetail = {
  id: string;
  item_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'handover_completed';
  claimant_user_id: string;
  claimant_guest_id: string | null;
  owner_last_read_at: string | null;
  claimant_last_read_at: string | null;
  created_at: string;
  meetup_location?: string | null;
  meetup_time?: string | null;
  owner_accepted_meetup?: boolean;
  claimant_accepted_meetup?: boolean;
  is_unread: boolean; // Computed by backend
  item: ClaimItemSummary;
  messages: ClaimMessage[];
};

// combined response type
export type FetchClaimsResponse = {
  claims_as_claimant: ClaimDetail[];
  claims_as_founder: ClaimDetail[];
};

// chat message type for sending messages
export type SendMessageData = {
  claimId: string;
  content: string;
  imageFile?: File | null;
};

//Meeetup ti,e and location update type
export type UpdateMeetupData = {
  claimId: string;
  location: string;
  time: string;
};


export const claimsService = {
    async getClaims(): Promise<FetchClaimsResponse> {
        const response = await api.get<FetchClaimsResponse>('/claims');
        return response.data;
    },

    async sendMessage(data: SendMessageData): Promise<void> {
        const formData = new FormData();
        formData.append('content', data.content);
        if (data.imageFile) {
            formData.append('image', data.imageFile);
        }
        await api.post(`/claims/${data.claimId}/send-message`, formData);
    },

    async updateClaimStatus(claimId: string, newStatus: string): Promise<void> {
        await api.post(`/claims/${claimId}/update-status`, { status: newStatus });
    },

    async markClaimAsRead(claimId: string): Promise<void> {
        await api.post(`/claims/${claimId}/update-last-read`);
    },

    async updateMeetupDetails(data: UpdateMeetupData): Promise<void> {
        await api.post(`/claims/${data.claimId}/update-meetup`, {
            location: data.location,
            time: data.time,
        });
    },

    async acceptMeetup(claimId: string): Promise<void> {
        await api.post(`/claims/${claimId}/accept-meetup`);
    },
}