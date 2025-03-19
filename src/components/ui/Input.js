'use client';

import { motion } from 'framer-motion';

const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
  error,
  id,
  min,
  max,
  step,
  name
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label 
          htmlFor={id} 
          className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <motion.div
        whileFocus={{ scale: 1.01 }}
        className="relative"
      >
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
          name={name}
          className={`input w-full bg-white dark:bg-gray-800 border-2 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${className}`}
        />
      </motion.div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Input;
