'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaPlus, FaWallet, FaRupeeSign, FaUsers } from 'react-icons/fa';
import { useExpenseStore } from '@/store/expenseStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function Home() {
  const { trips, expenses, friends, calculateSettlements } = useExpenseStore();
  const [settlements, setSettlements] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);

  useEffect(() => {
    // Calculate settlements
    const calculatedSettlements = calculateSettlements();
    setSettlements(calculatedSettlements);

    // Get recent trips (up to 3)
    const sortedTrips = [...trips].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ).slice(0, 3);
    setRecentTrips(sortedTrips);

    // Get recent expenses (up to 5)
    const sortedExpenses = [...expenses].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ).slice(0, 5);
    setRecentExpenses(sortedExpenses);
  }, [trips, expenses, calculateSettlements]);

  // Helper function to get friend name by ID
  const getFriendName = (id) => {
    const friend = friends.find(f => f.id === id);
    return friend ? friend.name : 'Unknown';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center py-8"
      >
        <h1 className="text-4xl font-bold mb-4">Split Expenses with Friends</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Track, manage, and settle expenses easily with SplitRupee
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/trips/new">
            <Button className="flex items-center gap-2">
              <FaPlus /> Create New Trip
            </Button>
          </Link>
          <Link href="/expenses/new">
            <Button variant="secondary" className="flex items-center gap-2">
              <FaRupeeSign /> Add Expense
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center p-6">
          <FaWallet className="text-4xl text-primary mx-auto mb-3" />
          <h3 className="text-xl font-semibold mb-2">Total Trips</h3>
          <p className="text-3xl font-bold">{trips.length}</p>
        </Card>
        
        <Card className="text-center p-6">
          <FaRupeeSign className="text-4xl text-secondary mx-auto mb-3" />
          <h3 className="text-xl font-semibold mb-2">Total Expenses</h3>
          <p className="text-3xl font-bold">{expenses.length}</p>
        </Card>
        
        <Card className="text-center p-6">
          <FaUsers className="text-4xl text-accent mx-auto mb-3" />
          <h3 className="text-xl font-semibold mb-2">Friends</h3>
          <p className="text-3xl font-bold">{friends.length}</p>
        </Card>
      </div>

      {/* Recent Trips */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Recent Trips</h2>
          <Link href="/trips">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        
        {recentTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentTrips.map(trip => (
              <Link key={trip.id} href={`/trips/${trip.id}`}>
                <Card className="h-full cursor-pointer hover:border-primary transition-colors">
                  <h3 className="text-xl font-semibold mb-2">{trip.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {trip.description || 'No description'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(trip.date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="text-center p-8">
            <p className="text-gray-500 mb-4">No trips yet</p>
            <Link href="/trips/new">
              <Button>Create Your First Trip</Button>
            </Link>
          </Card>
        )}
      </section>

      {/* Recent Expenses */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Recent Expenses</h2>
        </div>
        
        {recentExpenses.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">Description</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Paid By</th>
                    <th className="text-left py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.map(expense => (
                    <tr 
                      key={expense.id} 
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="py-3 px-4">{expense.description}</td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="py-3 px-4">{getFriendName(expense.paidBy)}</td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(expense.date).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="text-center p-8">
            <p className="text-gray-500 mb-4">No expenses yet</p>
            <Link href="/expenses/new">
              <Button>Add Your First Expense</Button>
            </Link>
          </Card>
        )}
      </section>

      {/* Settlements */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Settlements</h2>
        
        {settlements.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">From</th>
                    <th className="text-left py-3 px-4">To</th>
                    <th className="text-left py-3 px-4">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((settlement, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="py-3 px-4">{getFriendName(settlement.from)}</td>
                      <td className="py-3 px-4">{getFriendName(settlement.to)}</td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(settlement.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="text-center p-8">
            <p className="text-gray-500">No settlements needed</p>
          </Card>
        )}
      </section>
    </div>
  );
}
