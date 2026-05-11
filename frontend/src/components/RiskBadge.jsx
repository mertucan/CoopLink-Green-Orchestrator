export default function RiskBadge({ value = 0, expired = false }) {
  if (expired) {
    return (
      <span className="inline-flex min-w-24 items-center justify-center rounded-md border border-red-300 bg-red-200 px-2 py-1 text-xs font-semibold text-red-800">
        Süresi geçti
      </span>
    )
  }

  const risk = Number(value)
  const config =
    risk >= 0.7
      ? ['bg-red-100 text-red-700 border-red-200', 'Acil']
      : risk >= 0.4
        ? ['bg-amber-100 text-amber-800 border-amber-200', 'Orta']
        : ['bg-emerald-100 text-emerald-700 border-emerald-200', 'Düşük']
  return (
    <span className={`inline-flex min-w-24 items-center justify-center rounded-md border px-2 py-1 text-xs font-semibold ${config[0]}`}>
      {config[1]} · {risk.toFixed(2)}
    </span>
  )
}
