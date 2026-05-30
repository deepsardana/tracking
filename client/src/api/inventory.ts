import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './axios';

export type DeviceStatus = 'AVAILABLE' | 'BILLED';

export interface InventoryDevice {
  id: string;
  vltdSerialNo: string;
  imeiNo: string;
  deviceNo: string | null;
  iccid: string | null;
  qrCode: string | null;
  billingCompany: string | null;
  dispatchCustomer: string | null;
  pcba: string | null;
  dispatchHex: string | null;
  scanBy: string | null;
  status: DeviceStatus;
  bill?: {
    id: string;
    invoiceNo: string;
    vehicleId: string;
    billDate: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryFilters {
  status?: DeviceStatus;
  q?: string;
}

export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  total: number;
  errors: string[];
}

export function useInventory(filters: InventoryFilters = {}) {
  return useQuery({
    queryKey: ['inventory', filters],
    queryFn: async (): Promise<InventoryDevice[]> => {
      const { data } = await api.get<InventoryDevice[]>('/inventory', { params: filters });
      return data;
    },
  });
}

export function useAvailableDevices() {
  return useInventory({ status: 'AVAILABLE' });
}

export function useImportInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<ImportResult> => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<ImportResult>('/inventory/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}

export function useDeleteInventoryDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/inventory/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}

export async function exportInventoryExcel() {
  const { data } = await api.get<Blob>('/inventory/export', { responseType: 'blob' });
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `drg-device-inventory-${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
