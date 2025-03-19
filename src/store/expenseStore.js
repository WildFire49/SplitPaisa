'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Initial friends list - will be replaced with users from Supabase
const initialFriends = [
  { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Lakshay' },
  { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Siddhu' },
  { id: 'b3ba141a-a776-4380-b97a-f53c45a9d978', name: 'Shubham' },
  { id: 'c3d3b5a6-7e62-4a3c-9142-0e1c2d3a4b5c', name: 'Vaishakh' }
];

// Create context
const ExpenseContext = createContext();

export function ExpenseProvider({ children }) {
  const [friends, setFriends] = useState(initialFriends);
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [expenseParticipants, setExpenseParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from Supabase on component mount
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (tripsError) {
        console.error('Error fetching trips:', tripsError);
        setError('Error fetching trips');
      } else {
        setTrips(tripsData || []);
      }
      
      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        setError('Error fetching expenses');
      } else {
        setExpenses(expensesData || []);
      }

      // Fetch expense participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('expense_participants')
        .select('*');
      
      if (participantsError) {
        console.error('Error fetching expense participants:', participantsError);
        setError('Error fetching expense participants');
      } else {
        setExpenseParticipants(participantsData || []);
      }
      
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else if (usersData && usersData.length > 0) {
        // Use users from database
        setFriends(usersData);
      } else {
        // No users in database, add initial friends
        console.log('No users found in database, adding initial friends');
        
        // Add each initial friend to the database
        for (const friend of initialFriends) {
          const { error } = await supabase
            .from('users')
            .insert([friend]);
          
          if (error) {
            console.error('Error adding initial friend:', error);
          }
        }
        
        // Set friends to initialFriends
        setFriends(initialFriends);
      }
    } catch (err) {
      console.error('Error fetching data:', err.message || JSON.stringify(err));
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscriptions
    const tripsSubscription = supabase
      .channel('trips-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTrips(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTrips(prev => prev.map(trip => trip.id === payload.new.id ? payload.new : trip));
        } else if (payload.eventType === 'DELETE') {
          setTrips(prev => prev.filter(trip => trip.id !== payload.old.id));
        }
      })
      .subscribe();
      
    const expensesSubscription = supabase
      .channel('expenses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
        // When an expense changes, we need to fetch it again with its participants
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          fetchExpenseWithParticipants(payload.new.id);
        } else if (payload.eventType === 'DELETE') {
          setExpenses(prev => prev.filter(expense => expense.id !== payload.old.id));
        }
      })
      .subscribe();
    
    return () => {
      tripsSubscription.unsubscribe();
      expensesSubscription.unsubscribe();
    };
  }, []);

  // Helper function to fetch an expense with its participants
  const fetchExpenseWithParticipants = async (expenseId) => {
    try {
      // Fetch the expense first
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .single();
      
      if (expenseError) throw expenseError;
      
      // Fetch the participants for this expense
      const { data: participantsData, error: participantsError } = await supabase
        .from('expense_participants')
        .select('*')
        .eq('expense_id', expenseId);
      
      if (participantsError) throw participantsError;
      
      // Combine the data
      const expenseWithParticipants = {
        ...expenseData,
        expense_participants: participantsData || []
      };
      
      // Update the state
      setExpenses(prev => {
        const exists = prev.some(exp => exp.id === expenseId);
        if (exists) {
          return prev.map(exp => exp.id === expenseId ? expenseWithParticipants : exp);
        } else {
          return [expenseWithParticipants, ...prev];
        }
      });
    } catch (err) {
      console.error('Error fetching expense with participants:', err.message || JSON.stringify(err));
    }
  };

  // Add a new trip
  const addTrip = async (trip) => {
    try {
      // Create trip object without members
      const { members, ...tripData } = trip;
      
      const newTrip = {
        id: uuidv4(),
        ...tripData,
        created_at: new Date().toISOString(),
      };
      
      console.log("Adding trip:", newTrip);
      
      const { data, error } = await supabase
        .from('trips')
        .insert([newTrip])
        .select();
      
      if (error) {
        console.error('Error inserting trip:', error);
        throw error;
      }
      
      const tripId = data[0].id;
      
      // If members are provided, create trip_members records
      if (members && members.length > 0) {
        const tripMembers = members.map(userId => ({
          id: uuidv4(),
          trip_id: tripId,
          user_id: userId
        }));
        
        console.log("Adding trip members:", tripMembers);
        
        const { error: membersError } = await supabase
          .from('trip_members')
          .insert(tripMembers);
        
        if (membersError) {
          console.error('Error inserting trip members:', membersError);
          // Don't throw error here, we'll still return the trip ID
        }
      }
      
      return tripId;
    } catch (err) {
      console.error('Error adding trip:', err.message || JSON.stringify(err));
      setError('Failed to add trip. Please try again.');
      return null;
    }
  };

  // Add a new expense
  const addExpense = async (expense) => {
    try {
      const expenseId = uuidv4();
      
      // Create the expense record
      const newExpense = {
        id: expenseId,
        trip_id: expense.tripId,
        description: expense.description,
        amount: expense.amount,
        paid_by: expense.paidBy,
        created_at: new Date().toISOString(),
      };
      
      console.log("Adding expense with data:", newExpense);
      
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert([newExpense]);
      
      if (expenseError) {
        console.error('Error inserting expense:', expenseError);
        throw expenseError;
      }
      
      // Create expense participants
      const participants = expense.participants.map(participantId => ({
        id: uuidv4(),
        expense_id: expenseId,
        user_id: participantId,
        share: expense.amount / expense.participants.length
      }));
      
      console.log("Adding expense participants:", participants);
      
      const { error: participantsError } = await supabase
        .from('expense_participants')
        .insert(participants);
      
      if (participantsError) {
        console.error('Error inserting expense participants:', participantsError);
        throw participantsError;
      }
      
      return expenseId;
    } catch (err) {
      console.error('Error adding expense:', err.message || JSON.stringify(err));
      setError('Failed to add expense. Please try again.');
      return null;
    }
  };

  // Add a new user
  const addUser = async (name) => {
    try {
      const userId = uuidv4();
      
      const newUser = {
        id: userId,
        name: name,
        created_at: new Date().toISOString()
      };
      
      console.log("Adding user:", newUser);
      
      const { error } = await supabase
        .from('users')
        .insert([newUser]);
      
      if (error) {
        console.error('Error adding user:', error);
        throw error;
      }
      
      // Update local friends list
      setFriends(prev => [...prev, newUser]);
      
      return userId;
    } catch (err) {
      console.error('Error adding user:', err.message || JSON.stringify(err));
      setError('Failed to add user. Please try again.');
      return null;
    }
  };

  // Calculate balances between friends
  const calculateBalances = () => {
    const balances = {};
    
    // Initialize balances for all friends
    friends.forEach(friend => {
      balances[friend.id] = 0;
    });

    // Calculate net balance for each friend
    expenses.forEach(expense => {
      // Add amount to payer's balance (they are owed this money)
      if (expense.paid_by) {
        balances[expense.paid_by] = (balances[expense.paid_by] || 0) + parseFloat(expense.amount);
      }
      
      // Find participants for this expense
      const participants = expenseParticipants.filter(p => p.expense_id === expense.id);
      
      // Distribute expense among participants
      if (participants && participants.length > 0) {
        participants.forEach(participant => {
          // Subtract share amount from each participant's balance (they owe this money)
          if (participant.user_id) {
            balances[participant.user_id] = (balances[participant.user_id] || 0) - parseFloat(participant.share);
          }
        });
      }
    });

    return balances;
  };

  // Calculate who owes whom
  const calculateSettlements = () => {
    try {
      const balances = calculateBalances();
      const settlements = [];

      // Ensure we have balances to work with
      if (!balances || Object.keys(balances).length === 0) {
        return [];
      }

      // Create arrays of creditors (positive balance) and debtors (negative balance)
      const creditors = Object.entries(balances)
        .filter(([id, balance]) => balance > 0 && id)
        .map(([id, balance]) => ({ id, balance }))
        .sort((a, b) => b.balance - a.balance);

      const debtors = Object.entries(balances)
        .filter(([id, balance]) => balance < 0 && id)
        .map(([id, balance]) => ({ id, balance: Math.abs(balance) }))
        .sort((a, b) => b.balance - a.balance);

      // Match debtors with creditors to settle debts
      while (debtors.length > 0 && creditors.length > 0) {
        const debtor = debtors[0];
        const creditor = creditors[0];
        
        // Find the minimum of what's owed and what's due
        const amount = Math.min(debtor.balance, creditor.balance);
        
        if (amount > 0) {
          // Create a settlement record
          settlements.push({
            from: debtor.id,
            to: creditor.id,
            amount: Math.round(amount * 100) / 100 // Round to 2 decimal places
          });
          
          // Update balances
          debtor.balance -= amount;
          creditor.balance -= amount;
        }
        
        // Remove entries with zero balance
        if (debtor.balance < 0.01) debtors.shift();
        if (creditor.balance < 0.01) creditors.shift();
      }

      return settlements;
    } catch (error) {
      console.error('Error calculating settlements:', error);
      return [];
    }
  };

  // Get a trip by ID
  const getTripById = async (tripId) => {
    try {
      // Validate that tripId exists
      if (!tripId) {
        console.error("Missing trip ID");
        return null;
      }
      
      console.log("Fetching trip with ID (in store):", tripId);
      
      // First, get the trip details
      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .single();
      
      if (tripError) {
        console.error("Error getting trip by ID:", tripError.message);
        return null;
      }
      
      if (!tripData) {
        console.error("Trip not found for ID:", tripId);
        return null;
      }
      
      // Next, get the trip members
      const { data: memberData, error: memberError } = await supabase
        .from("trip_members")
        .select("user_id")
        .eq("trip_id", tripId);
      
      if (memberError) {
        console.error("Error getting trip members:", memberError.message);
        // Continue without members
      }
      
      // Add members to trip data if available
      if (memberData && memberData.length > 0) {
        tripData.members = memberData.map(member => member.user_id);
      } else {
        tripData.members = [];
      }
      
      return tripData;
    } catch (error) {
      console.error("Error fetching trip by ID:", error);
      return null;
    }
  };

  // Get expenses for a specific trip
  const getExpensesByTrip = async (tripId) => {
    try {
      // Fetch expenses for the trip
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      
      if (expensesError) {
        console.error('Error fetching expenses by trip ID:', expensesError);
        throw expensesError;
      }
      
      // Fetch participants for these expenses
      const expenseIds = expensesData.map(e => e.id);
      
      // Only fetch participants if there are expenses
      if (expenseIds.length === 0) return [];
      
      const { data: participantsData, error: participantsError } = await supabase
        .from('expense_participants')
        .select('*')
        .in('expense_id', expenseIds);
      
      if (participantsError) {
        console.error('Error fetching expense participants:', participantsError);
        throw participantsError;
      }
      
      // Join expenses with their participants
      const expensesWithParticipants = expensesData.map(expense => ({
        ...expense,
        expense_participants: participantsData.filter(p => p.expense_id === expense.id) || []
      }));
      
      return expensesWithParticipants;
    } catch (err) {
      console.error('Error getting expenses by trip:', err.message || JSON.stringify(err));
      setError(`Failed to load expenses for trip ID: ${tripId}`);
      return [];
    }
  };

  // Delete a trip
  const deleteTrip = async (tripId) => {
    try {
      // First, get all expenses for this trip
      const tripExpenses = await getExpensesByTrip(tripId);
      
      // Delete all expense participants for each expense
      for (const expense of tripExpenses) {
        const { error: participantsError } = await supabase
          .from('expense_participants')
          .delete()
          .eq('expense_id', expense.id);
        
        if (participantsError) {
          console.error('Error deleting expense participants:', participantsError);
          throw participantsError;
        }
      }
      
      // Delete all expenses for this trip
      const { error: expensesError } = await supabase
        .from('expenses')
        .delete()
        .eq('trip_id', tripId);
      
      if (expensesError) {
        console.error('Error deleting trip expenses:', expensesError);
        throw expensesError;
      }
      
      // Finally, delete the trip itself
      const { error: tripError } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);
      
      if (tripError) {
        console.error('Error deleting trip:', tripError);
        throw tripError;
      }
      
      // No need to update state as the real-time subscription will handle it
    } catch (err) {
      console.error('Error deleting trip:', err.message || JSON.stringify(err));
      setError('Failed to delete trip. Please try again.');
      throw err;
    }
  };

  // Delete an expense
  const deleteExpense = async (expenseId) => {
    try {
      // First delete all participants for this expense
      const { error: participantsError } = await supabase
        .from('expense_participants')
        .delete()
        .eq('expense_id', expenseId);
      
      if (participantsError) {
        console.error('Error deleting expense participants:', participantsError);
        throw participantsError;
      }
      
      // Then delete the expense itself
      const { error: expenseError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);
      
      if (expenseError) {
        console.error('Error deleting expense:', expenseError);
        throw expenseError;
      }
      
      // No need to update state as the real-time subscription will handle it
    } catch (err) {
      console.error('Error deleting expense:', err.message || JSON.stringify(err));
      setError('Failed to delete expense. Please try again.');
      throw err;
    }
  };

  // Get a friend by ID
  const getFriendById = (friendId) => {
    return friends.find(friend => friend.id === friendId);
  };

  // Context value
  const contextValue = {
    friends,
    trips,
    expenses,
    expenseParticipants,
    loading,
    error,
    addTrip,
    addExpense,
    getTripById,
    getExpensesByTrip,
    deleteTrip,
    deleteExpense,
    getFriendById,
    calculateBalances,
    calculateSettlements,
    addUser,
    fetchData
  };

  return (
    <ExpenseContext.Provider value={contextValue}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenseStore() {
  return useContext(ExpenseContext);
}
