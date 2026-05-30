import { Link } from 'react-router-dom';
import { useDashboardSummary } from '../api/dashboard';
import { useCustomerSummary } from '../api/customers';
import { StatCard } from '../components/StatCard';
import { DrCrPieChart } from '../components/DrCrPieChart';

export function DashboardPage() {
  const summaryQuery = useDashboardSummary();
  const customerSummaryQuery = useCustomerSummary();

  if (summaryQuery.isLoading || customerSummaryQuery.isLoading) {
    return <div className="p-6">Loading...</div>;
  }
  if (summaryQuery.isError || customerSummaryQuery.isError) {
    return <div className="p-6 text-red-600">Failed to load dashboard.</div>;
  }

  const summary = summaryQuery.data!;
  const customers = customerSummaryQuery.data!;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Customers" value={summary.customerCount} color="blue" />
        <StatCard label="Total DR" value={summary.totalDR.toFixed(2)} color="red" />
        <StatCard label="Total CR" value={summary.totalCR.toFixed(2)} color="green" />
        <StatCard label="Net Balance" value={summary.netBalance.toFixed(2)} color={summary.netBalance >= 0 ? 'red' : 'green'} />
      </div>

      <div className="grid grid-cols-3 gap-6 items-start">
        {/* Pie chart */}
        <div className="bg-white rounded shadow border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">DR vs CR Breakdown</h2>
          <p className="text-xs text-gray-400 mb-4">Total volume by transaction type</p>
          <DrCrPieChart totalDR={summary.totalDR} totalCR={summary.totalCR} />
        </div>

        {/* Customer summary table */}
        <div className="col-span-2 bg-white rounded shadow border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-600">Customer Summary</h2>
          </div>
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
              {customers.map((c) => (
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
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-gray-500">No customers yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
