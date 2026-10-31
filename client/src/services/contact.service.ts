import api from './api';

export interface ContactPayload {
  name: string;
  email: string;
  queryType: string;
  message: string;
}

interface ContactResponse {
  success: boolean;
  message: string;
}

export const sendContactMessage = async (payload: ContactPayload): Promise<string> => {
  const { data } = await api.post<ContactResponse>('/contact', payload);
  return data.message;
};