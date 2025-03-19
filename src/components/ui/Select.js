'use client';

import { motion } from 'framer-motion';

const Select = ({
  label,
  value,
  onChange,
  options,
  required = false,
  className = '',
  error,
  id,
  multiple = false,
  placeholder,
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
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          multiple={multiple}
          className={`input w-full bg-white dark:bg-gray-800 border-2 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${className}`}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </motion.div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Select;
