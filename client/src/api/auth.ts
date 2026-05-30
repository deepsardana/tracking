import { api } from './axios';

export async function loginRequest(email: string, password: string): Promise<string> {
  const { data } = await api.post<{ token: string }>('/auth/login', { email, password });
  return data.token;
}
