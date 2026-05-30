import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Plus, Trash2, FileText } from 'lucide-react';
import { useCustomers } from '../api/customers';
import { useBillConfig } from '../api/bills';
import { useAvailableDevices } from '../api/inventory';
import { calculateBillTotals, roundMoney } from '../lib/billing';
import { DEFAULT_LINE_ITEM, newBillDefaults } from '../lib/billTemplate';
import { HK_APP } from '../lib/company';

export interface BillLineFormValues {
  description: string;
  hsn: string;
  quantity: number;
  per: string;
  unitPrice: number;
  rateInclTax: number;
  discPercent: number;
}

export interface BillFormValues {
  customerId: string;
  billDate: string;
  invoiceNo: string;
  vehicleId: string;
  vltdSerialNo: string;
  vltdImeiNo: string;
  inventoryDeviceId?: string | null;
  notes?: string;
  items: BillLineFormValues[];
}

interface BillFormProps {
  initialValues?: Partial<BillFormValues>;
  onSubmit: (values: BillFormValues) => Promise<void> | void;
  submitLabel?: string;
}

export function BillForm({ initialValues, onSubmit, submitLabel = 'Save Bill' }: BillFormProps) {
  const { data: customers } = useCustomers();
  const { data: config } = useBillConfig();
  const { data: availableDevices } = useAvailableDevices();
  const gstPercent = config?.gstPercent ?? 18;

  const { register, control, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<BillFormValues>({
    defaultValues: {
      customerId: '',
      billDate: new Date().toISOString().slice(0, 10),
      notes: '',
      inventoryDeviceId: null,
      ...newBillDefaults(),
      ...initialValues,
    },
  });

  const selectedDeviceId = watch('inventoryDeviceId');

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = useWatch({ control, name: 'items' }) ?? [];
  const totals = calculateBillTotals(
    watchedItems.map((row) => ({
      description: row?.description ?? '',
      hsn: row?.hsn ?? '85269190',
      quantity: Number(row?.quantity) || 0,
      per: row?.per ?? 'PCS',
      unitPrice: Number(row?.unitPrice) || 0,
      rateInclTax: Number(row?.rateInclTax) || 0,
      discPercent: Number(row?.discPercent) || 0,
    })),
    gstPercent,
  );

  const applyDefaultTemplate = () => {
    const defaults = config?.defaultBill
      ? {
          invoiceNo: config.defaultBill.invoiceNo,
          vehicleId: config.defaultBill.vehicleId,
          vltdSerialNo: config.defaultBill.vltdSerialNo,
          vltdImeiNo: config.defaultBill.vltdImeiNo,
          inventoryDeviceId: null,
          items: config.defaultBill.items,
        }
      : { ...newBillDefaults(), inventoryDeviceId: null };
    reset((current) => ({ ...current, ...defaults }));
  };

  const pickerDevices = [
    ...(initialValues?.inventoryDeviceId && initialValues.vltdSerialNo
      ? [{
          id: initialValues.inventoryDeviceId,
          vltdSerialNo: initialValues.vltdSerialNo,
          imeiNo: initialValues.vltdImeiNo ?? '',
          deviceNo: null,
        }]
      : []),
    ...(availableDevices ?? []),
  ].filter((device, index, list) => list.findIndex((d) => d.id === device.id) === index);

  const handleDeviceSelect = (deviceId: string) => {
    if (!deviceId) {
      setValue('inventoryDeviceId', null);
      return;
    }
    const device = pickerDevices.find((d) => d.id === deviceId);
    if (!device) return;
    setValue('inventoryDeviceId', device.id);
    setValue('vltdSerialNo', device.vltdSerialNo);
    setValue('vltdImeiNo', device.imeiNo);
  };

  const syncLineFromIncl = (index: number, value: number) => {
    const incl = Number(value) || 0;
    setValue(`items.${index}.rateInclTax`, incl);
    if (incl > 0) {
      setValue(`items.${index}.unitPrice`, roundMoney(incl / (1 + gstPercent / 100)));
    }
  };

  const syncLineFromTaxable = (index: number, value: number) => {
    const taxable = Number(value) || 0;
    setValue(`items.${index}.unitPrice`, taxable);
    if (taxable > 0) {
      setValue(`items.${index}.rateInclTax`, roundMoney(taxable * (1 + gstPercent / 100)));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded p-3 gap-2">
        <p className="text-sm text-blue-900">
          {HK_APP.shortName} tax invoice. Use one line per vehicle / serial / IMEI when billing multiple devices.
        </p>
        <button type="button" onClick={applyDefaultTemplate} className="flex items-center gap-1 text-sm text-blue-700 font-medium shrink-0">
          <FileText size={14} />
          Reset template
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Customer (records only)</label>
          <select {...register('customerId', { required: true })} className="w-full border border-gray-300 rounded px-3 py-2">
            <option value="">Select customer</option>
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Invoice No</label>
          <input {...register('invoiceNo', { required: true })} className="w-full border border-gray-300 rounded px-3 py-2 font-mono" placeholder="HKT/042/26-27" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Dated</label>
          <input type="date" {...register('billDate', { required: true })} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Device from inventory</label>
          <select
            value={selectedDeviceId ?? ''}
            onChange={(e) => handleDeviceSelect(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
          >
            <option value="">— Select available device —</option>
            {pickerDevices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.vltdSerialNo} · IMEI {device.imeiNo}
                {device.deviceNo ? ` · ${device.deviceNo}` : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Pick a device to auto-fill VLTD Serial &amp; IMEI on the bill. Status syncs to inventory when saved.
          </p>
          <input type="hidden" {...register('inventoryDeviceId')} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Consignee / Buyer (Vehicle Reg No on bill) <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea {...register('vehicleId')} rows={2} className="w-full border border-gray-300 rounded px-3 py-2 font-mono uppercase" placeholder="e.g. HR73B5666&#10;HR73B5667 — leave blank to skip" />
          <p className="text-xs text-gray-500 mt-1">One vehicle per line for multiple quantity bills.</p>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">VLTD Serial No <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea {...register('vltdSerialNo')} rows={2} placeholder="One serial per line; leave blank to skip on printed bill" className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">VLTD IMEI No <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea {...register('vltdImeiNo')} rows={2} placeholder="One IMEI per line; leave blank to skip on printed bill" className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm" />
          <p className="text-xs text-gray-500 mt-1">Pick from inventory to auto-fill one device, or enter multiple lines manually.</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Goods table (same columns as printed bill)</label>
          <button type="button" onClick={() => append({ ...DEFAULT_LINE_ITEM })} className="flex items-center gap-1 text-sm text-blue-600">
            <Plus size={14} />
            Add row
          </button>
        </div>
        <div className="border border-gray-200 rounded overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-center w-8">Sl</th>
                <th className="p-2 text-left min-w-[140px]">Description of Goods</th>
                <th className="p-2 w-24">HSN/SAC</th>
                <th className="p-2 w-14">Qty</th>
                <th className="p-2 w-24">Final Price<br/>(Incl. GST)</th>
                <th className="p-2 w-24">Taxable Rate</th>
                <th className="p-2 w-14">per</th>
                <th className="p-2 w-14">Disc %</th>
                <th className="p-2 w-24">Amount</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const line = totals.lines[index];
                return (
                  <tr key={field.id} className="border-t border-gray-100">
                    <td className="p-1 text-center text-gray-600">{index + 1}</td>
                    <td className="p-1">
                      <input {...register(`items.${index}.description`, { required: true })} className="w-full border border-gray-300 rounded px-1 py-1" />
                    </td>
                    <td className="p-1">
                      <input {...register(`items.${index}.hsn`)} className="w-full border border-gray-300 rounded px-1 py-1 font-mono" />
                    </td>
                    <td className="p-1">
                      <input type="number" step="0.01" min="0" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="w-full border border-gray-300 rounded px-1 py-1 text-right" />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.rateInclTax`, {
                          valueAsNumber: true,
                          onChange: (e) => syncLineFromIncl(index, Number(e.target.value)),
                        })}
                        className="w-full border border-gray-300 rounded px-1 py-1 text-right"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line?.unitPrice ?? watchedItems[index]?.unitPrice ?? ''}
                        onChange={(e) => syncLineFromTaxable(index, Number(e.target.value))}
                        className="w-full border border-gray-300 rounded px-1 py-1 text-right"
                      />
                    </td>
                    <td className="p-1">
                      <input {...register(`items.${index}.per`)} className="w-full border border-gray-300 rounded px-1 py-1 text-center" />
                    </td>
                    <td className="p-1">
                      <input type="number" step="0.01" min="0" {...register(`items.${index}.discPercent`, { valueAsNumber: true })} className="w-full border border-gray-300 rounded px-1 py-1 text-right" />
                    </td>
                    <td className="p-1 text-right font-medium">₹{line?.amount.toFixed(2) ?? '0.00'}</td>
                    <td className="p-1">
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(index)} className="text-gray-400 hover:text-red-600">
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
        <div className="flex justify-between"><span>Taxable (Amount)</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>GST ({gstPercent}%)</span><span>₹{totals.gstAmount.toFixed(2)}</span></div>
        <div className="flex justify-between font-semibold border-t pt-2"><span>Grand Total</span><span>₹{totals.totalAmount.toFixed(2)}</span></div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Remarks</label>
        <textarea {...register('notes')} rows={2} className="w-full border border-gray-300 rounded px-3 py-2" />
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
