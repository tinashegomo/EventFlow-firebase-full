const Card = ({ children, className = '', onClick }) => {
  const interactive = typeof onClick === 'function';
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-app-border bg-app-bg-secondary shadow-sm p-6 ${interactive ? 'cursor-pointer hover:shadow-md hover:border-app-accent transition-all' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
