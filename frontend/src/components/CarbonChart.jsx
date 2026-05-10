import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const fallback = [
  { day: 'Pzt', kg: 1.2 },
  { day: 'Sal', kg: 2.4 },
  { day: 'Çar', kg: 1.8 },
  { day: 'Per', kg: 3.1 },
  { day: 'Cum', kg: 4.2 },
  { day: 'Cmt', kg: 2.7 },
  { day: 'Paz', kg: 3.6 }
]

export default function CarbonChart({ data = fallback }) {
  return (
    <section className="panel h-80 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ink">Haftalık CO2 tasarrufu</h2>
        <p className="text-sm text-moss">Optimize takas ve rota etkisi</p>
      </div>
      <ResponsiveContainer width="100%" height="78%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dfe8df" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="kg" fill="#2f8f5b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}

