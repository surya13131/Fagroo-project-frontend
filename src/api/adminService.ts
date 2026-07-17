import api from './axios';

export const getDashboardStats = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data.data || response.data;
};

export const getAdminEnquiries = async () => {
  const response = await api.get('/enquiries/admin');
  return response.data.data || response.data;
};