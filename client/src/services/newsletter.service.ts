import api from './api';

interface SubscribeResponse {
  success: boolean;
  message: string;
}

export const subscribeToNewsletter = async (email: string): Promise<string> => {
  const { data } = await api.post<SubscribeResponse>('/newsletter/subscribe', { email });
  return data.message;
};