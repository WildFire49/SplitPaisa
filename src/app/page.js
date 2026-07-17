'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaWallet, FaUsers, FaCalendarAlt, FaTag, FaArrowRight, FaExchangeAlt, FaMagic, FaCheck, FaMoneyBillWave, FaInfoCircle } from 'react-icons/fa';
import { useExpenseStore } from '@/store/expenseStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { IndianRupee } from 'lucide-react';

// Client component
function HomeContent() {
  const { 
    trips, 
    expenses, 
    friends, 
    fetchData, 
    calculateBalances, 
    calculateSettlements,
    calculateSmartSettlements,
    markSettlementAsSettled,
    isSettlementSettled,
    refreshDataOnce,
    expenseParticipants,
    currentUser
  } = useExpenseStore();
  
  const [settlements, setSettlements] = useState([]);
  const [smartSettlements, setSmartSettlements] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settlementType, setSettlementType] = useState('smart');
  const [settledPayments, setSettledPayments] = useState({
    regular: {},
    smart: {}
  });

  // Track if data has been fetched to prevent duplicate API calls
  const dataFetched = useRef(false);
  const pendingRequest = useRef(false);

  const refreshData = useCallback(async () => {
    // Prevent duplicate API calls
    if (pendingRequest.current) {
      console.log('Home data fetch already in progress, skipping duplicate call');
      return;
    }
    
    pendingRequest.current = true;
    setIsLoading(true);
    
    try {
      await refreshDataOnce(); // Use the refreshDataOnce function from expenseStore
      dataFetched.current = true;
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
      pendingRequest.current = false;
    }
  }, [refreshDataOnce]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    // Listen for changes in the expense store data
    if (expenses.length > 0 && dataFetched.current) {
      console.log('Expenses changed, refreshing data');
      // We'll use a timeout to avoid immediate refresh during rendering
      const timer = setTimeout(() => {
        refreshData();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [expenses, refreshData]);

  useEffect(() => {
    if (!trips || !expenses) return;
    
    try {
      // Calculate settlements
      const calculatedSettlements = calculateSettlements();
      setSettlements(calculatedSettlements || []);
      
      // Calculate smart settlements
      const calculatedSmartSettlements = calculateSmartSettlements();
      setSmartSettlements(calculatedSmartSettlements || []);

      // Load settlement status from localStorage
      const regularSettled = {};
      const smartSettled = {};
      
      if (calculatedSettlements) {
        calculatedSettlements.forEach((settlement, index) => {
          regularSettled[index] = isSettlementSettled(`${settlement.from}_${settlement.to}`, 'regular');
        });
      }
      
      if (calculatedSmartSettlements) {
        calculatedSmartSettlements.forEach((settlement, index) => {
          smartSettled[index] = isSettlementSettled(`${settlement.from}_${settlement.to}`, 'smart');
        });
      }
      
      setSettledPayments({
        regular: regularSettled,
        smart: smartSettled
      });

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
  }, [trips, expenses, calculateSettlements, calculateSmartSettlements, isSettlementSettled]);

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

  // Get settlements for a specific friend
  const getSettlementsForFriend = (friendId) => {
    // Get settlements where this friend is either paying or receiving
    return settlements.filter(s => s.from === friendId || s.to === friendId);
  };

  // Get smart settlements for a specific friend
  const getSmartSettlementsForFriend = (friendId) => {
    // Get smart settlements where this friend is either paying or receiving
    return smartSettlements.filter(s => s.from === friendId || s.to === friendId);
  };

  // State for the active tab in settlements
  const [activeSettlementTab, setActiveSettlementTab] = useState('all');
  
  // Calculate total settlements amount (excluding settled ones)
  const calculateTotalSettlements = (type = 'regular') => {
    const settlementList = type === 'regular' ? settlements : smartSettlements;
    if (!settlementList || settlementList.length === 0) return 0;
    
    let total = 0;
    settlementList.forEach((settlement, index) => {
      // Only include unsettled settlements in the total
      if (!settledPayments[type][index]) {
        total += settlement.amount;
      }
    });
    
    return total;
  };

  // Handle marking a settlement as settled
  const handleMarkSettled = async (settlementIndex, type = 'regular') => {
    try {
      const settlementList = type === 'regular' ? settlements : smartSettlements;
      if (!settlementList || settlementList.length <= settlementIndex) return;
      
      const settlement = settlementList[settlementIndex];
      const isCurrentlySettled = settledPayments[type][settlementIndex];
      const settlementId = `${settlement.from}_${settlement.to}`;
      
      // Toggle the settlement status
      await markSettlementAsSettled(settlementId, !isCurrentlySettled, type);
      
      // Update local state
      setSettledPayments(prev => {
        const newSettled = { ...prev };
        newSettled[type] = { ...newSettled[type] };
        newSettled[type][settlementIndex] = !isCurrentlySettled;
        return newSettled;
      });
    } catch (error) {
      console.error('Error marking settlement as settled:', error);
    }
  };

  // Check if all settlements are marked as settled
  const areAllSettlementsSettled = (type = 'regular') => {
    const settlementList = type === 'regular' ? settlements : smartSettlements;
    if (settlementList.length === 0) return false;
    
    for (let i = 0; i < settlementList.length; i++) {
      if (!settledPayments[type][i]) {
        return false;
      }
    }
    return true;
  };

  // Get trip total
  const getTripTotal = (tripId) => {
    if (!expenses) return 0;
    return expenses
      .filter(expense => expense.trip_id === tripId)
      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  };

  // Get user's share in a trip
  const getTripUserShare = (tripId) => {
    if (!expenses || !friends) return 0;
    
    let userShare = 0;
    const tripExpenses = expenses.filter(expense => expense.trip_id === tripId);
    
    tripExpenses.forEach(expense => {
      // Find the expense participants
      const participants = expenseParticipants.filter(p => p.expense_id === expense.id);
      if (!participants) return;
      
      // Find the current user's participant record
      const currentUserParticipant = participants.find(p => p.user_id === currentUser?.id);
      if (currentUserParticipant) {
        userShare += parseFloat(currentUserParticipant.share);
      }
    });
    
    return userShare;
  };

  // Get initials from a name
  const getInitials = (name) => {
    if (!name) return '';
    const parts = name.split(' ');
    return parts[0].charAt(0) + (parts.length > 1 ? parts[1].charAt(0) : '');
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
                  <Card className="p-5 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <FaTag className="text-primary mr-2" />
                        <h3 className="text-lg font-semibold">{trip.name}</h3>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(trip.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white mr-3">
                          {getInitials(trip.created_by_name || 'User')}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{trip.created_by_name || 'Vaishakh'}</p>
                          <p className="text-xs text-gray-500">Created by</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center">
                          <span className="font-bold text-lg">{formatCurrency(getTripTotal(trip.id))}</span>
                          <div className="ml-1 group relative">
                            <FaInfoCircle className="text-gray-400 cursor-pointer hover:text-primary transition-colors" size={14} />
                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-white dark:bg-gray-800 rounded-md shadow-lg text-xs text-gray-600 dark:text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
                              <p className="font-semibold mb-1">Trip Expense Breakdown:</p>
                              <p>Total: {formatCurrency(getTripTotal(trip.id))}</p>
                              <p>Your Share: {formatCurrency(getTripUserShare(trip.id))}</p>
                              <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-gray-800"></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">Total expenses</p>
                      </div>
                    </div>
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text">Settlements</h2>
          <Link href="/dashboard">
            <Button variant="outline" className="border-primary hover:bg-primary/10 transition-all duration-300">
              <span className="mr-2">View Details</span>
              <FaArrowRight size={12} />
            </Button>
          </Link>
        </div>
        
        {(settlements.length > 0 || smartSettlements.length > 0) ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
          >
            {/* Settlement type selector */}
            <div className="mb-6 flex justify-center">
              <div className="inline-flex rounded-md shadow-sm p-1 bg-gray-100 dark:bg-gray-800">
              <button
                  onClick={() => setSettlementType('smart')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                    settlementType === 'smart'
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-primary'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <FaMagic className="inline mr-2" size={14} />
                  Smart Settlements
                </button>
                <button
                  onClick={() => setSettlementType('regular')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                    settlementType === 'regular'
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-primary'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <FaExchangeAlt className="inline mr-2" size={14} />
                  Regular Settlements
                </button>
                
              </div>
            </div>

            {/* All Settled Message */}
            {areAllSettlementsSettled(settlementType) && (
              <div className="mb-6 text-center">
                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-4 rounded-lg inline-flex items-center">
                  <FaCheck className="mr-2" />
                  <span className="font-medium">All payments have been settled! No settlements needed.</span>
                </div>
              </div>
            )}
            
            {/* Tabs for settlements */}
            <div className="mb-6 border-b border-gray-200/50 dark:border-gray-700/50 pb-1 overflow-x-auto hide-scrollbar">
              <ul className="flex flex-nowrap text-sm font-medium text-center">
                <li className="mr-1">
                  <button
                    onClick={() => setActiveSettlementTab('all')}
                    className={`inline-block px-6 py-3 rounded-t-lg transition-all duration-300 ${
                      activeSettlementTab === 'all'
                        ? 'text-white bg-gradient-to-r from-primary to-purple-500 shadow-md'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <FaExchangeAlt className="inline mr-2" size={14} />
                    All Settlements
                  </button>
                </li>
                {friends.map(friend => (
                  <li key={friend.id} className="mr-1">
                    <button
                      onClick={() => setActiveSettlementTab(friend.id)}
                      className={`inline-block px-6 py-3 rounded-t-lg transition-all duration-300 ${
                        activeSettlementTab === friend.id
                          ? 'text-white bg-gradient-to-r from-primary to-purple-500 shadow-md'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <div className="inline-flex items-center">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white mr-2 text-xs shadow-sm">
                          {friend.name.charAt(0)}
                        </div>
                        {friend.name}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Settlement content based on active tab and settlement type */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={`${activeSettlementTab}-${settlementType}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {activeSettlementTab === 'all' ? (
                  // Show all settlements (limited to 4)
                  settlementType === 'regular' ? (
                    // Regular settlements
                    settlements.slice(0, 4).map((settlement, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className={`p-5 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-white dark:bg-gray-800 border-0 relative ${settledPayments.regular[index] ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-purple-500"></div>
                          {settledPayments.regular[index] && (
                            <div className="absolute top-1 right-1">
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300 flex items-center">
                                <FaCheck className="mr-1" size={10} />
                                Settled
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="text-center sm:text-left">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white mx-auto sm:mx-0 mb-2 sm:mb-0 shadow-md">
                                {getFriendName(settlement.from).charAt(0)}
                              </div>
                              <p className="text-lg font-semibold mt-2">{getFriendName(settlement.from)}</p>
                              <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start">
                                <span className="mr-1">pays</span>
                                <FaArrowRight size={10} className="text-gray-400" />
                              </p>
                            </div>
                            
                            <div className="text-xl font-bold text-primary bg-primary/10 px-4 py-2 rounded-full flex items-center shadow-inner">
                              <IndianRupee className="h-5 w-5 mr-1" />
                              {settlement.amount.toFixed(2)}
                            </div>
                            
                            <div className="text-center sm:text-right">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white mx-auto sm:mx-0 mb-2 sm:mb-0 shadow-md">
                                {getFriendName(settlement.to).charAt(0)}
                              </div>
                              <p className="text-lg font-semibold mt-2">{getFriendName(settlement.to)}</p>
                              <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-end">
                                <FaArrowRight size={10} className="text-gray-400 rotate-180 mr-1" />
                                <span>receives</span>
                              </p>
                            </div>
                          </div>
                          
                          {/* Mark as Settled Button */}
                          <div className="mt-4 text-center">
                            <Button
                              variant={settledPayments.regular[index] ? "success" : "outline"}
                              size="sm"
                              onClick={() => handleMarkSettled(index, 'regular')}
                              className="flex items-center mx-auto"
                            >
                              {settledPayments.regular[index] ? (
                                <>
                                  <FaCheck className="mr-2" />
                                  Marked as Settled
                                </>
                              ) : (
                                <>
                                  <FaMoneyBillWave className="mr-2" />
                                  Mark as Settled
                                </>
                              )}
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    // Smart settlements
                    smartSettlements.slice(0, 4).map((settlement, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className={`p-5 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-white dark:bg-gray-800 border-0 relative ${settledPayments.smart[index] ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
                          <div className="absolute top-1 right-1">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300 flex items-center">
                              <FaMagic className="mr-1" size={10} />
                              Smart
                            </span>
                          </div>
                          {settledPayments.smart[index] && (
                            <div className="absolute top-1 right-20">
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300 flex items-center">
                                <FaCheck className="mr-1" size={10} />
                                Settled
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="text-center sm:text-left">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white mx-auto sm:mx-0 mb-2 sm:mb-0 shadow-md">
                                {getFriendName(settlement.from).charAt(0)}
                              </div>
                              <p className="text-lg font-semibold mt-2">{getFriendName(settlement.from)}</p>
                              <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start">
                                <span className="mr-1">pays</span>
                                <FaArrowRight size={10} className="text-gray-400" />
                              </p>
                            </div>
                            
                            <div className="text-xl font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 px-4 py-2 rounded-full flex items-center shadow-inner">
                              <IndianRupee className="h-5 w-5 mr-1" />
                              {settlement.amount.toFixed(2)}
                            </div>
                            
                            <div className="text-center sm:text-right">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white mx-auto sm:mx-0 mb-2 sm:mb-0 shadow-md">
                                {getFriendName(settlement.to).charAt(0)}
                              </div>
                              <p className="text-lg font-semibold mt-2">{getFriendName(settlement.to)}</p>
                              <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-end">
                                <FaArrowRight size={10} className="text-gray-400 rotate-180 mr-1" />
                                <span>receives</span>
                              </p>
                            </div>
                          </div>
                          
                          {/* Mark as Settled Button */}
                          <div className="mt-4 text-center">
                            <Button
                              variant={settledPayments.smart[index] ? "success" : "outline"}
                              size="sm"
                              onClick={() => handleMarkSettled(index, 'smart')}
                              className="flex items-center mx-auto"
                            >
                              {settledPayments.smart[index] ? (
                                <>
                                  <FaCheck className="mr-2" />
                                  Marked as Settled
                                </>
                              ) : (
                                <>
                                  <FaMoneyBillWave className="mr-2" />
                                  Mark as Settled
                                </>
                              )}
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))
                  )
                ) : (
                  // Show settlements for the selected friend
                  settlementType === 'regular' ? (
                    // Regular settlements for selected friend
                    getSettlementsForFriend(activeSettlementTab).length > 0 ? (
                      getSettlementsForFriend(activeSettlementTab).map((settlement, index) => {
                        const isReceiving = settlement.to === activeSettlementTab;
                        
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card className={`p-5 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-white dark:bg-gray-800 border-0 relative ${settledPayments.regular[index] ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                              <div className={`absolute top-0 left-0 w-1 h-full ${isReceiving ? 'bg-gradient-to-b from-green-500 to-green-700' : 'bg-gradient-to-b from-red-500 to-red-700'}`}></div>
                              {settledPayments.regular[index] && (
                                <div className="absolute top-1 right-1">
                                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300 flex items-center">
                                    <FaCheck className="mr-1" size={10} />
                                    Settled
                                  </span>
                                </div>
                              )}
                              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                {isReceiving ? (
                                  // This friend is receiving money
                                  <>
                                    <div className="text-center sm:text-left">
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white mx-auto sm:mx-0 mb-2 sm:mb-0 shadow-md">
                                        {getFriendName(settlement.from).charAt(0)}
                                      </div>
                                      <p className="text-lg font-semibold mt-2">{getFriendName(settlement.from)}</p>
                                      <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start">
                                        <span className="mr-1">pays</span>
                                        <FaArrowRight size={10} className="text-gray-400" />
                                      </p>
                                    </div>
                                    
                                    <div className="text-xl font-bold text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-300 px-4 py-2 rounded-full flex items-center shadow-inner">
                                      <IndianRupee className="h-5 w-5 mr-1" />
                                      {settlement.amount.toFixed(2)}
                                    </div>
                                    
                                    <div className="text-center sm:text-right">
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white mx-auto sm:mx-0 mb-2 sm:mb-0 shadow-md">
                                        <span className="text-xl">You</span>
                                      </div>
                                      <p className="text-lg font-semibold mt-2">You</p>
                                      <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-end">
                                        <FaArrowRight size={10} className="text-gray-400 rotate-180 mr-1" />
                                        <span>receive</span>
                                      </p>
                                    </div>
                                  </>
                                ) : (
                                  // This friend is paying money
                                  <>
                                    <div className="text-center sm:text-left">
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white mx-auto sm:mx-0 mb-2 sm:mb-0 shadow-md">
                                        <span className="text-xl">You</span>
                                      </div>
                                      <p className="text-lg font-semibold mt-2">You</p>
                                      <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start">
                                        <span className="mr-1">pay</span>
                                        <FaArrowRight size={10} className="text-gray-400" />
                                      </p>
                                    </div>
                                    
                                    <div className="text-xl font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-4 py-2 rounded-full flex items-center shadow-inner">
                                      <IndianRupee className="h-5 w-5 mr-1" />
                                      {settlement.amount.toFixed(2)}
                                    </div>
                                    
                                    <div className="text-center sm:text-right">
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white mx-auto sm:mx-0 mb-2 sm:mb-0 shadow-md">
                                        {getFriendName(settlement.to).charAt(0)}
                                      </div>
                                      <p className="text-lg font-semibold mt-2">{getFriendName(settlement.to)}</p>
                                      <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-end">
                                        <FaArrowRight size={10} className="text-gray-400 rotate-180 mr-1" />
                                        <span>receives</span>
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              {/* Mark as Settled Button */}
                              <div className="mt-4 text-center">
                                <Button
                                  variant={settledPayments.regular[index] ? "success" : "outline"}
                                  size="sm"
                                  onClick={() => handleMarkSettled(index, 'regular')}
                                  className="flex items-center mx-auto"
                                >
                                  {settledPayments.regular[index] ? (
                                    <>
                                      <FaCheck className="mr-2" />
                                      Marked as Settled
                                    </>
                                  ) : (
                                    <>
                                      <FaMoneyBillWave className="mr-2" />
                                      Mark as Settled
                                    </>
                                  )}
                                </Button>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="col-span-1 md:col-span-2"
                      >
                        <Card className="text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-0 shadow-md">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-lg">
                            <span className="font-semibold">{getFriendName(activeSettlementTab)}</span> is all settled up!
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 mt-2">No payments needed at this time.</p>
                        </Card>
                      </motion.div>
                    )
                  ) : (
                    // Smart settlements for selected friend
                    getSmartSettlementsForFriend(activeSettlementTab).length > 0 ? (
                      getSmartSettlementsForFriend(activeSettlementTab).map((settlement, index) => {
                        const isReceiving = settlement.to === activeSettlementTab;
                        
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card className={`p-5 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-white dark:bg-gray-800 border-0 relative ${settledPayments.smart[index] ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                              <div className={`absolute top-0 left-0 w-1 h-full ${isReceiving ? 'bg-gradient-to-b from-blue-500 to-blue-700' : 'bg-gradient-to-b from-indigo-500 to-indigo-700'}`}></div>
                              <div className="absolute top-1 right-1">
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300 flex items-center">
                                  <FaMagic className="mr-1" size={10} />
                                  Smart
                                </span>
                              </div>
                              {settledPayments.smart[index] && (
                                <div className="absolute top-1 right-20">
                                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300 flex items-center">
                                    <FaCheck className="mr-1" size={10} />
                                    Settled
                                  </span>
                                </div>
                              )}
                              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                {isReceiving ? (
                                  // This friend is receiving money
                                  <>
                                    <div className="text-center sm:text-left">
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white mx-auto sm:mx-0 mb-2 sm:mb-0 shadow-md">
                                        {getFriendName(settlement.from).charAt(0)}
                                      </div>
                                      <p className="text-lg font-semibold mt-2">{getFriendName(settlement.from)}</p>
                                      <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start">
                                        <span className="mr-1">pays</span>
                                        <FaArrowRight size={10} className="text-gray-400" />
                                      </p>
                                    </div>
                                    
                                    <div className="text-xl font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 px-4 py-2 rounded-full flex items-center shadow-inner">
                                      <IndianRupee className="h-5 w-5 mr-1" />
                                      {settlement.amount.toFixed(2)}
                                    </div>
                                    
                                    <div className="text-center sm:text-right">
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white mx-auto sm:mx-0 mb-2 sm:mb-0 shadow-md">
                                        <span className="text-xl">You</span>
                                      </div>
                                      <p className="text-lg font-semibold mt-2">You</p>
                                      <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-end">
                                        <FaArrowRight size={10} className="text-gray-400 rotate-180 mr-1" />
                                        <span>receive</span>
                                      </p>
                                    </div>
                                  </>
                                ) : (
                                  // This friend is paying money
                                  <>
                                    <div className="text-center sm:text-left">
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white mx-auto sm:mx-0 mb-2 sm:mb-0 shadow-md">
                                        <span className="text-xl">You</span>
                                      </div>
                                      <p className="text-lg font-semibold mt-2">You</p>
                                      <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start">
                                        <span className="mr-1">pay</span>
                                        <FaArrowRight size={10} className="text-gray-400" />
                                      </p>
                                    </div>
                                    
                                    <div className="text-xl font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 px-4 py-2 rounded-full flex items-center shadow-inner">
                                      <IndianRupee className="h-5 w-5 mr-1" />
                                      {settlement.amount.toFixed(2)}
                                    </div>
                                    
                                    <div className="text-center sm:text-right">
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white mx-auto sm:mx-0 mb-2 sm:mb-0 shadow-md">
                                        {getFriendName(settlement.to).charAt(0)}
                                      </div>
                                      <p className="text-lg font-semibold mt-2">{getFriendName(settlement.to)}</p>
                                      <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-end">
                                        <FaArrowRight size={10} className="text-gray-400 rotate-180 mr-1" />
                                        <span>receives</span>
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              {/* Mark as Settled Button */}
                              <div className="mt-4 text-center">
                                <Button
                                  variant={settledPayments.smart[index] ? "success" : "outline"}
                                  size="sm"
                                  onClick={() => handleMarkSettled(index, 'smart')}
                                  className="flex items-center mx-auto"
                                >
                                  {settledPayments.smart[index] ? (
                                    <>
                                      <FaCheck className="mr-2" />
                                      Marked as Settled
                                    </>
                                  ) : (
                                    <>
                                      <FaMoneyBillWave className="mr-2" />
                                      Mark as Settled
                                    </>
                                  )}
                                </Button>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="col-span-1 md:col-span-2"
                      >
                        <Card className="text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-0 shadow-md">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <FaMagic className="h-8 w-8" />
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-lg">
                            <span className="font-semibold">{getFriendName(activeSettlementTab)}</span> is all settled up!
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 mt-2">No smart payments needed at this time.</p>
                        </Card>
                      </motion.div>
                    )
                  )
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-0 shadow-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-lg font-semibold">Everyone is settled up!</p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">No payments needed at this time.</p>
            </Card>
          </motion.div>
        )}
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total Settlements</h3>
          <div className="flex items-center">
            <div className="group relative">
              <FaInfoCircle className="text-gray-400 cursor-pointer hover:text-primary transition-colors mr-2" size={14} />
              <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-white dark:bg-gray-800 rounded-md shadow-lg text-xs text-gray-600 dark:text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
                <p className="font-semibold mb-1">About Settlements:</p>
                <p className="mb-2">Settlements show who owes money to whom based on all expenses across trips.</p>
                <p className="mb-1"><span className="font-medium">Regular:</span> Minimizes the number of transactions but may involve more people.</p>
                <p><span className="font-medium">Smart:</span> Optimizes for simpler payments between fewer people.</p>
                <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-gray-800"></div>
              </div>
            </div>
            {areAllSettlementsSettled(settlementType) ? (
              <span className="text-green-600 dark:text-green-400 font-medium flex items-center">
                <FaCheck className="mr-1" size={12} />
                No settlements needed
              </span>
            ) : (
              <span className="text-xl font-bold text-primary">
                <IndianRupee className="h-5 w-5 inline mr-1" />
                {formatCurrency(calculateTotalSettlements(settlementType))}
              </span>
            )}
          </div>
        </div>
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
