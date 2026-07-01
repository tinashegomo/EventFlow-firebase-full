import { useId } from 'react';

const Input = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...rest
}) => {
  const reactId = useId();
  const inputId = id || `input-${reactId}`;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-app-text-primary mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full appearance-none rounded-xl border ${error ? 'border-app-danger' : 'border-app-border'} bg-app-bg-secondary px-4 py-2.5 text-sm text-app-text-primary placeholder:text-app-text-muted focus:outline-none focus:ring-2 focus:ring-app-accent transition ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
          {...rest}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-muted">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-app-danger">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-app-text-muted">{hint}</p>
      )}
    </div>
  );
};

export default Input;
