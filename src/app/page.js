'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaPlus, FaWallet, FaUsers, FaCalendarAlt, FaTag, FaArrowRight } from 'react-icons/fa';
import { useExpenseStore } from '@/store/expenseStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { IndianRupee } from 'lucide-react';

// Client component
function HomeContent() {
  const { trips, expenses, friends, calculateSettlements, fetchData } = useExpenseStore();
  const [settlements, setSettlements] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Track if data has been fetched to prevent duplicate API calls
  const dataFetched = useRef(false);
  const pendingRequest = useRef(false);

  useEffect(() => {
    // Refresh data when component mounts
    const refreshData = async () => {
      // Prevent duplicate API calls
      if (pendingRequest.current) {
        console.log('Home data fetch already in progress, skipping duplicate call');
        return;
      }
      
      // Skip if data is already fetched
      if (dataFetched.current) {
        console.log('Home data already fetched, skipping fetch');
        setIsLoading(false);
        return;
      }
      
      pendingRequest.current = true;
      setIsLoading(true);
      
      try {
        await fetchData();
        // Mark data as fetched
        dataFetched.current = true;
      } catch (error) {
        console.error('Error refreshing data:', error);
      } finally {
        setIsLoading(false);
        pendingRequest.current = false;
      }
    };
    
    refreshData();
  }, [fetchData]);

  useEffect(() => {
    if (!trips || !expenses) return;
    
    try {
      // Calculate settlements
      const calculatedSettlements = calculateSettlements();
      setSettlements(calculatedSettlements || []);

      // Get recent trips (last 3)
      if (trips && trips.length > 0) {
        const sortedTrips = [...trips]
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .slice(0, 3);
        setRecentTrips(sortedTrips);
      }
      
      // Get recent expenses (last 5)
      if (expenses && expenses.length > 0) {
        const sortedExpenses = [...expenses]
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .slice(0, 5);
        setRecentExpenses(sortedExpenses);
      }
    } catch (error) {
      console.error('Error processing data in HomeContent:', error);
    }
  }, [trips, expenses, calculateSettlements]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
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
            <Link href="/expenses/new">
              <Button variant="outline">Add New</Button>
            </Link>
          </div>
          
          {recentExpenses.length > 0 ? (
            <div className="space-y-3 max-h-[350px] overflow-auto pr-2">
              {recentExpenses.map((expense, index) => (
                <motion.div 
                  key={expense.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-500 mr-3">
                      {expense.category === 'Food' ? (
                        <FaTag className="text-sm" />
                      ) : expense.category === 'Transport' ? (
                        <FaTag className="text-sm" />
                      ) : (
                        <FaTag className="text-sm" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <FaCalendarAlt className="mr-1" size={10} />
                        <span>{formatDate(expense.created_at || expense.date)}</span>
                        <span className="mx-1">•</span>
                        <span>Paid by {getFriendName(expense.paid_by || expense.paidBy)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-right">
                    ₹{parseFloat(expense.amount).toFixed(2)}
                  </div>
                </motion.div>
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
