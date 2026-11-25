import {api} from "./api";

export type StaffUser = {
    id: string;
    email: string;
    full_name: string;
    uni_role: string;
    service_point: string | null;
    account_status: string;
};

export type Admin = {
    user_id: string;
    email: string;
    service_point: string;
};

export const adminService = {
    async fetchAllStaffUsers(): Promise<StaffUser[]> {
        const response = await api.get<{ staff_users: StaffUser[] }>('/admin/fetch-all-staff-users');
        return response.data.staff_users;
    },
    async assignAdminRole(assignAdminList: Admin[]): Promise<{ message: string }> {
        const response = await api.post('/admin/assign-admin-role', { admins: assignAdminList });
        return response.data;
    },
    async updateAdminRole(admin: Admin): Promise<{ message: string }> {
        const response = await api.post('/admin/update-admin-role', admin);
        return response.data;
    }
}