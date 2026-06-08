import { getUtilization } from '../utils/helpers';

export default function BudgetRing({
  spent,
  total,
  size = 80,
}) {
  const pct         = getUtilization(spent, total);
  const radius      = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset      = circumference - (pct / 100) * circumference;

  const color =
    pct >= 90 ? '#dc2626' :
    pct >= 70 ? '#d97706' :
                '#004643';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E0D5"
          strokeWidth="8"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>

      {/* Percentage text */}
      <span
        className="text-xs font-bold font-playfair"
        style={{ color }}
      >
        {pct}%
      </span>
    </div>
  );
}