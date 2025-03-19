'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// Initial friends list
const initialFriends = [
  { id: 1, name: 'Lakshay' },
  { id: 2, name: 'Siddhu' },
  { id: 3, name: 'Shubham' },
  { id: 4, name: 'Vaishakh' }
];

// Create context
const ExpenseContext = createContext();

export function ExpenseProvider({ children }) {
  // Initialize state from localStorage if available, otherwise use defaults
  const [friends] = useState(initialFriends);
  const [trips, setTrips] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTrips = localStorage.getItem('trips');
      return savedTrips ? JSON.parse(savedTrips) : [];
    }
    return [];
  });
  const [expenses, setExpenses] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedExpenses = localStorage.getItem('expenses');
      return savedExpenses ? JSON.parse(savedExpenses) : [];
    }
    return [];
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('trips', JSON.stringify(trips));
      localStorage.setItem('expenses', JSON.stringify(expenses));
    }
  }, [trips, expenses]);

  // Add a new trip
  const addTrip = (trip) => {
    const newTrip = {
      id: Date.now(),
      ...trip,
      createdAt: new Date().toISOString(),
    };
    setTrips([...trips, newTrip]);
    return newTrip.id;
  };

  // Add a new expense
  const addExpense = (expense) => {
    const newExpense = {
      id: Date.now(),
      ...expense,
      createdAt: new Date().toISOString(),
    };
    setExpenses([...expenses, newExpense]);
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
      balances[expense.paidBy] += expense.amount;
      
      // Distribute expense among participants
      const splitAmount = expense.amount / expense.participants.length;
      expense.participants.forEach(participantId => {
        // Subtract split amount from each participant's balance (they owe this money)
        balances[participantId] -= splitAmount;
      });
    });

    return balances;
  };

  // Calculate who owes whom
  const calculateSettlements = () => {
    const balances = calculateBalances();
    const settlements = [];

    // Create arrays of creditors (positive balance) and debtors (negative balance)
    const creditors = Object.entries(balances)
      .filter(([_, balance]) => balance > 0)
      .map(([id, balance]) => ({ id: parseInt(id), balance }))
      .sort((a, b) => b.balance - a.balance);

    const debtors = Object.entries(balances)
      .filter(([_, balance]) => balance < 0)
      .map(([id, balance]) => ({ id: parseInt(id), balance: Math.abs(balance) }))
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
  };

  // Get expenses for a specific trip
  const getExpensesByTrip = (tripId) => {
    return expenses.filter(expense => expense.tripId === tripId);
  };

  // Get a trip by ID
  const getTripById = (tripId) => {
    return trips.find(trip => trip.id === tripId);
  };

  // Get friend by ID
  const getFriendById = (friendId) => {
    return friends.find(friend => friend.id === friendId);
  };

  // Delete an expense
  const deleteExpense = (expenseId) => {
    setExpenses(expenses.filter(expense => expense.id !== expenseId));
  };

  // Delete a trip and its associated expenses
  const deleteTrip = (tripId) => {
    setTrips(trips.filter(trip => trip.id !== tripId));
    setExpenses(expenses.filter(expense => expense.tripId !== tripId));
  };

  return (
    <ExpenseContext.Provider
      value={{
        friends,
        trips,
        expenses,
        addTrip,
        addExpense,
        calculateBalances,
        calculateSettlements,
        getExpensesByTrip,
        getTripById,
        getFriendById,
        deleteExpense,
        deleteTrip
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenseStore() {
  return useContext(ExpenseContext);
}
