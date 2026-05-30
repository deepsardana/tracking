import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { useCustomers } from '../api/customers';
import { useBillConfig } from '../api/bills';
import { calculateBillTotals } from '../lib/billing';

export interface BillFormValues {
  customerId: string;
  billDate: string;
  deviceId: string;
  vehicleId: string;
  notes?: string;
  items: { description: string; quantity: number; unitPrice: number }[];
}

interface BillFormProps {
  initialValues?: Partial<BillFormValues>;
  onSubmit: (values: BillFormValues) => Promise<void> | void;
  submitLabel?: string;
}

const defaultItem = { description: '', quantity: 1, unitPrice: 0 };

export function BillForm({ initialValues, onSubmit, submitLabel = 'Save Bill' }: BillFormProps) {
  const { data: customers } = useCustomers();
  const { data: config } = useBillConfig();
  const gstPercent = config?.gstPercent ?? 18;

  const { register, control, handleSubmit, formState: { isSubmitting } } = useForm<BillFormValues>({
    defaultValues: {
      customerId: '',
      billDate: new Date().toISOString().slice(0, 10),
      deviceId: 'PDD',
      vehicleId: 'HR73',
      notes: '',
      items: [{ description: 'GPS device & installation', quantity: 1, unitPrice: 0 }],
      ...initialValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = useWatch({ control, name: 'items' }) ?? [];
  const totals = calculateBillTotals(
    watchedItems.map((row) => ({
      description: row?.description ?? '',
      quantity: Number(row?.quantity) || 0,
      unitPrice: Number(row?.unitPrice) || 0,
    })),
    gstPercent,
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
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
        <div>
          <label className="block text-sm font-medium text-gray-700">Bill Date</label>
          <input
            type="date"
            {...register('billDate', { required: true })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div />
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
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Line Items</label>
          <button
            type="button"
            onClick={() => append({ ...defaultItem })}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <Plus size={14} />
            Add item
          </button>
        </div>
        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 font-medium">Description</th>
                <th className="text-right p-2 font-medium w-20">Qty</th>
                <th className="text-right p-2 font-medium w-28">Rate (₹)</th>
                <th className="text-right p-2 font-medium w-24">Amount</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const line = totals.lines[index];
                return (
                  <tr key={field.id} className="border-t border-gray-100">
                    <td className="p-2">
                      <input
                        {...register(`items.${index}.description`, { required: true })}
                        className="w-full border border-gray-300 rounded px-2 py-1"
                        placeholder="Item description"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.quantity`, { required: true, valueAsNumber: true })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.unitPrice`, { required: true, valueAsNumber: true })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                      />
                    </td>
                    <td className="p-2 text-right text-gray-700">
                      ₹{line?.amount.toFixed(2) ?? '0.00'}
                    </td>
                    <td className="p-2">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-50 rounded p-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>₹{totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">GST ({gstPercent}% — fixed)</span>
          <span>₹{totals.gstAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base border-t border-gray-200 pt-2 mt-2">
          <span>Total</span>
          <span>₹{totals.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          {...register('notes')}
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
