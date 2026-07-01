const PageHeader = ({ title, subtitle, actions, breadcrumbs, stats }) => {
  return (
    <div className="mb-8">
      {breadcrumbs && (
        <nav className="flex mb-4 text-sm text-app-text-muted">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <div className="mx-2 text-app-text-muted/50">/</div>}
              <span className={index === breadcrumbs.length - 1 ? 'text-app-text-primary font-medium' : ''}>{crumb}</span>
            </div>
          ))}
        </nav>
      )}
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-app-text-primary mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-app-text-secondary max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-app-surface rounded-xl p-5 border border-app-border hover:shadow-lg transition-all">
              <p className="text-sm text-app-text-secondary mb-2">{stat.label}</p>
              <p className="text-2xl font-bold text-app-text-primary">{stat.value}</p>
              {stat.change && (
                <p className={`text-xs mt-2 ${stat.change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stat.change > 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
