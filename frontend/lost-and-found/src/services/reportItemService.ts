import {api} from './api'

export type ReportFoundItemData = {
    title: string;
    description: string;
    category: string;
    location: string;
    date_found: string;
    tags: string[];       
    image: File | null; // image file, can be null
}

export const reportItemService = {
    async reportFoundItem(data: ReportFoundItemData): Promise<any> {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('category', data.category);
        formData.append('location', data.location);
        formData.append('date_found', data.date_found);
        formData.append('tags', data.tags.join(','));

        if (data.image) {
            formData.append('image', data.image);
        }

        const response = await api.post('/found-items', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'withCredentials': 'true'
            },
        });
        console.log('Response from reportFoundItem:', response);
        console.log('Response data from reportFoundItem:', response.data);
        return response.data;
    }
}