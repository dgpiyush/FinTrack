import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function DailyLineChart({
  data,
  budgetPerDay,
}: {
  data: Array<{ day: string; amount: number }>
  budgetPerDay: number
}) {
  return (
    <div className="h-64 rounded-[28px] bg-white p-4 shadow-sm dark:bg-stone-900">
      <h3 className="mb-3 font-semibold text-stone-900 dark:text-stone-50">Daily spending</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip />
          <ReferenceLine y={budgetPerDay} stroke="#f59e0b" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="amount" stroke="#0f6e56" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
