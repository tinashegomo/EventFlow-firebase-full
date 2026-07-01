import { useId } from 'react';

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
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-app-text-primary mb-1.5"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full appearance-none rounded-xl border ${error ? 'border-app-danger' : 'border-app-border'} bg-app-bg-secondary px-4 py-2.5 text-sm text-app-text-primary focus:outline-none focus:ring-2 focus:ring-app-accent transition ${className}`}
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
      {error && (
        <p className="mt-1.5 text-xs text-app-danger">{error}</p>
      )}
    </div>
  );
};

export default Select;
