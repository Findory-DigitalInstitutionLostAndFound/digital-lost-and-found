import {api} from './api';

export type InitialClaimData = {
    item_id: string;
};
export type CreatedClaimData = {
    status: string;
    claim_id: string;
    message: string;
};

export const claimService = {
    async createClaim(data: InitialClaimData): Promise<CreatedClaimData> {
        const response = await api.post<CreatedClaimData>('/create-claim', data);
        return response.data;
    }
}