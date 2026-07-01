import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary:
    'bg-gradient-to-r from-app-accent to-purple-600 text-white hover:from-purple-600 hover:to-app-accent-dark shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
  secondary:
    'border border-app-border bg-app-bg-secondary text-app-text-primary hover:bg-app-surface hover:border-gray-300 backdrop-blur-sm',
  danger:
    'bg-gradient-to-r from-app-danger to-rose-600 text-white hover:from-rose-600 hover:to-app-danger-dark shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
  ghost:
    'text-app-text-primary hover:bg-app-surface hover:text-app-accent',
  outline:
    'border-2 border-app-accent text-app-accent bg-transparent hover:bg-app-accent/10',
  glass:
    'backdrop-blur-md bg-white/10 border border-white/20 text-app-text-primary hover:bg-white/20',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
  xl: 'px-8 py-4 text-base rounded-2xl',
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
  fullWidth = false,
  ...rest
}) => {
  const busy = isLoading || loading;
  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2 focus:ring-offset-app-bg-primary
        ${fullWidth ? 'w-full' : ''}
        ${variantClasses[variant] || variantClasses.primary}
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
      disabled={disabled || busy}
      {...rest}
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : leftIcon}
      <span className="whitespace-nowrap">{children}</span>
      {!busy && rightIcon}
    </button>
  );
};

export default Button;
