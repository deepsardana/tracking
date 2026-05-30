interface StatCardProps {
  label: string;
  value: string | number;
  color?: 'default' | 'red' | 'green' | 'blue';
}

const colorMap = {
  default: { border: 'border-gray-200', value: 'text-gray-800', bar: '' },
  red:     { border: 'border-red-200',  value: 'text-red-600',  bar: 'bg-red-500' },
  green:   { border: 'border-green-200',value: 'text-green-600',bar: 'bg-green-500' },
  blue:    { border: 'border-blue-200', value: 'text-blue-600', bar: 'bg-blue-500' },
};

export function StatCard({ label, value, color = 'default' }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`bg-white rounded shadow border ${c.border} overflow-hidden`}>
      {c.bar && <div className={`h-1 ${c.bar}`} />}
      <div className="p-4">
        <div className="text-sm text-gray-500">{label}</div>
        <div className={`text-2xl font-bold mt-1 ${c.value}`}>{value}</div>
      </div>
    </div>
  );
}
