import {api} from "./api";

// message types
export type ClaimMessage = {
  id: string;
  claim_id: string;
  sender_user_id: string | null;
  sender_guest_id: string | null;
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

export const claimsService = {
  async getClaims(): Promise<FetchClaimsResponse> {
    const response = await api.get<FetchClaimsResponse>('/claims');
    return response.data;
  },
}