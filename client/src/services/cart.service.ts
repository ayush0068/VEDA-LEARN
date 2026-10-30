import type { ApiItemResponse, CartState, CartView } from '@/types';
import api from './api';

/** Signed-in cart (MongoDB): items, price summary, coupon and suggestions. */
export const getCart = async (): Promise<CartView> => {
  const { data } = await api.get<ApiItemResponse<CartView>>('/cart');
  return data.data;
};

/** Guest cart (localStorage slugs): same view, calculated by the server. */
export const previewCart = async (input: { slugs: string[]; couponCode?: string | null }): Promise<CartView> => {
  const { data } = await api.post<ApiItemResponse<CartView>>('/cart/preview', input);
  return data.data;
};

export const addCartItemRequest = async (slug: string): Promise<CartState> => {
  const { data } = await api.post<ApiItemResponse<CartState>>('/cart/items', { slug });
  return data.data;
};

export const removeCartItemRequest = async (slug: string): Promise<CartState> => {
  const { data } = await api.delete<ApiItemResponse<CartState>>(`/cart/items/${encodeURIComponent(slug)}`);
  return data.data;
};

export const clearCartRequest = async (): Promise<CartState> => {
  const { data } = await api.delete<ApiItemResponse<CartState>>('/cart');
  return data.data;
};

/** Guest cart -> account cart right after login. */
export const mergeCartRequest = async (input: { slugs: string[]; couponCode?: string | null }): Promise<CartState> => {
  const { data } = await api.post<ApiItemResponse<CartState>>('/cart/merge', input);
  return data.data;
};

export const applyCouponRequest = async (code: string): Promise<CartState> => {
  const { data } = await api.put<ApiItemResponse<CartState>>('/cart/coupon', { code });
  return data.data;
};

export const removeCouponRequest = async (): Promise<CartState> => {
  const { data } = await api.delete<ApiItemResponse<CartState>>('/cart/coupon');
  return data.data;
};