import { Link } from 'react-router-dom';
import { useCustomerSummary } from '../api/customers';

export function CustomerSummaryPage() {
  const { data, isLoading, isError } = useCustomerSummary();

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError) return <div className="p-6 text-red-600">Failed to load summary.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Customer Summary</h1>
      <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3 text-sm font-semibold">Name</th>
              <th className="text-left p-3 text-sm font-semibold">Phone</th>
              <th className="text-right p-3 text-sm font-semibold">Total DR</th>
              <th className="text-right p-3 text-sm font-semibold">Total CR</th>
              <th className="text-right p-3 text-sm font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {data!.map((c) => (
              <tr key={c.id} className="border-t border-gray-200">
                <td className="p-3">
                  <Link
                    to={`/transactions?customerId=${c.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3 text-right font-medium text-red-600">{c.totalDR.toFixed(2)}</td>
                <td className="p-3 text-right font-medium text-green-600">{c.totalCR.toFixed(2)}</td>
                <td className={`p-3 text-right font-semibold ${c.balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {c.balance.toFixed(2)}
                </td>
              </tr>
            ))}
            {data!.length === 0 && (
              <tr>
                <td colSpan={5} className="p-3 text-center text-gray-500">No customers yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
