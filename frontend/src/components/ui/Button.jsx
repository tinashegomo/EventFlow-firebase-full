import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary:
    'bg-app-accent text-white hover:bg-app-accent-dark shadow-sm',
  secondary:
    'border border-app-border bg-transparent text-app-text-primary hover:bg-app-bg-tertiary',
  danger: 'bg-app-danger text-white hover:opacity-90 shadow-sm',
  ghost:
    'bg-transparent text-app-text-primary hover:bg-app-bg-tertiary',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...rest
}) => {
  const busy = isLoading || loading;
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2 focus:ring-offset-app-bg-primary ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      disabled={disabled || busy}
      {...rest}
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : leftIcon}
      <span>{children}</span>
      {!busy && rightIcon}
    </button>
  );
};

export default Button;
