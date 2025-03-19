'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaPlus, FaWallet, FaUsers } from 'react-icons/fa';
import { useExpenseStore } from '@/store/expenseStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { IndianRupee } from 'lucide-react';

// Client component
function HomeContent() {
  const { trips, expenses, friends, calculateSettlements } = useExpenseStore();
  const [settlements, setSettlements] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);

  useEffect(() => {
    // Calculate settlements
    const calculatedSettlements = calculateSettlements();
    setSettlements(calculatedSettlements);

    // Get recent trips (last 3)
    const sortedTrips = [...trips].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    ).slice(0, 3);
    setRecentTrips(sortedTrips);
    
    // Get recent expenses (last 5)
    const sortedExpenses = [...expenses].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    ).slice(0, 5);
    setRecentExpenses(sortedExpenses);
  }, [trips, expenses, calculateSettlements]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get friend name by ID
  const getFriendName = (friendId) => {
    const friend = friends.find(f => f.id === friendId);
    return friend ? friend.name : 'Unknown';
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center p-6">
          <div className="flex justify-center items-center mb-3">
            <IndianRupee className="text-4xl text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Total Expenses</h3>
          <p className="text-3xl font-bold">
            {formatCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0))}
          </p>
        </Card>
        
        <Card className="text-center p-6">
          <div className="flex justify-center items-center mb-3">
            <FaWallet className="text-4xl text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Total Trips</h3>
          <p className="text-3xl font-bold">{trips.length}</p>
        </Card>
        
        <Card className="text-center p-6">
          <div className="flex justify-center items-center mb-3">
            <FaUsers className="text-4xl text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Friends</h3>
          <p className="text-3xl font-bold">{friends.length}</p>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Recent Trips</h2>
            <Link href="/trips">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          
          {recentTrips.length > 0 ? (
            <div className="space-y-4">
              {recentTrips.map(trip => (
                <Link key={trip.id} href={`/trips/${trip.id}`}>
                  <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow duration-300">
                    <h3 className="font-semibold text-lg">{trip.name}</h3>
                    <p className="text-gray-500 text-sm">
                      {new Date(trip.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-gray-500 mb-4">No trips added yet</p>
              <Link href="/trips/new">
                <Button className="flex items-center gap-2">
                  <FaPlus /> Add Trip
                </Button>
              </Link>
            </Card>
          )}
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Recent Expenses</h2>
            <Link href="/dashboard">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          
          {recentExpenses.length > 0 ? (
            <div className="space-y-4">
              {recentExpenses.map(expense => (
                <Card key={expense.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{expense.description}</h3>
                      <p className="text-sm text-gray-500">
                        Paid by {getFriendName(expense.paidBy)}
                      </p>
                    </div>
                    <div className="text-lg font-bold flex items-center">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      {expense.amount.toFixed(2)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-gray-500 mb-4">No expenses added yet</p>
              <Link href="/expenses/new">
                <Button className="flex items-center gap-2">
                  <FaPlus /> Add Expense
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Settlements</h2>
          <Link href="/dashboard">
            <Button variant="outline">View Details</Button>
          </Link>
        </div>
        
        {settlements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settlements.slice(0, 4).map((settlement, index) => (
              <Card key={index} className="p-4" elevation="medium">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-lg font-semibold">{getFriendName(settlement.from)}</p>
                    <p className="text-sm text-gray-500">pays</p>
                  </div>
                  
                  <div className="text-xl font-bold text-primary flex items-center">
                    <IndianRupee className="h-5 w-5 mr-1" />
                    {settlement.amount.toFixed(2)}
                  </div>
                  
                  <div className="text-center sm:text-right">
                    <p className="text-lg font-semibold">{getFriendName(settlement.to)}</p>
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
    </div>
  );
}

// Loading fallback component
function HomeLoading() {
  return (
    <div className="space-y-8">
      <Card className="p-6 text-center" elevation="medium">
        <p>Loading data...</p>
      </Card>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}
