import { useQuery } from '@tanstack/react-query';
import { api } from './axios';

export interface DashboardSummary {
  customerCount: number;
  totalDR: number;
  totalCR: number;
  netBalance: number;
  availableDevices: number;
  soldDevices: number;
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async (): Promise<DashboardSummary> => {
      const { data } = await api.get<DashboardSummary>('/dashboard/summary');
      return data;
    },
  });
}
