import {api} from "./api";
import { authService } from "./authService";
import { guestService } from "./guestService";
import type { UserInfo } from "./authService";

export type Item = {
    id: string;
    user_id: string | null;
    guest_id: string | null;
    item_type: 'lost' | 'found';
    title: string;
    category: string;
    public_description: string;
    location_name: string;
    event_timestamp: string;
    blurred_image_url: string | null;
    ai_tags: string[];
    drop_off_location: string | null;
    custody_status: string | null;
    qr_token: string | null;
}

export const fetchItemsService = {
    async fetchItems(): Promise<Item[]> {
        const response = await api.get<{ items: Item[] }>('/items');
        return response.data.items;
    },

    // Filters items to only return those created by the logged-in user
    async fetchMyItems(): Promise<Item[]> {
        const itemsResponse = await api.get<{ items: Item[] }>('/items');
        const allItems = itemsResponse.data.items ?? [];

        let currentUser: UserInfo | null = null;
        try {
            currentUser = await authService.getCurrentUser();
        } catch {
            currentUser = null;
        }

        if (currentUser?.role === 'guest') {
            return allItems.filter(
                (item) =>
                    item.item_type === 'lost' &&
                    (item.id === currentUser?.item_id || item.guest_id === currentUser?.user_id)
            );
        }

        if (currentUser?.user_id) {
            return allItems.filter((item) => item.user_id === currentUser.user_id);
        }

        // Fallback if /auth/me failed and user wasn't returned above
        try {
            const guestUser = await guestService.getCurrentUser();
            return allItems.filter(
                (item) =>
                    item.item_type === 'lost' &&
                    (item.id === guestUser?.item_id || item.guest_id === guestUser?.user_id)
            );
        } catch {
            return [];
        }
    }
}