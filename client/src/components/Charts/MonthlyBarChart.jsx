import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-white">
        ₹{Number(payload[0].value).toLocaleString('en-IN')}
      </p>
    </div>
  );
};

export default function MonthlyBarChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm">
        <span className="text-3xl mb-2">📊</span>
        No monthly data yet
      </div>
    );
  }

  // Highlight the highest bar
  const maxVal = Math.max(...data.map((d) => d.amount ?? d.value ?? 0));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
        barCategoryGap="30%"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.05)"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
          }
          width={48}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'rgba(99,102,241,0.08)', radius: 6 }}
        />
        <Bar
          dataKey={data[0]?.amount !== undefined ? 'amount' : 'value'}
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        >
          {data.map((entry, i) => {
            const val = entry.amount ?? entry.value ?? 0;
            const isTop = val === maxVal;
            return (
              <Cell
                key={i}
                fill={isTop ? '#6366f1' : 'rgba(99,102,241,0.35)'}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}