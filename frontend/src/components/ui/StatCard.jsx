import { TrendingUp, TrendingDown } from 'lucide-react';

const colorMap = {
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  green: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  accent: 'bg-app-accent-light text-app-accent-dark',
};

const StatCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
  return (
    <div className="rounded-2xl border border-app-border bg-app-bg-secondary shadow-sm p-5 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-app-text-secondary mb-1 truncate">{title}</p>
        <p className="text-2xl md:text-3xl font-display font-semibold text-app-text-primary">
          {value}
        </p>
        {trend && (
          <div
            className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${
              trend.direction === 'up'
                ? 'text-app-success'
                : 'text-app-danger'
            }`}
          >
            {trend.direction === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
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
          <Icon size={22} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
