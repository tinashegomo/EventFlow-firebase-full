const Badge = ({ status, className = '' }) => {
  const map = {
    SCHEDULED: 'bg-blue-50 text-blue-700 border border-blue-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border border-amber-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    CANCELLED: 'bg-gray-100 text-gray-600 border border-gray-300',
    DRAFT: 'bg-gray-100 text-gray-600 border border-gray-300',
    SENT: 'bg-blue-50 text-blue-700 border border-blue-200',
    PAID: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    OVERDUE: 'bg-red-50 text-red-700 border border-red-200',
    CONVERTED: 'bg-purple-50 text-purple-700 border border-purple-200',
    REJECTED: 'bg-red-50 text-red-700 border border-red-200',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    ADMIN: 'bg-app-accent-light text-app-accent-dark border border-app-accent',
    STAFF: 'bg-gray-100 text-gray-600 border border-gray-300',
    UNPAID: 'bg-red-50 text-red-700 border border-red-200',
    PARTIAL: 'bg-amber-50 text-amber-700 border border-amber-200',
    PROMOTED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    DEMOTED: 'bg-amber-50 text-amber-700 border border-amber-200',
    PAYMENT_RECORDED: 'bg-green-50 text-green-700 border border-green-200',
    UPDATED: 'bg-blue-50 text-blue-700 border border-blue-200',
    CREATED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    DELETED: 'bg-red-50 text-red-700 border border-red-200',
  };
  const cls = map[status] || 'bg-gray-100 text-gray-600 border border-gray-300';
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5
        rounded-full text-xs font-medium
        transition-all duration-200
        ${cls}
        ${className}
      `}
    >
      {String(status).replace(/_/g, ' ')}
    </span>
  );
};

export default Badge;
