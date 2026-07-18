import api from "./axios";
import type { Product, CalculationResult } from "../types"; 

export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get("/products");
  return response.data.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await api.get(`/products/${id}`);
  return response.data.data;
};

export const calculatePrice = async (productId: string, quantity: number): Promise<CalculationResult> => {
  const response = await api.post('/products/calculate', { productId, quantity });
  return response.data.data;
};


export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data.data;
};

export const createCategory = async (categoryData: { name: string; description?: string }) => {
  const response = await api.post('/categories/admin/categories', categoryData);
  return response.data.data || response.data;
};



export const getDashboardStats = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data.data || response.data;
};

export const getAdminProducts = async () => {
  const response = await api.get("/admin/products");
  return response.data.data;
};

export const createProduct = async (productData: any): Promise<Product> => {
  const response = await api.post("/admin/products", productData);
  return response.data.data;
};

export const updateProduct = async (id: string, productData: any) => {
  const response = await api.put(`/admin/products/${id}`, productData);
  return response.data.data;
};

export const updateStock = async (id: string, availableQty: number) => {
  const response = await api.patch(`/admin/products/${id}/stock`, { availableQty });
  return response.data.data;
};

export const updateDiscount = async (id: string, discount: number) => {
  const response = await api.patch(`/admin/products/${id}/discount`, { discount });
  return response.data.data;
};


export const activateProduct = async (id: string) => {
  const response = await api.patch(`/admin/products/${id}/activate`);
  return response.data.data;
};

export const deactivateProduct = async (id: string) => {
  const response = await api.patch(`/admin/products/${id}/deactivate`);
  return response.data.data;
};

export const deleteProduct = async (id: string) => {
  const response = await api.delete(`/admin/products/${id}`);
  return response.data.data;
};