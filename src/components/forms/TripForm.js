'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useExpenseStore } from '@/store/expenseStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { MapPin, Calendar, FileText, Users, Plus, X } from 'lucide-react';

const TripForm = () => {
  const router = useRouter();
  const { addTrip, addUser, friends } = useExpenseStore();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [errors, setErrors] = useState({});
  const [newFriendName, setNewFriendName] = useState('');
  const [tripMembers, setTripMembers] = useState([]);
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  // Load existing friends when component mounts
  useEffect(() => {
    if (friends && friends.length > 0) {
      // By default, include all existing friends in the trip
      setTripMembers(friends.map(friend => friend.id));
    }
  }, [friends]);

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
    
    if (tripMembers.length === 0) {
      newErrors.members = 'At least one member is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const tripData = {
      ...formData,
      members: tripMembers
    };
    
    const tripId = await addTrip(tripData);
    router.push(`/trips/${tripId}`);
  };

  const handleAddFriend = async () => {
    if (!newFriendName.trim()) {
      setErrors({
        ...errors,
        newFriend: 'Friend name is required'
      });
      return;
    }
    
    try {
      const newFriendId = await addUser(newFriendName.trim());
      if (newFriendId) {
        setTripMembers(prev => [...prev, newFriendId]);
        setNewFriendName('');
        setIsAddingFriend(false);
        setErrors({
          ...errors,
          newFriend: null,
          members: null
        });
      }
    } catch (err) {
      setErrors({
        ...errors,
        newFriend: 'Failed to add friend'
      });
    }
  };

  const toggleFriendSelection = (friendId) => {
    setTripMembers(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
    
    // Clear member error if it exists
    if (errors.members) {
      setErrors({
        ...errors,
        members: null
      });
    }
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
        
        {/* Trip Members Section */}
        <div className="mt-6">
          <div className="flex items-center mb-2">
            <Users className="mr-2 text-primary" size={18} />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Trip Members <span className="text-red-500">*</span>
            </h3>
          </div>
          
          {errors.members && (
            <p className="text-red-500 text-xs mt-1 mb-2">{errors.members}</p>
          )}
          
          <div className="space-y-2 mb-3">
            {friends && friends.map(friend => (
              <div 
                key={friend.id} 
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer border ${
                  tripMembers.includes(friend.id) 
                    ? 'border-primary bg-primary/10' 
                    : 'border-gray-300 dark:border-gray-700'
                }`}
                onClick={() => toggleFriendSelection(friend.id)}
              >
                <span>{friend.name}</span>
                {tripMembers.includes(friend.id) && (
                  <span className="text-primary text-xs font-medium">Selected</span>
                )}
              </div>
            ))}
          </div>
          
          {isAddingFriend ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Enter friend's name"
                  value={newFriendName}
                  onChange={(e) => {
                    setNewFriendName(e.target.value);
                    if (errors.newFriend) {
                      setErrors({...errors, newFriend: null});
                    }
                  }}
                  error={errors.newFriend}
                />
                <Button 
                  type="button" 
                  variant="primary" 
                  size="sm"
                  onClick={handleAddFriend}
                >
                  <Plus size={16} />
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsAddingFriend(false);
                    setNewFriendName('');
                  }}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddingFriend(true)}
              className="w-full mt-2"
            >
              <Plus size={16} className="mr-1" /> Add New Friend
            </Button>
          )}
        </div>
        
        <div className="flex justify-end mt-6 space-x-3">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            elevation="medium"
            type="button"
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
