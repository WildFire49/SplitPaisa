'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useExpenseStore } from '@/store/expenseStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { MapPin, Calendar, FileText } from 'lucide-react';

const TripForm = () => {
  const router = useRouter();
  const { addTrip } = useExpenseStore();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Trip name is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const tripId = addTrip(formData);
    router.push(`/trips/${tripId}`);
  };

  return (
    <Card className="max-w-md mx-auto p-6" elevation="high">
      <h2 className="text-2xl font-bold mb-6 text-center">Create New Trip</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="flex items-center mb-1">
          <MapPin className="mr-2 text-primary" size={18} />
          <label 
            htmlFor="name" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Trip Name <span className="text-red-500">*</span>
          </label>
        </div>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Goa Vacation"
          required
          error={errors.name}
        />
        
        <div className="flex items-center mb-1 mt-4">
          <FileText className="mr-2 text-primary" size={18} />
          <label 
            htmlFor="description" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Description
          </label>
        </div>
        <Input
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="e.g., Weekend trip to Goa"
        />
        
        <div className="flex items-center mb-1 mt-4">
          <Calendar className="mr-2 text-primary" size={18} />
          <label 
            htmlFor="date" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Date <span className="text-red-500">*</span>
          </label>
        </div>
        <Input
          id="date"
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
          error={errors.date}
        />
        
        <div className="flex justify-end mt-6 space-x-3">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            elevation="medium"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            elevation="high"
          >
            Create Trip
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default TripForm;
