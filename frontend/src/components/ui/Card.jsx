const Card = ({ children, className = '', onClick, elevated = false }) => {
  const interactive = typeof onClick === 'function';
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl border border-app-border bg-app-bg-secondary
        shadow-sm p-6
        ${interactive ? 'cursor-pointer' : ''}
        ${elevated ? 'card-hover' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
