import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts'

export function MonthlyBarChart({ data }: { data: Array<{ label: string; amount: number; color: string }> }) {
  return (
    <div className="h-64 rounded-[28px] bg-white p-4 shadow-sm dark:bg-stone-900">
      <h3 className="mb-3 font-semibold text-stone-900 dark:text-stone-50">Monthly spending</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis hide />
          <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
