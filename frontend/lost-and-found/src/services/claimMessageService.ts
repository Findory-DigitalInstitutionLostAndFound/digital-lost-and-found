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
};

// complete claim object type
export type ClaimDetail = {
  id: string;
  item_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  claimant_user_id: string;
  claimant_guest_id: string | null;
  owner_last_read_at: string | null;
  claimant_last_read_at: string | null;
  created_at: string;
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
    }
}