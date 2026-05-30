import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './axios';

export type TransactionType = 'DR' | 'CR';
export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';

export interface Transaction {
  id: string;
  customerId: string;
  customer: { id: string; name: string };
  type: TransactionType;
  amount: string;
  date: string;
  description: string | null;
  paymentMode: PaymentMode;
  deviceId: string;
  vehicleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  customerId?: string;
  type?: TransactionType;
  from?: string;
  to?: string;
}

export interface TransactionInput {
  customerId: string;
  type: TransactionType;
  amount: number;
  date: string;
  description?: string;
  paymentMode: PaymentMode;
  deviceId: string;
  vehicleId: string;
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async (): Promise<Transaction[]> => {
      const { data } = await api.get<Transaction[]>('/transactions', { params: filters });
      return data;
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransactionInput) => {
      const { data } = await api.post<Transaction>('/transactions', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['customers', 'summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string } & Partial<TransactionInput>) => {
      const { id, ...rest } = input;
      const { data } = await api.put<Transaction>(`/transactions/${id}`, rest);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['customers', 'summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transactions/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['customers', 'summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
