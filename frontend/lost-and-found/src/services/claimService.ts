import {api} from './api';

export type InitialClaimData = {
    item_id: string;
};
export type ConfirmationQuestionData = {
    status: string;
    claim_id: string;
};

export const claimService = {
    async createClaim(data: InitialClaimData): Promise<ConfirmationQuestionData> {
        const response = await api.post<ConfirmationQuestionData>('/create-claim', data);
        return response.data;
    }
}