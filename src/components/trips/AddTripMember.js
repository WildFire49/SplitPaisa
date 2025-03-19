"use client";

import { useState, useEffect } from 'react';
import { useExpenseStore } from '@/store/expenseStore';
import Button from '@/components/ui/Button';
import { FaPlus, FaUserPlus } from 'react-icons/fa';

export default function AddTripMember({ tripId, onMemberAdded }) {
  const { friends, addTripMember } = useExpenseStore();
  const [selectedFriend, setSelectedFriend] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleAddMember = async () => {
    if (!selectedFriend) {
      setError('Please select a friend to add');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      await addTripMember(tripId, selectedFriend);
      setSelectedFriend('');
      setShowForm(false);
      if (onMemberAdded) onMemberAdded();
    } catch (err) {
      setError(err.message || 'Failed to add member');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="mt-4">
      {!showForm ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowForm(true)}
          className="flex items-center"
        >
          <FaUserPlus className="mr-2" />
          Add Trip Member
        </Button>
      ) : (
        <div className="p-4 bg-white rounded-lg shadow">
          <h4 className="font-medium mb-3">Add Member to Trip</h4>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="friend-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Friend
              </label>
              <select
                id="friend-select"
                value={selectedFriend}
                onChange={(e) => setSelectedFriend(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a friend</option>
                {friends.map((friend) => (
                  <option key={friend.id} value={friend.id}>
                    {friend.name}
                  </option>
                ))}
              </select>
            </div>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <div className="flex space-x-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddMember}
                disabled={isAdding || !selectedFriend}
                className="flex-1"
              >
                {isAdding ? 'Adding...' : 'Add Member'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                  setSelectedFriend('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
