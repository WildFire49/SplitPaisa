'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

const Checkbox = React.forwardRef(({ 
  className, 
  checked, 
  onCheckedChange,
  id,
  label,
  ...props 
}, ref) => (
  <div className="flex items-center space-x-2 my-2">
    <CheckboxPrimitive.Root
      ref={ref}
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={`peer h-5 w-5 shrink-0 rounded-sm border-2 border-gray-300 bg-white shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-white dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-offset-gray-900 dark:data-[state=checked]:bg-primary ${className}`}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
    {label && (
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
    )}
  </div>
));

Checkbox.displayName = "Checkbox";

export default Checkbox;
