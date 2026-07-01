import Button from './Button';

const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="mb-4 p-4 rounded-full bg-app-bg-tertiary text-app-text-muted">
          <Icon size={32} />
        </div>
      )}
      <h3 className="text-lg font-display font-semibold text-app-text-primary mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-app-text-secondary max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="primary" leftIcon={action.icon}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
