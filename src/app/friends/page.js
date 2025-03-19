"use client";

import { useState, useEffect } from 'react';
import { useExpenseStore } from '@/store/expenseStore';
import { FaUserPlus, FaUserEdit, FaTrash, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function FriendsPage() {
  const { friends, addFriend, editFriend, deleteFriend, loading } = useExpenseStore();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFriend, setEditingFriend] = useState(null);
  const [newFriendName, setNewFriendName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleAddFriend = async (e) => {
    e.preventDefault();
    
    if (!newFriendName.trim()) {
      setError('Friend name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await addFriend({ name: newFriendName.trim() });
      setNewFriendName('');
      setShowAddForm(false);
    } catch (err) {
      setError(err.message || 'Failed to add friend');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditFriend = async (e) => {
    e.preventDefault();
    
    if (!newFriendName.trim()) {
      setError('Friend name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await editFriend(editingFriend.id, { name: newFriendName.trim() });
      setNewFriendName('');
      setEditingFriend(null);
    } catch (err) {
      setError(err.message || 'Failed to update friend');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const startEditFriend = (friend) => {
    setEditingFriend(friend);
    setNewFriendName(friend.name);
    setShowAddForm(false);
  };
  
  const handleDeleteFriend = async (friendId) => {
    if (!confirm('Are you sure you want to delete this friend? This will remove them from all trips and expenses.')) {
      return;
    }
    
    try {
      await deleteFriend(friendId);
    } catch (err) {
      alert(err.message || 'Failed to delete friend');
    }
  };
  
  const cancelForm = () => {
    setShowAddForm(false);
    setEditingFriend(null);
    setNewFriendName('');
    setError(null);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="mr-4">
          <Button variant="ghost" size="sm" className="flex items-center">
            <FaArrowLeft className="mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Friends</h1>
      </div>
      
      {!showAddForm && !editingFriend && (
        <Button 
          variant="primary" 
          className="mb-6 flex items-center"
          onClick={() => setShowAddForm(true)}
        >
          <FaUserPlus className="mr-2" />
          Add New Friend
        </Button>
      )}
      
      {(showAddForm || editingFriend) && (
        <Card className="mb-6 p-4">
          <h2 className="text-xl font-semibold mb-4">
            {editingFriend ? 'Edit Friend' : 'Add New Friend'}
          </h2>
          
          <form onSubmit={editingFriend ? handleEditFriend : handleAddFriend}>
            <div className="mb-4">
              <label htmlFor="friendName" className="block text-sm font-medium text-gray-700 mb-1">
                Friend Name
              </label>
              <input
                type="text"
                id="friendName"
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter friend's name"
                disabled={isSubmitting}
              />
            </div>
            
            {error && (
              <div className="mb-4 text-red-500 text-sm">{error}</div>
            )}
            
            <div className="flex space-x-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Saving...' : (editingFriend ? 'Update Friend' : 'Add Friend')}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={cancelForm}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
      
      {loading ? (
        <div className="text-center py-8">Loading friends...</div>
      ) : friends.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">You haven&apos;t added any friends yet.</p>
          {!showAddForm && (
            <Button 
              variant="primary" 
              onClick={() => setShowAddForm(true)}
              className="flex items-center mx-auto"
            >
              <FaUserPlus className="mr-2" />
              Add Your First Friend
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map(friend => (
            <Card key={friend.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-3">
                    {friend.name.charAt(0)}
                  </div>
                  <span className="font-medium">{friend.name}</span>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditFriend(friend)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <FaUserEdit />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFriend(friend.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
