import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface DrCrPieChartProps {
  totalDR: number;
  totalCR: number;
}

const DR_COLOR = '#dc2626'; // red-600
const CR_COLOR = '#16a34a'; // green-600

export function DrCrPieChart({ totalDR, totalCR }: DrCrPieChartProps) {
  const total = totalDR + totalCR;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 text-sm">
        <div className="w-24 h-24 rounded-full border-4 border-dashed border-gray-200" />
        <span>No transactions yet</span>
      </div>
    );
  }

  const drPct = (totalDR / total) * 100;
  const crPct = (totalCR / total) * 100;

  const data = [
    { name: 'Withdrawal (DR)', value: totalDR },
    { name: 'Credit (CR)',     value: totalCR },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Donut */}
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="45%"
              outerRadius="72%"
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill={DR_COLOR} />
              <Cell fill={CR_COLOR} />
            </Pie>
            <Tooltip
              formatter={(value: number) => value.toFixed(2)}
              contentStyle={{ fontSize: 13, borderRadius: 6, border: '1px solid #e5e7eb' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend + percentages — rendered in DOM, never clips */}
      <div className="flex justify-center gap-6 w-full">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: DR_COLOR }} />
            <span className="text-xs text-gray-500">Withdrawal (DR)</span>
          </div>
          <span className="text-sm font-semibold text-red-600">{drPct.toFixed(1)}%</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: CR_COLOR }} />
            <span className="text-xs text-gray-500">Credit (CR)</span>
          </div>
          <span className="text-sm font-semibold text-green-600">{crPct.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
