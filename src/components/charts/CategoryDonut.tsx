import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts'

export function CategoryDonut({
  data,
  onSelect,
}: {
  data: Array<{ name: string; value: number; color: string }>
  onSelect: (name: string | null) => void
}) {
  return (
    <div className="h-72 rounded-[28px] bg-white p-4 shadow-sm dark:bg-stone-900">
      <h3 className="mb-3 font-semibold text-stone-900 dark:text-stone-50">Category breakdown</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} onClick={(payload) => onSelect(String(payload.name))}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <button className="text-sm text-emerald-700" onClick={() => onSelect(null)}>
        Clear filter
      </button>
    </div>
  )
}
