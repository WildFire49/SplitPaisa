'use client';

import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '',
  onClick,
  animate = true,
  elevation = 'medium'
}) => {
  // Define elevation classes for different shadow depths
  const elevationClasses = {
    low: 'shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    medium: 'shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    high: 'shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
  };

  const baseComponent = (
    <div 
      className={`card ${elevationClasses[elevation]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`card ${elevationClasses[elevation]} ${className}`}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return baseComponent;
};

export default Card;
