const Badge = ({ status, className = '' }) => {
  const map = {
    SCHEDULED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    COMPLETED: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    SENT: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    PAID: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    OVERDUE: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    CONVERTED: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    REJECTED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    ACCEPTED: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    ADMIN: 'bg-app-accent-light text-app-accent-dark',
    STAFF: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    UNPAID: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    PARTIAL: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    PROMOTED: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    DEMOTED: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    PAYMENT_RECORDED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    UPDATED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    CREATED: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    DELETED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };
  const cls = map[status] || 'bg-gray-100 text-gray-600';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}
    >
      {String(status).replace(/_/g, ' ')}
    </span>
  );
};

export default Badge;
