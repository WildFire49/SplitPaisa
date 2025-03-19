'use client';

import { motion } from 'framer-motion';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  disabled = false,
  type = 'button',
  fullWidth = false,
  elevation = 'medium'
}) => {
  const baseClasses = 'btn flex items-center justify-center gap-2 font-medium transition-all duration-200';
  
  // Shadow classes based on elevation
  const shadowClasses = {
    low: 'shadow-sm',
    medium: 'shadow-md',
    high: 'shadow-lg'
  };
  
  const variantClasses = {
    primary: 'btn-primary bg-primary hover:bg-primary-dark text-white',
    secondary: 'btn-secondary bg-secondary hover:bg-secondary-dark text-white',
    accent: 'btn-accent bg-accent hover:bg-accent-dark text-white',
    outline: 'border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${shadowClasses[elevation]} ${widthClass} ${disabledClass} ${className}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
};

export default Button;
