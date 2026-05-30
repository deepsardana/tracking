import { useRef, useState } from 'react';
import { Upload, Download, Trash2, Search, Package } from 'lucide-react';
import {
  useInventory,
  useImportInventory,
  useDeleteInventoryDevice,
  exportInventoryExcel,
  InventoryDevice,
} from '../api/inventory';

export function InventoryPage() {
  const [status, setStatus] = useState<'ALL' | 'AVAILABLE' | 'BILLED'>('ALL');
  const [search, setSearch] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const filters = {
    status: status === 'ALL' ? undefined : status,
    q: search.trim() || undefined,
  };
  const { data, isLoading, isError } = useInventory(filters);
  const importMut = useImportInventory();
  const deleteMut = useDeleteInventoryDevice();

  const handleImport = async (file: File) => {
    setImportMessage(null);
    try {
      const result = await importMut.mutateAsync(file);
      setImportMessage(
        `Imported ${result.imported}, updated ${result.updated}, skipped ${result.skipped} of ${result.total} rows.`,
      );
      if (result.errors.length > 0) {
        setImportMessage((prev) => `${prev} First issues: ${result.errors.slice(0, 3).join('; ')}`);
      }
    } catch (err) {
      setImportMessage(err instanceof Error ? err.message : 'Import failed');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = (device: InventoryDevice) => {
    if (device.status === 'BILLED') return;
    if (confirm(`Remove ${device.vltdSerialNo} from inventory?`)) {
      deleteMut.mutate(device.id);
    }
  };

  if (isLoading) return <div className="p-6">Loading inventory...</div>;
  if (isError) return <div className="p-6 text-red-600">Failed to load device inventory.</div>;

  const devices = data ?? [];
  const availableCount = devices.filter((d) => d.status === 'AVAILABLE').length;
  const billedCount = devices.filter((d) => d.status === 'BILLED').length;

  return (
    <div className="p-6">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package size={24} />
            Device Inventory
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload your Sunil/DRG device list (.xlsx, .csv, or .txt). Bills pick serial &amp; IMEI from here automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={importMut.isPending}
            className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            <Upload size={16} />
            {importMut.isPending ? 'Importing...' : 'Import Excel / TXT'}
          </button>
          <button
            type="button"
            onClick={() => exportInventoryExcel()}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <Download size={16} />
            Export Excel
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
            }}
          />
        </div>
      </div>

      {importMessage && (
        <div className="mb-4 text-sm bg-blue-50 border border-blue-200 text-blue-900 rounded p-3">{importMessage}</div>
      )}

      <div className="bg-white rounded shadow border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Search serial / IMEI / device no</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="DRG1T1A..."
              className="w-full border border-gray-300 rounded pl-9 pr-3 py-2 text-sm font-mono"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="ALL">All ({devices.length})</option>
            <option value="AVAILABLE">Available ({availableCount})</option>
            <option value="BILLED">Billed ({billedCount})</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded shadow border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3 text-sm font-semibold">VLTD Serial No</th>
              <th className="text-left p-3 text-sm font-semibold">IMEI</th>
              <th className="text-left p-3 text-sm font-semibold">Device</th>
              <th className="text-left p-3 text-sm font-semibold">Status</th>
              <th className="text-left p-3 text-sm font-semibold">Bill / Vehicle</th>
              <th className="text-right p-3 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500 text-sm">
                  No devices yet. Import your Sunil DRG qty file (.txt or Excel) to get started.
                </td>
              </tr>
            ) : (
              devices.map((device) => (
                <tr key={device.id} className="border-t border-gray-200">
                  <td className="p-3 font-mono text-sm">{device.vltdSerialNo}</td>
                  <td className="p-3 font-mono text-sm">{device.imeiNo}</td>
                  <td className="p-3 text-sm">{device.deviceNo ?? '—'}</td>
                  <td className="p-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        device.status === 'AVAILABLE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {device.status === 'AVAILABLE' ? 'Available' : 'Billed'}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    {device.bill ? (
                      <div>
                        <div className="font-mono">{device.bill.invoiceNo}</div>
                        <div className="text-gray-500">{device.bill.vehicleId}</div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {device.status === 'AVAILABLE' && (
                      <button
                        type="button"
                        onClick={() => handleDelete(device)}
                        title="Remove from inventory"
                        className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
