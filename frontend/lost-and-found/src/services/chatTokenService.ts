import {api} from "./api";

export type RealtimeTokenResponse = {
    access_token: string;
};

export const setupRealtime = async () => {
    const response = await api.get<RealtimeTokenResponse>('/auth/realtime-token');
    return response.data.access_token;
}