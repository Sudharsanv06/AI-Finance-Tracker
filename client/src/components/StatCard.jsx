export default function StatCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  trendValue,
  highlight = false,
}) {
  return (
    <div className={`card card-hover p-5 animate-fadeIn ${
      highlight ? 'border-red-300 bg-red-50' : ''
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center
                        justify-center text-xl
                        ${highlight ? 'bg-red-100' : 'bg-teal-50'}`}>
          {icon}
        </div>

        {/* Trend indicator */}
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
            trend === 'up'
              ? 'bg-green-100 text-green-700'
              : trend === 'down'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}{' '}
            {trendValue}
          </span>
        )}
      </div>

      {/* Value */}
      <p className={`text-2xl font-bold font-playfair mb-1 ${
        highlight ? 'text-red-600' : 'text-teal'
      }`}>
        {value}
      </p>

      {/* Title */}
      <p className="text-sm font-semibold text-teal-500">{title}</p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-teal-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}