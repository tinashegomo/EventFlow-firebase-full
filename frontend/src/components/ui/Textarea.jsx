import { useId } from 'react';

const Textarea = ({ label, error, hint, className = '', id, ...rest }) => {
  const reactId = useId();
  const inputId = id || `textarea-${reactId}`;
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
      <textarea
        id={inputId}
        className={`w-full appearance-none rounded-xl border ${error ? 'border-app-danger' : 'border-app-border'} bg-app-bg-secondary px-4 py-2.5 text-sm text-app-text-primary placeholder:text-app-text-muted focus:outline-none focus:ring-2 focus:ring-app-accent transition min-h-[100px] resize-y ${className}`}
        {...rest}
      />
      {error && (
        <p className="mt-1.5 text-xs text-app-danger">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-app-text-muted">{hint}</p>
      )}
    </div>
  );
};

export default Textarea;
