import {api} from "./api";
import { authService } from "./authService";

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
}

export const fetchItemsService = {
    async fetchItems(): Promise<Item[]> {
        const response = await api.get<{ items: Item[] }>('/items');
        return response.data.items;
    },

    // Filters items to only return those created by the logged-in user
    async fetchMyItems(): Promise<Item[]> {
        const [itemsResponse, currentUser] = await Promise.all([
            api.get<{ items: Item[] }>('/items'),
            authService.getCurrentUser()
        ]);

        if (!currentUser?.user_id) {
            return [];
        }

        return itemsResponse.data.items.filter(
            (item) => item.user_id === currentUser.user_id
        );
    }
}