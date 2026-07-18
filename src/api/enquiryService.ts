import api from './axios';

export interface EnquiryPayload {
  productId: string;
  buyerName: string;
  email: string;
  mobile: string;
  deliveryLocation: string;
  requiredQuantity: number;
  message: string;
}

export const createEnquiry = async (enquiryData: EnquiryPayload) => {
  const response = await api.post('/enquiries', enquiryData);
  return response.data.data || response.data;
};

export const getAdminEnquiries = async () => {
  const response = await api.get('/enquiries/admin');
  return response.data.data || response.data;
};