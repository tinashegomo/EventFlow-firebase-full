import { motion } from 'framer-motion';

const PageTransition = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerList = ({ items, renderItem, className = '' }) => {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <motion.div
          key={item.id || index}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            delay: Math.min(index * 0.08, 0.3), 
            duration: 0.5, 
            type: 'spring', 
            stiffness: 300,
            damping: 20
          }}
          className="will-change-transform"
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
    </div>
  );
};

export default PageTransition;
