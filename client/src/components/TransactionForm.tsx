import { useForm } from 'react-hook-form';
import { useCustomers } from '../api/customers';
import { TransactionType, PaymentMode } from '../api/transactions';

export interface TransactionFormValues {
  customerId: string;
  type: TransactionType;
  amount: number;
  date: string;
  description?: string;
  paymentMode: PaymentMode;
  deviceId: string;
  vehicleId: string;
}

interface TransactionFormProps {
  initialValues?: Partial<TransactionFormValues>;
  onSubmit: (values: TransactionFormValues) => Promise<void> | void;
  submitLabel?: string;
}

export function TransactionForm({ initialValues, onSubmit, submitLabel = 'Save' }: TransactionFormProps) {
  const { data: customers } = useCustomers();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<TransactionFormValues>({
    defaultValues: {
      customerId: '',
      type: 'DR',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      description: '',
      paymentMode: 'CASH',
      deviceId: '',
      vehicleId: '',
      ...initialValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 max-h-[70vh] overflow-y-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700">Customer</label>
        <select
          {...register('customerId', { required: true })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Select customer</option>
          {customers?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            {...register('type', { required: true })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="DR">DR</option>
            <option value="CR">CR</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            step="0.01"
            {...register('amount', { required: true, valueAsNumber: true })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          {...register('date', { required: true })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
        <select
          {...register('paymentMode', { required: true })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="CHEQUE">Cheque</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Device ID</label>
          <input
            {...register('deviceId', { required: true, maxLength: 30 })}
            maxLength={30}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Vehicle ID</label>
          <input
            {...register('vehicleId', { required: true, maxLength: 30 })}
            maxLength={30}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description')}
          rows={2}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
