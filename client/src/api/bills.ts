import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './axios';

export interface BillItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
}

export interface BillCompany {
  name: string;
  address: string;
  phone: string;
  gstin: string;
}

export interface Bill {
  id: string;
  customerId: string;
  customer: { id: string; name: string; phone: string };
  billDate: string;
  invoiceNo: string;
  vehicleId: string;
  vltdSerialNo: string;
  vltdImeiNo: string;
  deviceId: string;
  subtotal: string;
  gstAmount: string;
  totalAmount: string;
  notes: string | null;
  items: BillItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BillFilters {
  customerId?: string;
  from?: string;
  to?: string;
}

export interface BillItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface BillInput {
  customerId: string;
  billDate: string;
  invoiceNo: string;
  vehicleId: string;
  vltdSerialNo: string;
  vltdImeiNo: string;
  notes?: string;
  items: BillItemInput[];
}

export interface BillConfig {
  gstPercent: number;
  company: BillCompany;
  defaultBill: {
    invoiceNo: string;
    vehicleId: string;
    vltdSerialNo: string;
    vltdImeiNo: string;
    items: BillItemInput[];
  };
}

export function useBillConfig() {
  return useQuery({
    queryKey: ['bills', 'config'],
    queryFn: async (): Promise<BillConfig> => {
      const { data } = await api.get<BillConfig>('/bills/config');
      return data;
    },
    staleTime: Infinity,
  });
}

export function useBills(filters: BillFilters) {
  return useQuery({
    queryKey: ['bills', filters],
    queryFn: async (): Promise<Bill[]> => {
      const { data } = await api.get<Bill[]>('/bills', { params: filters });
      return data;
    },
  });
}

export function useCreateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BillInput) => {
      const { data } = await api.post<Bill>('/bills', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bills'] }),
  });
}

export function useUpdateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string } & BillInput) => {
      const { id, ...rest } = input;
      const { data } = await api.put<Bill>(`/bills/${id}`, rest);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bills'] }),
  });
}

export function useDeleteBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/bills/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bills'] }),
  });
}
