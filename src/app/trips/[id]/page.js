'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash, FaShare, FaClipboard, FaCheck } from 'react-icons/fa';
import { useExpenseStore } from '@/store/expenseStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowRight, IndianRupee } from 'lucide-react';

export default function TripDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = parseInt(params.id);
  
  const { 
    getTripById, 
    getExpensesByTrip, 
    getFriendById,
    deleteTrip,
    deleteExpense,
    friends,
    calculateBalances,
    calculateSettlements
  } = useExpenseStore();
  
  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [tripSettlements, setTripSettlements] = useState([]);
  const [tripBalances, setTripBalances] = useState({});
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Calculate settlements specific to this trip
  const calculateTripSettlements = useCallback((tripExpenses) => {
    // Initialize balances for all friends
    const balances = {};
    friends.forEach(friend => {
      balances[friend.id] = 0;
    });

    // Calculate net balance for each friend based on trip expenses only
    tripExpenses.forEach(expense => {
      // Add amount to payer's balance (they are owed this money)
      balances[expense.paidBy] += expense.amount;
      
      // Distribute expense among participants
      const splitAmount = expense.amount / expense.participants.length;
      expense.participants.forEach(participantId => {
        // Subtract split amount from each participant's balance (they owe this money)
        balances[participantId] -= splitAmount;
      });
    });

    setTripBalances(balances);

    // Calculate settlements using the same algorithm as in expenseStore
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

    setTripSettlements(settlements);
  }, [friends, setTripBalances, setTripSettlements]);

  useEffect(() => {
    const tripData = getTripById(tripId);
    if (!tripData) {
      router.push('/trips');
      return;
    }
    
    const tripExpenses = getExpensesByTrip(tripId);
    setTrip(tripData);
    setExpenses(tripExpenses);
    
    // Calculate trip-specific balances and settlements
    calculateTripSettlements(tripExpenses);
  }, [tripId, getTripById, getExpensesByTrip, router, calculateTripSettlements]);

  // Calculate total expenses for this trip
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleShareTrip = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteTrip = () => {
    if (confirmDelete) {
      deleteTrip(tripId);
      router.push('/trips');
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const handleDeleteExpense = (expenseId) => {
    deleteExpense(expenseId);
    const updatedExpenses = getExpensesByTrip(tripId);
    setExpenses(updatedExpenses);
    calculateTripSettlements(updatedExpenses);
  };

  if (!trip) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading trip details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{trip.name}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {new Date(trip.date).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleShareTrip}
          >
            {copied ? <FaCheck /> : <FaShare />}
            {copied ? 'Copied!' : 'Share Trip'}
          </Button>
          
          <Link href={`/expenses/new?tripId=${tripId}`}>
            <Button className="flex items-center gap-2">
              <FaPlus /> Add Expense
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleDeleteTrip}
          >
            <FaTrash />
            {confirmDelete ? 'Confirm Delete' : 'Delete Trip'}
          </Button>
        </div>
      </div>
      
      {trip.description && (
        <Card>
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p>{trip.description}</p>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center p-6">
          <div className="flex justify-center items-center mb-3">
            <IndianRupee className="text-4xl text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Total Expenses</h3>
          <p className="text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
        </Card>
        
        <Card className="text-center p-6">
          <h3 className="text-lg font-medium mb-2">Expenses Count</h3>
          <p className="text-3xl font-bold">{expenses.length}</p>
        </Card>
        
        <Card className="text-center p-6 cursor-pointer" onClick={handleShareTrip}>
          <h3 className="text-lg font-medium mb-2">Share Trip</h3>
          <div className="flex items-center justify-center gap-2 text-primary">
            <FaClipboard className="text-xl" />
            <span>Copy Link</span>
          </div>
        </Card>
      </div>
      
      {/* Settlements Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Settlements</h2>
        
        {tripSettlements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tripSettlements.map((settlement, index) => (
              <Card key={index} className="p-4" elevation="medium">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-lg font-semibold">{getFriendById(settlement.from)?.name}</p>
                    <p className="text-sm text-gray-500">pays</p>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="text-xl font-bold text-primary flex items-center">
                      <IndianRupee className="h-5 w-5 mr-1" />
                      {settlement.amount.toFixed(2)}
                    </div>
                    <ArrowRight className="mx-2 text-gray-400" />
                  </div>
                  
                  <div className="text-center sm:text-right">
                    <p className="text-lg font-semibold">{getFriendById(settlement.to)?.name}</p>
                    <p className="text-sm text-gray-500">receives</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center p-8">
            <p className="text-gray-500">Everyone is settled up! No payments needed.</p>
          </Card>
        )}
      </div>
      
      {/* Individual Balances */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Individual Balances</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {friends.map(friend => {
            const balance = tripBalances[friend.id] || 0;
            const isPositive = balance > 0;
            const isNegative = balance < 0;
            
            return (
              <Card 
                key={friend.id} 
                className={`p-4 ${
                  isPositive 
                    ? 'border-l-4 border-success' 
                    : isNegative 
                      ? 'border-l-4 border-error' 
                      : ''
                }`}
                elevation="medium"
              >
                <h3 className="font-semibold text-lg mb-2">{friend.name}</h3>
                <div className={`text-xl font-bold flex items-center ${
                  isPositive 
                    ? 'lending' 
                    : isNegative 
                      ? 'borrowing' 
                      : ''
                }`}>
                  <IndianRupee className="h-5 w-5 mr-1" />
                  {Math.abs(balance).toFixed(2)}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {isPositive 
                    ? 'will receive' 
                    : isNegative 
                      ? 'owes' 
                      : 'settled up'}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Expenses</h2>
        
        {expenses.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">Description</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Paid By</th>
                    <th className="text-left py-3 px-4">Split Between</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <motion.tr 
                      key={expense.id} 
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      layout
                    >
                      <td className="py-3 px-4">{expense.description}</td>
                      <td className="py-3 px-4 font-medium">
                        <div className="flex items-center">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          {expense.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getFriendById(expense.paidBy)?.name}
                      </td>
                      <td className="py-3 px-4">
                        {expense.participants.map(id => 
                          getFriendById(id)?.name
                        ).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(expense.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <button 
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete expense"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="text-center p-8">
            <p className="text-gray-500">No expenses yet. Add your first expense!</p>
            <div className="mt-4">
              <Link href={`/expenses/new?tripId=${tripId}`}>
                <Button>
                  <FaPlus className="mr-2" /> Add Expense
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
      
      <div className="flex justify-center mt-8">
        <Link href="/trips">
          <Button variant="outline">Back to Trips</Button>
        </Link>
      </div>
    </div>
  );
}
