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
    <div className="w-full group">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-app-text-primary mb-2 group-focus-within:text-app-accent transition-colors"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted group-focus-within:text-app-accent transition-colors pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full appearance-none rounded-xl border
            ${error ? 'border-app-danger' : 'border-app-border'}
            bg-app-bg-secondary px-4 py-3.5
            text-sm text-app-text-primary placeholder:text-app-text-muted
            focus:outline-none focus:ring-2 focus:ring-app-accent/20
            focus:border-app-accent transition-all
            ${leftIcon ? 'pl-12' : ''}
            ${rightIcon ? 'pr-12' : ''}
            ${className}
          `}
          {...rest}
        />
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-app-text-muted">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs text-app-danger flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-app-danger"></div>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-2 text-xs text-app-text-muted flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-app-text-muted/50"></div>
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;
