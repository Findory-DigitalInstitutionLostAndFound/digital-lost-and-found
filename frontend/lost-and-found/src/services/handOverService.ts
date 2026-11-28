import {api} from "./api";

export type GenerateQrResponse = {
  status: string;
  qr_token: string;
  expires_at: string;
  qr_payload: string;
};

export type VerifyQrResponse = {
  status: string;
  message: string;
  data?: unknown;
};

export const handOverService = {
    // Generate a QR code for the handover process
    async generateQr(claimId: string): Promise<GenerateQrResponse> {
        const response = await api.post<GenerateQrResponse>(
            `/claims/${claimId}/generate_qr`
        );
        return response.data;
    },

    // Verify qr code and complete the handover process
    async verifyQr(qrPayload: string): Promise<VerifyQrResponse> {
        const response = await api.post<VerifyQrResponse>(
            `/admin/verify_qr_handover`,
            {
                qr_token: qrPayload
            }
        );
        return response.data;
    }
}