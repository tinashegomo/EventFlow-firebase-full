import { TrendingUp, TrendingDown } from 'lucide-react';

const colorMap = {
  blue: 'bg-blue-50 text-blue-700 border border-blue-200',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200',
  red: 'bg-red-50 text-red-700 border border-red-200',
  green: 'bg-green-50 text-green-700 border border-green-200',
  purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  accent: 'bg-app-accent-light text-app-accent-dark border border-app-accent',
};

const StatCard = ({ title, value, icon: Icon, trend, color = 'blue', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl border border-app-border bg-app-bg-secondary
        shadow-sm p-5 flex items-start justify-between gap-4
        ${onClick ? 'cursor-pointer card-hover' : ''}
      `}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-app-text-secondary mb-2">{title}</p>
        <p className="text-3xl md:text-4xl font-display font-bold text-app-text-primary">
          {value}
        </p>
        {trend && (
          <div
            className={`mt-3 inline-flex items-center gap-1 text-sm font-semibold ${
              trend.direction === 'up'
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}
          >
            {trend.direction === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>
              {trend.value} {trend.label}
            </span>
          </div>
        )}
      </div>
      {Icon && (
        <div
          className={`p-3 rounded-xl flex-shrink-0 ${colorMap[color] || colorMap.blue}`}
        >
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
