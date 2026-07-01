import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({
  label,
  error,
  options = [],
  placeholder = 'Select...',
  className = '',
  id,
  children,
  ...rest
}) => {
  const reactId = useId();
  const selectId = id || `select-${reactId}`;
  return (
    <div className="w-full group">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-app-text-primary mb-2 group-focus-within:text-app-accent transition-colors"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`
            w-full appearance-none rounded-xl border
            ${error ? 'border-app-danger' : 'border-app-border'}
            bg-app-bg-secondary px-4 py-3.5
            text-sm text-app-text-primary
            focus:outline-none focus:ring-2 focus:ring-app-accent/20
            focus:border-app-accent transition-all
            pr-12
            ${className}
          `}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-app-text-muted pointer-events-none">
          <ChevronDown size={16} />
        </div>
      </div>
      {error && (
        <p className="mt-2 text-xs text-app-danger flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-app-danger"></div>
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
