import { useId } from 'react';

const Textarea = ({ label, error, hint, className = '', id, ...rest }) => {
  const reactId = useId();
  const inputId = id || `textarea-${reactId}`;
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
      <textarea
        id={inputId}
        className={`
          w-full appearance-none rounded-xl border
          ${error ? 'border-app-danger' : 'border-app-border'}
          bg-app-bg-secondary px-4 py-3.5
          text-sm text-app-text-primary placeholder:text-app-text-muted
          focus:outline-none focus:ring-2 focus:ring-app-accent/20
          focus:border-app-accent transition-all
          min-h-[120px] resize-y
          ${className}
        `}
        {...rest}
      />
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

export default Textarea;
