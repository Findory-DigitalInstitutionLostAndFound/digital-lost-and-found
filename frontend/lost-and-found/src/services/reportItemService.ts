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
}

export const reportItemService = {
    async reportItem(data: ReportItemData): Promise<any> {
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

        const response = await api.post('/create-items', formData, {
            withCredentials: true,            
        });
        console.log('Response from reportItem:', response);
        console.log('Response data from reportItem:', response.data);
        return response.data;
    },
}