import {api} from './api';

export type InitialClaimData = {
    item_id: string;
};
export type ConfirmationQuestionData = {
    question_list: string[];
};

export const claimService = {
    async createClaim(data: InitialClaimData): Promise<ConfirmationQuestionData> {
        const response = await api.post<ConfirmationQuestionData>('/create-claims', data);
        return response.data;
    }
}