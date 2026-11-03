import type { ApiItemResponse } from '@/types';
import type { NotificationPrefs, Order, PrivacyPrefs, Profile, ProfileUpdate } from '@/types/profile';
import api from './api';

export const getProfile = async (): Promise<Profile> => {
  const { data } = await api.get<ApiItemResponse<{ profile: Profile }>>('/profile');
  return data.data.profile;
};

export const updateProfile = async (fields: ProfileUpdate): Promise<Profile> => {
  const { data } = await api.patch<ApiItemResponse<{ profile: Profile }>>('/profile', fields);
  return data.data.profile;
};

export const uploadAvatar = async (image: string): Promise<string> => {
  const { data } = await api.put<ApiItemResponse<{ avatar: string }>>('/profile/avatar', { image });
  return data.data.avatar;
};

export const deleteAvatar = async (): Promise<void> => {
  await api.delete('/profile/avatar');
};

export const changeEmail = async (input: { email: string; password: string }): Promise<string> => {
  const { data } = await api.patch<ApiItemResponse<{ email: string }>>('/profile/email', input);
  return data.data.email;
};

/** Returns the new token (every older token stops working after a password change). */
export const changePassword = async (input: { currentPassword: string; newPassword: string; remember: boolean }): Promise<string> => {
  const { data } = await api.patch<ApiItemResponse<{ token: string }>>('/profile/password', input);
  return data.data.token;
};

export const saveNotifications = async (values: Partial<NotificationPrefs>): Promise<NotificationPrefs> => {
  const { data } = await api.patch<ApiItemResponse<{ notifications: NotificationPrefs }>>('/profile/notifications', values);
  return data.data.notifications;
};

export const savePrivacy = async (values: Partial<PrivacyPrefs>): Promise<PrivacyPrefs> => {
  const { data } = await api.patch<ApiItemResponse<{ privacy: PrivacyPrefs }>>('/profile/privacy', values);
  return data.data.privacy;
};

export const getOrders = async (): Promise<Order[]> => {
  const { data } = await api.get<ApiItemResponse<{ orders: Order[] }>>('/profile/orders');
  return data.data.orders;
};