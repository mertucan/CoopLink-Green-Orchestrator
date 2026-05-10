export default function StatCard({ title, value, unit, icon: Icon }) {
  return (
    <section className="panel p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-moss">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">
            {value}
            {unit && <span className="ml-1 text-base font-medium text-moss">{unit}</span>}
          </p>
        </div>
        {Icon && <Icon className="text-leaf" size={24} />}
      </div>
    </section>
  )
}

