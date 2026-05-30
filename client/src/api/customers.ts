import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './axios';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  totalDR: number;
  totalCR: number;
  balance: number;
}

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async (): Promise<Customer[]> => {
      const { data } = await api.get<Customer[]>('/customers');
      return data;
    },
  });
}

export function useCustomerSummary() {
  return useQuery({
    queryKey: ['customers', 'summary'],
    queryFn: async (): Promise<CustomerSummary[]> => {
      const { data } = await api.get<CustomerSummary[]>('/customers/summary');
      return data;
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; phone: string }) => {
      const { data } = await api.post<Customer>('/customers', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name: string; phone: string }) => {
      const { id, ...rest } = input;
      const { data } = await api.put<Customer>(`/customers/${id}`, rest);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
