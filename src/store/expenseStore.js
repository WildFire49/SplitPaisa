'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Create context
const ExpenseContext = createContext();

export function ExpenseProvider({ children }) {
  const [friends, setFriends] = useState([]);
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [expenseParticipants, setExpenseParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Request tracking to prevent duplicate API calls
  const pendingRequests = useRef({});
  const dataFetched = useRef(false);

  // Abort controller registry
  const abortControllers = useRef({});
  
  // Create a new abort controller and register it
  const createAbortController = (requestId) => {
    // Cancel any existing request with the same ID
    if (abortControllers.current[requestId]) {
      abortControllers.current[requestId].abort();
    }
    
    // Create a new controller
    const controller = new AbortController();
    abortControllers.current[requestId] = controller;
    return controller;
  };

  // Helper function to fetch an expense with its participants
  const fetchExpenseWithParticipants = useCallback(async (expenseId) => {
    // Prevent duplicate calls
    const requestId = `fetchExpense_${expenseId}`;
    if (pendingRequests.current[requestId]) {
      console.log(`Fetch expense ${expenseId} already in progress, skipping duplicate call`);
      return;
    }
    
    pendingRequests.current[requestId] = true;
    
    // Create abort controller
    const controller = createAbortController(requestId);
    const signal = controller.signal;
    
    try {
      // Fetch the expense first
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .single()
        .abortSignal(signal);
      
      if (expenseError) throw expenseError;
      
      // Fetch the participants for this expense
      const { data: participantsData, error: participantsError } = await supabase
        .from('expense_participants')
        .select('*')
        .eq('expense_id', expenseId)
        .abortSignal(signal);
      
      if (participantsError) throw participantsError;
      
      if (!signal.aborted) {
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
      }
    } catch (err) {
      // Only log error if not aborted
      if (err.name !== 'AbortError') {
        console.error('Error fetching expense with participants:', err.message || JSON.stringify(err));
      }
    } finally {
      // Clean up
      if (!signal.aborted) {
        delete pendingRequests.current[requestId];
      }
    }
  }, []);

  // Fetch data from Supabase on component mount
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Prevent duplicate calls
    if (pendingRequests.current.fetchData && !forceRefresh) {
      console.log('Fetch data already in progress, skipping duplicate call');
      return;
    }
    
    // Skip if data is already fetched and no force refresh
    if (dataFetched.current && !forceRefresh) {
      console.log('Data already fetched, skipping fetch');
      return;
    }
    
    const requestId = 'fetchData';
    pendingRequests.current[requestId] = true;
    
    // Create abort controller
    const controller = createAbortController(requestId);
    const signal = controller.signal;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false })
        .abortSignal(signal);
      
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
        .order('created_at', { ascending: false })
        .abortSignal(signal);
      
      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        setError('Error fetching expenses');
      } else {
        setExpenses(expensesData || []);
      }

      // Fetch expense participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('expense_participants')
        .select('*')
        .abortSignal(signal);
      
      if (participantsError) {
        console.error('Error fetching expense participants:', participantsError);
        setError('Error fetching expense participants');
      } else {
        setExpenseParticipants(participantsData || []);
      }
      
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .abortSignal(signal);
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else if (usersData && usersData.length > 0) {
        // Use users from database
        setFriends(usersData);
      } else {
        console.log('No users found in database');
      }
      
      // Mark data as fetched
      dataFetched.current = true;
    } catch (err) {
      // Only log error if not aborted
      if (err.name !== 'AbortError') {
        console.error('Error fetching data:', err.message || JSON.stringify(err));
        setError('Failed to fetch data. Please try again.');
      }
    } finally {
      // Only update loading state if not aborted
      if (!signal.aborted) {
        setLoading(false);
        delete pendingRequests.current[requestId];
      }
    }
  }, []);

  useEffect(() => {
    // Fetch data on mount
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
    
    // Capture the current controllers for cleanup
    const currentControllers = abortControllers.current;
    
    return () => {
      // Clean up subscriptions
      tripsSubscription.unsubscribe();
      expensesSubscription.unsubscribe();
      
      // Abort all pending requests
      Object.values(currentControllers).forEach(controller => {
        controller.abort();
      });
    };
  }, [fetchData, fetchExpenseWithParticipants]);

  // Add a new trip
  const addTrip = useCallback(async (trip) => {
    const requestId = 'addTrip';
    const controller = createAbortController(requestId);
    const signal = controller.signal;
    
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
        .select()
        .abortSignal(signal);
      
      if (error) {
        console.error('Error inserting trip:', error);
        throw error;
      }
      
      const tripId = data[0].id;
      
      // If members are provided, create trip_members records
      if (members && members.length > 0 && !signal.aborted) {
        const tripMembers = members.map(userId => ({
          id: uuidv4(),
          trip_id: tripId,
          user_id: userId
        }));
        
        console.log("Adding trip members:", tripMembers);
        
        const { error: membersError } = await supabase
          .from('trip_members')
          .insert(tripMembers)
          .abortSignal(signal);
        
        if (membersError) {
          console.error('Error inserting trip members:', membersError);
          // Don't throw error here, we'll still return the trip ID
        }
      }
      
      return tripId;
    } catch (err) {
      // Only log error if not aborted
      if (err.name !== 'AbortError') {
        console.error('Error adding trip:', err.message || JSON.stringify(err));
        setError('Failed to add trip. Please try again.');
      }
      return null;
    } finally {
      delete pendingRequests.current[requestId];
    }
  }, []);

  // Add a new expense
  const addExpense = useCallback(async (expense) => {
    const requestId = 'addExpense';
    const controller = createAbortController(requestId);
    const signal = controller.signal;
    
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
        .insert([newExpense])
        .abortSignal(signal);
      
      if (expenseError) {
        console.error('Error inserting expense:', expenseError);
        throw expenseError;
      }
      
      if (!signal.aborted) {
        // Create expense participants
        const participants = expense.participants.map(participantId => {
          // Calculate the exact share for each participant without rounding
          const exactShare = expense.amount / expense.participants.length;
          
          return {
            id: uuidv4(),
            expense_id: expenseId,
            user_id: participantId,
            share: exactShare
          };
        });
        
        console.log("Adding expense participants:", participants);
        
        const { error: participantsError } = await supabase
          .from('expense_participants')
          .insert(participants)
          .abortSignal(signal);
        
        if (participantsError) {
          console.error('Error inserting expense participants:', participantsError);
          throw participantsError;
        }
      }
      
      return expenseId;
    } catch (err) {
      // Only log error if not aborted
      if (err.name !== 'AbortError') {
        console.error('Error adding expense:', err.message || JSON.stringify(err));
        setError('Failed to add expense. Please try again.');
      }
      return null;
    } finally {
      delete pendingRequests.current[requestId];
    }
  }, []);

  // Add a new friend
  const addFriend = useCallback(async (friendData) => {
    if (!friendData || !friendData.name) {
      throw new Error("Friend name is required");
    }
    
    const requestId = 'addFriend';
    const controller = createAbortController(requestId);
    const signal = controller.signal;
    
    try {
      const userId = uuidv4();
      
      const newFriend = {
        id: userId,
        name: friendData.name.trim(),
        created_at: new Date().toISOString()
      };
      
      console.log("Adding friend:", newFriend);
      
      const { error } = await supabase
        .from('users')
        .insert([newFriend])
        .abortSignal(signal);
      
      if (error) {
        console.error('Error adding friend:', error);
        throw new Error(`Failed to add friend: ${error.message}`);
      }
      
      // Update local state
      setFriends(prev => [...prev, newFriend]);
      
      return newFriend;
    } catch (err) {
      // Only log error if not aborted
      if (err.name !== 'AbortError') {
        console.error('Error adding friend:', err.message || JSON.stringify(err));
        throw err;
      }
      return null;
    } finally {
      delete pendingRequests.current[requestId];
    }
  }, []);

  // Edit a friend
  const editFriend = useCallback(async (friendId, friendData) => {
    if (!friendId) {
      throw new Error("Friend ID is required");
    }
    
    if (!friendData || !friendData.name) {
      throw new Error("Friend name is required");
    }
    
    const requestId = `editFriend_${friendId}`;
    const controller = createAbortController(requestId);
    const signal = controller.signal;
    
    try {
      const updatedFriend = {
        name: friendData.name.trim(),
        updated_at: new Date().toISOString()
      };
      
      console.log("Updating friend:", friendId, updatedFriend);
      
      const { error } = await supabase
        .from('users')
        .update(updatedFriend)
        .eq('id', friendId)
        .abortSignal(signal);
      
      if (error) {
        console.error('Error updating friend:', error);
        throw new Error(`Failed to update friend: ${error.message}`);
      }
      
      // Update local state
      setFriends(prev => prev.map(friend => 
        friend.id === friendId ? { ...friend, ...updatedFriend } : friend
      ));
      
      return { id: friendId, ...updatedFriend };
    } catch (err) {
      // Only log error if not aborted
      if (err.name !== 'AbortError') {
        console.error('Error updating friend:', err.message || JSON.stringify(err));
        throw err;
      }
      return null;
    } finally {
      delete pendingRequests.current[requestId];
    }
  }, []);

  // Add a new user
  const addUser = useCallback(async (name) => {
    const requestId = 'addUser';
    const controller = createAbortController(requestId);
    const signal = controller.signal;
    
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
        .insert([newUser])
        .abortSignal(signal);
      
      if (error) {
        console.error('Error adding user:', error);
        throw error;
      }
      
      if (!signal.aborted) {
        // Update local friends list
        setFriends(prev => [...prev, newUser]);
      }
      
      return userId;
    } catch (err) {
      // Only log error if not aborted
      if (err.name !== 'AbortError') {
        console.error('Error adding user:', err.message || JSON.stringify(err));
        setError('Failed to add user. Please try again.');
      }
      return null;
    } finally {
      delete pendingRequests.current[requestId];
    }
  }, []);

  // Calculate balances between friends
  const calculateBalances = useCallback(() => {
    const balances = {};
    
    // Initialize balances for all friends
    friends.forEach(friend => {
      balances[friend.id] = 0;
    });

    console.log("Initial balances in store:", balances);
    console.log("All expenses:", expenses);
    console.log("All expense participants:", expenseParticipants);

    // Calculate net balance for each friend
    expenses.forEach(expense => {
      // Find participants for this expense
      const participants = expenseParticipants.filter(p => p.expense_id === expense.id);
      console.log(`Participants for expense "${expense.description}":`, participants);
      
      if (!participants || participants.length === 0) {
        console.log(`No participants found for expense "${expense.description}"`);
        return; // Skip this expense
      }
      
      // Calculate total shares for verification
      const totalShares = participants.reduce((sum, p) => sum + parseFloat(p.share), 0);
      console.log(`Total shares for expense "${expense.description}": ${totalShares}, Expense amount: ${expense.amount}`);
      
      // Verify that total shares match the expense amount (within a small tolerance for floating point errors)
      if (Math.abs(totalShares - parseFloat(expense.amount)) > 0.01) {
        console.warn(`Warning: Total shares (${totalShares}) don't match expense amount (${expense.amount}) for "${expense.description}"`);
      }
      
      // Add amount to payer's balance (they are owed this money)
      if (expense.paid_by) {
        const friendName = friends.find(f => f.id === expense.paid_by)?.name || "Unknown";
        
        // The payer paid the full amount
        const fullAmount = parseFloat(expense.amount);
        
        // Find the payer's own share
        const payerParticipant = participants.find(p => p.user_id === expense.paid_by);
        const payerOwnShare = payerParticipant ? parseFloat(payerParticipant.share) : 0;
        
        // The payer is owed the amount they paid for others
        const paidForOthers = fullAmount - payerOwnShare;
        
        balances[expense.paid_by] = (balances[expense.paid_by] || 0) + paidForOthers;
        console.log(`After payer ${expense.paid_by} (${friendName}) added ${paidForOthers} for expense "${expense.description}":`, {...balances});
      }
      
      // Distribute expense among participants (excluding the payer)
      participants.forEach(participant => {
        // Skip the payer as we've already handled their balance
        if (participant.user_id && participant.user_id !== expense.paid_by) {
          const friendName = friends.find(f => f.id === participant.user_id)?.name || "Unknown";
          const share = parseFloat(participant.share); // Use exact share without rounding
          balances[participant.user_id] = (balances[participant.user_id] || 0) - share;
          console.log(`After participant ${participant.user_id} (${friendName}) subtracted ${share}:`, {...balances});
        }
      });
    });

    console.log("Final balances in store:", balances);
    return balances;
  }, [friends, expenses, expenseParticipants]);

  // Calculate who owes whom
  const calculateSettlements = useCallback(() => {
    try {
      const settlements = [];
      
      // Create a map to track who owes what to whom
      const debts = {};
      
      // Initialize the debt tracking structure
      friends.forEach(debtor => {
        debts[debtor.id] = {};
        friends.forEach(creditor => {
          if (debtor.id !== creditor.id) {
            debts[debtor.id][creditor.id] = 0;
          }
        });
      });
      
      // Process each expense to determine who owes what to whom
      expenses.forEach(expense => {
        const payer = expense.paid_by;
        if (!payer) return;
        
        // Get participants for this expense
        const participants = expenseParticipants.filter(p => p.expense_id === expense.id);
        if (!participants || participants.length === 0) return;
        
        // Calculate each participant's debt to the payer
        participants.forEach(participant => {
          if (participant.user_id && participant.user_id !== payer) {
            const share = parseFloat(participant.share);
            
            // Add to the debt that this participant owes to the payer
            if (debts[participant.user_id] && debts[participant.user_id][payer] !== undefined) {
              debts[participant.user_id][payer] += share;
            }
          }
        });
      });
      
      console.log("Raw debts:", JSON.stringify(debts, null, 2));
      
      // Simplify debts (if A owes B and B owes A, cancel out the common amount)
      friends.forEach(person1 => {
        friends.forEach(person2 => {
          if (person1.id !== person2.id) {
            // If both owe each other, cancel out the common amount
            const debt1to2 = debts[person1.id][person2.id] || 0;
            const debt2to1 = debts[person2.id][person1.id] || 0;
            
            if (debt1to2 > 0 && debt2to1 > 0) {
              // Calculate the net debt
              const netDebt = Math.abs(debt1to2 - debt2to1);
              
              if (debt1to2 > debt2to1) {
                // person1 still owes person2
                debts[person1.id][person2.id] = netDebt;
                debts[person2.id][person1.id] = 0;
              } else {
                // person2 still owes person1
                debts[person2.id][person1.id] = netDebt;
                debts[person1.id][person2.id] = 0;
              }
            }
          }
        });
      });
      
      console.log("Simplified debts:", JSON.stringify(debts, null, 2));
      
      // Create settlement records from the debts
      Object.entries(debts).forEach(([debtorId, creditors]) => {
        Object.entries(creditors).forEach(([creditorId, amount]) => {
          if (amount > 0.01) { // Only create settlements for non-zero amounts
            const debtorName = friends.find(f => f.id === debtorId)?.name || "Unknown";
            const creditorName = friends.find(f => f.id === creditorId)?.name || "Unknown";
            
            console.log(`Settlement: ${debtorName} pays ${creditorName} ${amount}`);
            
            settlements.push({
              from: debtorId,
              to: creditorId,
              amount: amount
            });
          }
        });
      });
      
      return settlements;
    } catch (error) {
      console.error("Error calculating settlements:", error);
      return [];
    }
  }, [expenses, expenseParticipants, friends]);

  // Get a trip by ID
  const getTripById = useCallback(async (tripId) => {
    if (!tripId) {
      console.error("getTripById called with invalid tripId:", tripId);
      return null; 
    }
    
    // Prevent duplicate calls
    const requestId = `getTripById_${tripId}`;
    if (pendingRequests.current[requestId]) {
      console.log(`Get trip ${tripId} already in progress, skipping duplicate call`);
      return null;
    }
    
    pendingRequests.current[requestId] = true;
    
    // Create abort controller
    const controller = createAbortController(requestId);
    const signal = controller.signal;
    
    try {
      // First check if we have the trip in our local state
      const localTrip = trips.find(trip => trip.id === tripId);
      if (localTrip) {
        console.log("Found trip in local state:", localTrip);
        
        // Still fetch members to ensure we have the latest data
        const { data: memberData, error: memberError } = await supabase
          .from('trip_members')
          .select('user_id')
          .eq("trip_id", tripId)
          .abortSignal(signal);
        
        if (memberError) {
          console.error("Error getting trip members:", memberError.message);
          // Continue without members
        }
        
        if (signal.aborted) return null;
        
        // Add members to trip data if available
        if (memberData && memberData.length > 0) {
          localTrip.members = memberData.map(member => member.user_id);
        } else {
          localTrip.members = [];
        }
        
        return localTrip;
      }
      
      // Fetch trip from database
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single()
        .abortSignal(signal);
      
      if (tripError) {
        if (tripError.code === 'PGRST116') {
          // This is the "not found" error code from PostgREST
          console.error(`Trip with ID ${tripId} not found in database`);
          return null;
        }
        
        console.error("Error fetching trip:", tripError.message);
        return null; 
      }
      
      if (signal.aborted) return null;
      
      if (!tripData) {
        console.error(`Trip with ID ${tripId} not found`);
        return null;
      }
      
      // Fetch trip members
      const { data: memberData, error: memberError } = await supabase
        .from('trip_members')
        .select('user_id')
        .eq("trip_id", tripId)
        .abortSignal(signal);
      
      if (memberError) {
        console.error("Error getting trip members:", memberError.message);
        // Continue without members
      }
      
      if (signal.aborted) return null;
      
      // Add members to trip data if available
      if (memberData && memberData.length > 0) {
        tripData.members = memberData.map(member => member.user_id);
      } else {
        tripData.members = [];
      }
      
      return tripData;
    } catch (error) {
      // Only log error if not aborted
      if (error.name !== 'AbortError') {
        console.error("Error fetching trip by ID:", error);
      }
      return null; 
    } finally {
      delete pendingRequests.current[requestId];
    }
  }, [trips]);

  // Get expenses for a specific trip
  const getExpensesByTrip = useCallback(async (tripId) => {
    // Prevent duplicate calls
    const requestId = `getExpensesByTrip_${tripId}`;
    if (pendingRequests.current[requestId]) {
      console.log(`Get expenses for trip ${tripId} already in progress, skipping duplicate call`);
      return [];
    }
    
    pendingRequests.current[requestId] = true;
    
    // Create abort controller
    const controller = createAbortController(requestId);
    const signal = controller.signal;
    
    try {
      // Fetch expenses for the trip
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })
        .abortSignal(signal);
      
      if (expensesError) {
        console.error('Error fetching expenses by trip ID:', expensesError);
        throw expensesError;
      }
      
      if (signal.aborted) return [];
      
      // Fetch participants for these expenses
      const expenseIds = expensesData.map(e => e.id);
      
      // Only fetch participants if there are expenses
      if (expenseIds.length === 0) return [];
      
      const { data: participantsData, error: participantsError } = await supabase
        .from('expense_participants')
        .select('*')
        .in('expense_id', expenseIds)
        .abortSignal(signal);
      
      if (participantsError) {
        console.error('Error fetching expense participants:', participantsError);
        throw participantsError;
      }
      
      if (signal.aborted) return [];
      
      // Join expenses with their participants
      const expensesWithParticipants = expensesData.map(expense => ({
        ...expense,
        expense_participants: participantsData.filter(p => p.expense_id === expense.id) || []
      }));
      
      return expensesWithParticipants;
    } catch (err) {
      // Only log error if not aborted
      if (err.name !== 'AbortError') {
        console.error('Error getting expenses by trip:', err.message || JSON.stringify(err));
        setError(`Failed to load expenses for trip ID: ${tripId}`);
      }
      return [];
    } finally {
      // Clean up
      if (!signal.aborted) {
        delete pendingRequests.current[requestId];
      }
    }
  }, []);

  // Delete a trip
  const deleteTrip = useCallback(async (tripId) => {
    const requestId = `deleteTrip_${tripId}`;
    const controller = createAbortController(requestId);
    const signal = controller.signal;
    
    try {
      // First, get all expenses for this trip
      const tripExpenses = await getExpensesByTrip(tripId);
      
      if (signal.aborted) return;
      
      // Delete all expense participants for each expense
      for (const expense of tripExpenses) {
        const { error: participantsError } = await supabase
          .from('expense_participants')
          .delete()
          .eq('expense_id', expense.id)
          .abortSignal(signal);
        
        if (participantsError) {
          console.error('Error deleting expense participants:', participantsError);
          throw participantsError;
        }
        
        if (signal.aborted) return;
      }
      
      // Delete all expenses for this trip
      const { error: expensesError } = await supabase
        .from('expenses')
        .delete()
        .eq('trip_id', tripId)
        .abortSignal(signal);
      
      if (expensesError) {
        console.error('Error deleting trip expenses:', expensesError);
        throw expensesError;
      }
      
      if (signal.aborted) return;
      
      // Finally, delete the trip itself
      const { error: tripError } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)
        .abortSignal(signal);
      
      if (tripError) {
        console.error('Error deleting trip:', tripError);
        throw tripError;
      }
      
      // No need to update state as the real-time subscription will handle it
    } catch (err) {
      // Only log error if not aborted
      if (err.name !== 'AbortError') {
        console.error('Error deleting trip:', err.message || JSON.stringify(err));
        setError('Failed to delete trip. Please try again.');
        throw err;
      }
    } finally {
      delete pendingRequests.current[requestId];
    }
  }, [getExpensesByTrip]);

  // Delete an expense
  const deleteExpense = useCallback(async (expenseId) => {
    const requestId = `deleteExpense_${expenseId}`;
    const controller = createAbortController(requestId);
    const signal = controller.signal;
    
    try {
      // First delete all participants for this expense
      const { error: participantsError } = await supabase
        .from('expense_participants')
        .delete()
        .eq('expense_id', expenseId)
        .abortSignal(signal);
      
      if (participantsError) {
        console.error('Error deleting expense participants:', participantsError);
        throw participantsError;
      }
      
      if (signal.aborted) return;
      
      // Then delete the expense itself
      const { error: expenseError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .abortSignal(signal);
      
      if (expenseError) {
        console.error('Error deleting expense:', expenseError);
        throw expenseError;
      }
      
      // No need to update state as the real-time subscription will handle it
    } catch (err) {
      // Only log error if not aborted
      if (err.name !== 'AbortError') {
        console.error('Error deleting expense:', err.message || JSON.stringify(err));
        setError('Failed to delete expense. Please try again.');
        throw err;
      }
    } finally {
      delete pendingRequests.current[requestId];
    }
  }, []);

  // Get a friend by ID
  const getFriendById = useCallback((friendId) => {
    return friends.find(friend => friend.id === friendId);
  }, [friends]);

  // Refresh data once
  const refreshDataOnce = useCallback(() => {
    // Reset the dataFetched flag to force a refresh
    dataFetched.current = false;
    // Then fetch data
    fetchData(true);
    // Set dataFetched back to true to prevent further refreshes
    dataFetched.current = true;
  }, [fetchData]);

  // Add a member to a trip
  const addTripMember = useCallback(async (tripId, userId) => {
    try {
      // Validate inputs
      if (!tripId || !userId) {
        throw new Error("Trip ID and user ID are required");
      }
      
      // Check if the user is already a member of the trip
      const { data: existingMember, error: checkError } = await supabase
        .from("trip_members")
        .select("*")
        .eq("trip_id", tripId)
        .eq("user_id", userId)
        .single();
      
      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is the error code for "no rows returned" which is expected if the member doesn't exist
        console.error("Error checking existing trip member:", checkError);
        throw new Error("Failed to check if user is already a member");
      }
      
      if (existingMember) {
        throw new Error("This friend is already a member of the trip");
      }
      
      // Add the user to the trip
      const { data, error } = await supabase
        .from("trip_members")
        .insert([
          { trip_id: tripId, user_id: userId }
        ]);
      
      if (error) {
        console.error("Error adding trip member:", error);
        throw new Error("Failed to add member to trip");
      }
      
      // Force a refresh of the trip data
      refreshDataOnce();
      
      return data;
    } catch (error) {
      console.error("Error in addTripMember:", error);
      throw error;
    }
  }, [refreshDataOnce]);

  // Remove a member from a trip
  const removeTripMember = useCallback(async (tripId, userId) => {
    try {
      // Validate inputs
      if (!tripId || !userId) {
        throw new Error("Trip ID and user ID are required");
      }
      
      // Check if the user has any expenses in this trip
      const { data: userExpenses, error: expenseError } = await supabase
        .from("expenses")
        .select("id")
        .eq("trip_id", tripId)
        .eq("paid_by", userId);
      
      if (expenseError) {
        console.error("Error checking user expenses:", expenseError);
        throw new Error("Failed to check user expenses");
      }
      
      if (userExpenses && userExpenses.length > 0) {
        throw new Error("Cannot remove member with existing expenses");
      }
      
      // Check if the user is a participant in any expenses
      const { data: participations, error: participationError } = await supabase
        .from("expense_participants")
        .select("id, expense_id")
        .eq("user_id", userId);
      
      if (participationError) {
        console.error("Error checking user participations:", participationError);
        throw new Error("Failed to check user participations");
      }
      
      if (participations && participations.length > 0) {
        // Get the expense IDs
        const expenseIds = participations.map(p => p.expense_id);
        
        // Check if any of these expenses belong to this trip
        const { data: tripExpenses, error: tripExpError } = await supabase
          .from("expenses")
          .select("id")
          .eq("trip_id", tripId)
          .in("id", expenseIds);
        
        if (tripExpError) {
          console.error("Error checking trip expenses:", tripExpError);
          throw new Error("Failed to check trip expenses");
        }
        
        if (tripExpenses && tripExpenses.length > 0) {
          throw new Error("Cannot remove member who is a participant in expenses");
        }
      }
      
      // Remove the user from the trip
      const { data, error } = await supabase
        .from("trip_members")
        .delete()
        .eq("trip_id", tripId)
        .eq("user_id", userId);
      
      if (error) {
        console.error("Error removing trip member:", error);
        throw new Error("Failed to remove member from trip");
      }
      
      // Force a refresh of the trip data
      refreshDataOnce();
      
      return data;
    } catch (error) {
      console.error("Error in removeTripMember:", error);
      throw error;
    }
  }, [refreshDataOnce]);

  // Get members of a trip
  const getTripMembers = useCallback(async (tripId) => {
    try {
      if (!tripId) {
        console.error("Missing trip ID");
        return [];
      }
      
      const { data, error } = await supabase
        .from("trip_members")
        .select("user_id")
        .eq("trip_id", tripId);
      
      if (error) {
        console.error("Error getting trip members:", error);
        return [];
      }
      
      // Return the user IDs
      return data.map(member => member.user_id);
    } catch (error) {
      console.error("Error in getTripMembers:", error);
      return [];
    }
  }, []);

  // Delete a friend
  const deleteFriend = useCallback(async (friendId) => {
    if (!friendId) {
      throw new Error("Friend ID is required");
    }
    
    const requestId = `deleteFriend_${friendId}`;
    const controller = createAbortController(requestId);
    const signal = controller.signal;
    
    try {
      // Check if friend is part of any trips
      const { data: tripMembers, error: tripMembersError } = await supabase
        .from('trip_members')
        .select('*')
        .eq('user_id', friendId)
        .abortSignal(signal);
      
      if (tripMembersError) {
        console.error('Error checking trip members:', tripMembersError);
        throw new Error(`Failed to check trip memberships: ${tripMembersError.message}`);
      }
      
      if (tripMembers && tripMembers.length > 0) {
        // Remove friend from all trips
        const { error: removeError } = await supabase
          .from('trip_members')
          .delete()
          .eq('user_id', friendId)
          .abortSignal(signal);
        
        if (removeError) {
          console.error('Error removing friend from trips:', removeError);
          throw new Error(`Failed to remove friend from trips: ${removeError.message}`);
        }
      }
      
      // Check if friend has any expenses
      const { data: paidExpenses, error: paidExpensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('paid_by', friendId)
        .abortSignal(signal);
      
      if (paidExpensesError) {
        console.error('Error checking paid expenses:', paidExpensesError);
        throw new Error(`Failed to check paid expenses: ${paidExpensesError.message}`);
      }
      
      if (paidExpenses && paidExpenses.length > 0) {
        throw new Error(`Cannot delete friend who has paid for ${paidExpenses.length} expenses. Please reassign or delete these expenses first.`);
      }
      
      // Check if friend is a participant in any expenses
      const { data: expenseParticipations, error: participationsError } = await supabase
        .from('expense_participants')
        .select('*')
        .eq('user_id', friendId)
        .abortSignal(signal);
      
      if (participationsError) {
        console.error('Error checking expense participations:', participationsError);
        throw new Error(`Failed to check expense participations: ${participationsError.message}`);
      }
      
      if (expenseParticipations && expenseParticipations.length > 0) {
        // Remove friend from all expense participations
        const { error: removeParticipationsError } = await supabase
          .from('expense_participants')
          .delete()
          .eq('user_id', friendId)
          .abortSignal(signal);
        
        if (removeParticipationsError) {
          console.error('Error removing friend from expense participations:', removeParticipationsError);
          throw new Error(`Failed to remove friend from expense participations: ${removeParticipationsError.message}`);
        }
      }
      
      // Finally, delete the friend
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', friendId)
        .abortSignal(signal);
      
      if (error) {
        console.error('Error deleting friend:', error);
        throw new Error(`Failed to delete friend: ${error.message}`);
      }
      
      // Update local state
      setFriends(prev => prev.filter(friend => friend.id !== friendId));
      
      return true;
    } catch (err) {
      // Only log error if not aborted
      if (err.name !== 'AbortError') {
        console.error('Error deleting friend:', err.message || JSON.stringify(err));
        throw err;
      }
      return null;
    } finally {
      delete pendingRequests.current[requestId];
    }
  }, []);

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
    addFriend,
    editFriend,
    deleteFriend,
    fetchData,
    refreshDataOnce,
    addTripMember,
    removeTripMember,
    getTripMembers
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
