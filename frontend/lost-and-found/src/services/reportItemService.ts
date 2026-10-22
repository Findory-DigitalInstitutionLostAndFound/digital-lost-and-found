import {api} from './api'

export type ReportItemData = {
    title: string;
    description: string;
    category: string;
    location: string;
    date_found: string;
    tags: string[];       
    image: File | null; // image file, can be null
    item_type: string; // "found" or "lost"
    isGuest?: boolean; // Optional flag to indicate guest submission
    guest_name?: string; 
    guest_email?: string; 
    guest_phone?: string; 
}

export const reportItemService = {
    async reportItem(data: ReportItemData): Promise<any> {
        // Automatically switch endpoints based on whether it's a guest report
        const endpoint = data.isGuest ? '/guest/create-item' : '/create-items';
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('category', data.category);
        formData.append('location', data.location);
        formData.append('date_found', data.date_found);
        formData.append('tags', data.tags.join(','));
        formData.append('mode', data.item_type);

        if (data.image) {
            formData.append('image', data.image);
        }

        // Append guest fields if this is a guest submission
        if (data.isGuest) {
            if (data.guest_name) formData.append('guest_name', data.guest_name);
            if (data.guest_email) formData.append('guest_email', data.guest_email);
            if (data.guest_phone) formData.append('guest_phone', data.guest_phone);
        }

        const response = await api.post(endpoint, formData, {
            withCredentials: true,            
        });
        console.log('Response from reportItem:', response);
        console.log('Response data from reportItem:', response.data);
        return response.data;
    },
}