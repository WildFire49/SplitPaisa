'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useExpenseStore } from '@/store/expenseStore';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Checkbox from '@/components/ui/Checkbox';
import { CreditCard, Users, IndianRupee, Tag, FileText } from 'lucide-react';

const ExpenseForm = ({ tripId }) => {
  const router = useRouter();
  const { friends, trips, addExpense, getTripById } = useExpenseStore();
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    paidBy: '',
    participants: [],
    tripId: tripId || ''
  });
  
  const [errors, setErrors] = useState({});
  const [trip, setTrip] = useState(null);

  useEffect(() => {
    if (tripId) {
      const foundTrip = getTripById(parseInt(tripId));
      setTrip(foundTrip);
      setFormData(prev => ({
        ...prev,
        tripId: parseInt(tripId)
      }));
    }
  }, [tripId, getTripById]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name === 'paidBy') {
      setFormData({
        ...formData,
        paidBy: parseInt(value)
      });
    } else if (name === 'tripId') {
      setFormData({
        ...formData,
        tripId: parseInt(value)
      });
    } else if (name === 'amount') {
      // Only allow numeric input with up to 2 decimal places
      const regex = /^\d*\.?\d{0,2}$/;
      if (value === '' || regex.test(value)) {
        setFormData({
          ...formData,
          [name]: value
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleParticipantToggle = (friendId) => {
    const isSelected = formData.participants.includes(friendId);
    
    if (isSelected) {
      // Remove from participants
      setFormData({
        ...formData,
        participants: formData.participants.filter(id => id !== friendId)
      });
    } else {
      // Add to participants
      setFormData({
        ...formData,
        participants: [...formData.participants, friendId]
      });
    }
    
    // Clear error if any participants are selected
    if (errors.participants && !isSelected) {
      setErrors({
        ...errors,
        participants: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.paidBy) {
      newErrors.paidBy = 'Please select who paid';
    }
    
    if (!formData.participants.length) {
      newErrors.participants = 'Please select at least one participant';
    }
    
    if (!formData.tripId) {
      newErrors.tripId = 'Please select a trip';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Convert amount to number and add current date
    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount),
      date: new Date().toISOString() // Add current date automatically
    };
    
    addExpense(expenseData);
    
    if (tripId) {
      router.push(`/trips/${tripId}`);
    } else {
      router.push('/');
    }
  };

  const friendOptions = friends.map(friend => ({
    value: friend.id,
    label: friend.name
  }));

  const tripOptions = trips.map(trip => ({
    value: trip.id,
    label: trip.name
  }));

  return (
    <Card className="max-w-md mx-auto p-6" elevation="high">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {trip ? `Add Expense to ${trip.name}` : 'Add New Expense'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="flex items-center mb-1">
          <Tag className="mr-2 text-primary" size={18} />
          <label 
            htmlFor="description" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Description <span className="text-red-500">*</span>
          </label>
        </div>
        <Input
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="e.g., Dinner, Taxi, Hotel"
          required
          error={errors.description}
        />
        
        <div className="flex items-center mb-1">
          <IndianRupee className="mr-2 text-primary" size={18} />
          <label 
            htmlFor="amount" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Amount (₹) <span className="text-red-500">*</span>
          </label>
        </div>
        <Input
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="0.00"
          required
          error={errors.amount}
        />
        
        <div className="flex items-center mb-1">
          <CreditCard className="mr-2 text-primary" size={18} />
          <label 
            htmlFor="paidBy" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Paid By <span className="text-red-500">*</span>
          </label>
        </div>
        <Select
          id="paidBy"
          name="paidBy"
          value={formData.paidBy}
          onChange={handleChange}
          options={friendOptions}
          placeholder="Select who paid"
          required
          error={errors.paidBy}
        />
        
        <div className="mt-4 mb-2">
          <div className="flex items-center mb-2">
            <Users className="mr-2 text-primary" size={18} />
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Split Between <span className="text-red-500">*</span>
            </label>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-md p-3">
            <div className="grid grid-cols-2 gap-1">
              {friends.map(friend => (
                <Checkbox
                  key={friend.id}
                  id={`friend-${friend.id}`}
                  checked={formData.participants.includes(friend.id)}
                  onCheckedChange={() => handleParticipantToggle(friend.id)}
                  label={friend.name}
                />
              ))}
            </div>
          </div>
          {errors.participants && (
            <p className="mt-1 text-sm text-red-500">{errors.participants}</p>
          )}
        </div>
        
        {!tripId && (
          <>
            <div className="flex items-center mb-1">
              <FileText className="mr-2 text-primary" size={18} />
              <label 
                htmlFor="tripId" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Trip <span className="text-red-500">*</span>
              </label>
            </div>
            <Select
              id="tripId"
              name="tripId"
              value={formData.tripId}
              onChange={handleChange}
              options={tripOptions}
              placeholder="Select a trip"
              required
              error={errors.tripId}
            />
          </>
        )}
        
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
            Add Expense
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ExpenseForm;
