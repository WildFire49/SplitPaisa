'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useExpenseStore } from '@/store/expenseStore';
import Card from '@/components/ui/Card';
import ExpenseDistributionChart from '@/components/charts/ExpenseDistributionChart';
import { 
  FaChartPie, 
  FaMoneyBillWave, 
  FaUsers, 
  FaWallet, 
  FaArrowRight, 
  FaCalendarAlt, 
  FaTag, 
  FaExchangeAlt,
  FaHistory,
  FaCheck,
  FaMagic,
  FaInfoCircle,
  FaBalanceScale
} from 'react-icons/fa';
import Link from 'next/link';
import { IndianRupee } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function DashboardPage() {
  return (
    <div>
      <DashboardContent />
    </div>
  );
}

function DashboardContent() {
  const { 
    expenses, 
    friends, 
    trips, 
    fetchData, 
    calculateBalances, 
    calculateBalancesExcludingSettled, 
    calculateSettlements,
    calculateSmartSettlements,
    calculateAllTripSettlements,
    calculateActiveSmartSettlements,
    getActiveTrips,
    getSettledTrips,
    isSettlementSettled
  } = useExpenseStore();
  
  const [stats, setStats] = useState({
    totalExpenses: 0,
    activeExpenses: 0,
    avgExpensePerTrip: 0,
    totalFriends: 0,
    totalTrips: 0,
    activeTrips: 0,
    settledTrips: 0
  });
  const [balances, setBalances] = useState({});
  const [settlements, setSettlements] = useState([]);
  const [smartSettlements, setSmartSettlements] = useState([]);
  const [tripWiseSettlements, setTripWiseSettlements] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [settledTrips, setSettledTrips] = useState([]);
  const [settledSmartPayments, setSettledSmartPayments] = useState({});
  const [activeTab, setActiveTab] = useState('smart'); // 'smart', 'tripWise'
  const dataProcessed = useRef(false);

  useEffect(() => {
    if (!dataProcessed.current) {
      fetchData();
      dataProcessed.current = true;
    }
  }, [fetchData]);

  useEffect(() => {
    if (expenses.length > 0) {
      // Get active and settled trips
      const active = getActiveTrips();
      const settled = getSettledTrips();
      
      setActiveTrips(active);
      setSettledTrips(settled);
      
      // Calculate total expenses (all expenses)
      const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      
      // Calculate active expenses (only from active trips)
      const activeTripIds = active.map(trip => trip.id);
      const activeExpenses = expenses.filter(expense => activeTripIds.includes(expense.trip_id));
      const activeAmount = activeExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      
      // Calculate average per active trip
      const avgPerTrip = active.length > 0 ? activeAmount / active.length : 0;
      
      setStats({
        totalExpenses: totalAmount,
        activeExpenses: activeAmount,
        avgExpensePerTrip: avgPerTrip,
        totalFriends: friends.length,
        totalTrips: trips.length,
        activeTrips: active.length,
        settledTrips: settled.length
      });

      // Get recent expenses (last 5)
      const sortedExpenses = [...expenses].sort((a, b) => 
        new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
      ).slice(0, 5);
      setRecentExpenses(sortedExpenses);

      // Calculate balances and settlements (excluding settled trips)
      const calculatedBalances = calculateBalancesExcludingSettled();
      setBalances(calculatedBalances);
      
      // Calculate trip-wise settlements (only active trips)
      const calculatedTripWiseSettlements = calculateAllTripSettlements();
      setTripWiseSettlements(calculatedTripWiseSettlements);
      
      // Calculate smart settlements (only for active trips)
      const calculatedActiveSmartSettlements = calculateActiveSmartSettlements();
      setSmartSettlements(calculatedActiveSmartSettlements);
      
      // Load settlement status from localStorage
      const smartSettled = {};
      if (calculatedActiveSmartSettlements) {
        calculatedActiveSmartSettlements.forEach((settlement, index) => {
          const settlementId = `${settlement.from}_${settlement.to}`;
          smartSettled[index] = isSettlementSettled(settlementId, 'smart');
        });
      }
      setSettledSmartPayments(smartSettled);
    }
  }, [
    expenses, 
    friends, 
    trips, 
    calculateBalances, 
    calculateBalancesExcludingSettled, 
    calculateSettlements, 
    calculateSmartSettlements,
    calculateAllTripSettlements,
    calculateActiveSmartSettlements,
    getActiveTrips, 
    getSettledTrips, 
    isSettlementSettled
  ]);

  // Helper function to get friend name by ID
  const getFriendName = (id) => {
    const friend = friends.find(f => f.id === id);
    return friend ? friend.name : 'Unknown';
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const statCards = [
    {
      title: 'Active Expenses',
      value: `₹${stats.activeExpenses.toFixed(2)}`,
      icon: <FaMoneyBillWave className="text-xl" />,
      color: 'from-primary-500 to-primary-600',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20'
    },
    {
      title: 'Average per Trip',
      value: `₹${stats.avgExpensePerTrip.toFixed(2)}`,
      icon: <FaWallet className="text-xl" />,
      color: 'from-secondary-500 to-secondary-600',
      bgColor: 'bg-secondary-50 dark:bg-secondary-900/20'
    },
    {
      title: 'Active Trips',
      value: stats.activeTrips,
      icon: <FaChartPie className="text-xl" />,
      color: 'from-tertiary-500 to-tertiary-600',
      bgColor: 'bg-tertiary-50 dark:bg-tertiary-900/20'
    },
    {
      title: 'Settled Trips',
      value: stats.settledTrips,
      icon: <FaHistory className="text-xl" />,
      color: 'from-primary-600 to-secondary-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    }
  ];

  // Calculate settlement ratios for each friend
  const calculateSettlementRatios = () => {
    if (!friends.length) return [];
    
    // Count how many times each friend has paid and received
    const paymentCounts = {};
    
    // Initialize counts for each friend
    friends.forEach(friend => {
      paymentCounts[friend.id] = {
        name: friend.name,
        paid: 0,
        received: 0,
        ratio: 0
      };
    });
    
    // Count from smart settlements
    smartSettlements.forEach(settlement => {
      if (paymentCounts[settlement.from]) {
        paymentCounts[settlement.from].paid += 1;
      }
      if (paymentCounts[settlement.to]) {
        paymentCounts[settlement.to].received += 1;
      }
    });
    
    // Calculate ratios
    Object.keys(paymentCounts).forEach(friendId => {
      const friend = paymentCounts[friendId];
      const total = friend.paid + friend.received;
      friend.ratio = total > 0 ? (friend.paid / total) : 0;
      friend.value = total; // For the pie chart
    });
    
    // Convert to array and sort by total transactions
    return Object.values(paymentCounts)
      .filter(friend => friend.paid + friend.received > 0)
      .sort((a, b) => (b.paid + b.received) - (a.paid + a.received));
  };
  
  const settlementRatios = calculateSettlementRatios();
  
  // Colors for the settlement ratio chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
          Dashboard
        </h1>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className={`p-6 h-full border-t-4 border-t-gradient-${stat.color} shadow-lg hover:shadow-xl transition-shadow ${stat.bgColor}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{stat.title}</p>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-full bg-gradient-to-br ${stat.color} text-white shadow-md`}>
                    {stat.icon}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Expenses */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recent Expenses</h3>
                <Link href="/expenses/new" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
                  Add New
                </Link>
              </div>
              
              <div className="space-y-3 max-h-[350px] overflow-auto pr-2">
                {recentExpenses.length > 0 ? (
                  recentExpenses.map((expense, index) => (
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
                            <span>Paid by {getFriendName(expense.paid_by)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-right">
                        ₹{parseFloat(expense.amount).toFixed(2)}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent expenses</p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Settlements */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 h-full border-t-4 border-blue-500 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold">Settlements</h3>
                  <div className="ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-full flex items-center">
                    <FaMagic className="mr-1" size={10} />
                    <span>Active Trips Only</span>
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <FaInfoCircle className="mr-1" size={12} />
                  <span>Based on active trips only</span>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                <button
                  onClick={() => setActiveTab('smart')}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeTab === 'smart'
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <FaMagic className="mr-2" size={12} />
                    <span>Smart Settlements</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('tripWise')}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeTab === 'tripWise'
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-2" size={12} />
                    <span>Trip-wise Settlements</span>
                  </div>
                </button>
              </div>
              
              {/* Smart Settlements Tab */}
              {activeTab === 'smart' && (
                <div className="space-y-3 max-h-[350px] overflow-auto pr-2">
                  {smartSettlements.length > 0 ? (
                    smartSettlements.map((settlement, index) => {
                      const isSettled = settledSmartPayments[index];
                      return (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-lg border border-gray-200 dark:border-gray-700 ${
                            isSettled 
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30' 
                              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30'
                          } shadow-sm hover:shadow-md transition-all`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex items-center">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white shadow-md p-1">
                                  <span className="text-xs font-medium text-center">{getFriendName(settlement.from).split(' ')[0]}</span>
                                </div>
                                <div className="mx-2 text-gray-400">
                                  <FaArrowRight />
                                </div>
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white shadow-md p-1">
                                  <span className="text-xs font-medium text-center">{getFriendName(settlement.to).split(' ')[0]}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="font-bold text-lg flex items-center">
                                <IndianRupee className="h-4 w-4 mr-1" />
                                {settlement.amount.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {getFriendName(settlement.from)} pays {getFriendName(settlement.to)}
                              </div>
                            </div>
                          </div>
                          {isSettled && (
                            <div className="mt-2 text-green-600 dark:text-green-400 text-xs flex items-center justify-end">
                              <FaCheck className="mr-1" size={10} />
                              <span>Marked as settled</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <FaExchangeAlt className="mx-auto text-gray-400 mb-3" size={32} />
                      <p className="text-gray-600 dark:text-gray-300 font-medium">Everyone is settled up!</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">No payments needed at this time</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Trip-wise Settlements Tab */}
              {activeTab === 'tripWise' && (
                <div className="space-y-3 max-h-[350px] overflow-auto pr-2">
                  {tripWiseSettlements.length > 0 ? (
                    tripWiseSettlements.map((settlement, index) => {
                      // Get the trip names for this settlement
                      const tripNames = settlement.trips.map(tripId => {
                        const trip = trips.find(t => t.id === tripId);
                        return trip ? trip.name : 'Unknown Trip';
                      });
                      
                      return (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex items-center">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white shadow-md p-1">
                                  <span className="text-xs font-medium text-center">{getFriendName(settlement.from).split(' ')[0]}</span>
                                </div>
                                <div className="mx-2 text-gray-400">
                                  <FaArrowRight />
                                </div>
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white shadow-md p-1">
                                  <span className="text-xs font-medium text-center">{getFriendName(settlement.to).split(' ')[0]}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="font-bold text-lg flex items-center">
                                <IndianRupee className="h-4 w-4 mr-1" />
                                {settlement.amount.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {getFriendName(settlement.from)} pays {getFriendName(settlement.to)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Show the trips this settlement is part of */}
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                              <FaCalendarAlt className="mr-1" size={10} />
                              <span>Trips: </span>
                              <div className="ml-1 flex flex-wrap gap-1">
                                {tripNames.map((tripName, i) => (
                                  <span 
                                    key={i} 
                                    className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs"
                                  >
                                    {tripName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <FaExchangeAlt className="mx-auto text-gray-400 mb-3" size={32} />
                      <p className="text-gray-600 dark:text-gray-300 font-medium">No trip-wise settlements found!</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Add expenses to trips to see settlements</p>
                    </div>
                  )}
                </div>
              )}
              
              {(activeTab === 'smart' && smartSettlements.length > 0) || (activeTab === 'tripWise' && tripWiseSettlements.length > 0) ? (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Total Settlements</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    {activeTab === 'smart' 
                      ? smartSettlements.reduce((sum, s) => sum + s.amount, 0).toFixed(2)
                      : tripWiseSettlements.reduce((sum, s) => sum + s.amount, 0).toFixed(2)
                    }
                  </span>
                </div>
              ) : null}
            </Card>
          </motion.div>
        </div>

        {/* Settlement Ratio Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-8"
        >
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <FaBalanceScale className="mr-2 text-primary-500" />
                Settlement Ratio Analysis
              </h3>
            </div>
            
            {settlementRatios.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={settlementRatios}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {settlementRatios.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [`${value} transactions`, props.payload.name]}
                        labelFormatter={() => 'Transaction Count'}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="text-md font-medium mb-3">Who pays vs. who receives</h4>
                  <div className="space-y-3">
                    {settlementRatios.map((friend, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{friend.name}</span>
                          <span className="text-sm text-gray-500">
                            {friend.paid} paid / {friend.received} received
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${friend.ratio * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span>Mostly pays</span>
                          <span>Mostly receives</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-gray-600 dark:text-gray-300">No settlement data available</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Add some expenses to see the analysis</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Trip History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-8"
        >
          <Card className="p-6 shadow-lg border-l-4 border-l-primary-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Trip History</h3>
              <Link href="/trips" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
                View All
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Active Trips */}
              <div className="col-span-1 md:col-span-2">
                <h4 className="text-md font-medium mb-3 flex items-center">
                  <FaChartPie className="mr-2 text-primary-500" />
                  Active Trips
                </h4>
                <div className="space-y-3 max-h-[200px] overflow-auto pr-2">
                  {activeTrips.length > 0 ? (
                    activeTrips.slice(0, 3).map((trip, index) => (
                      <Link href={`/trips/${trip.id}`} key={trip.id}>
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <div className="flex items-center">
                            <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-500 mr-3">
                              <FaCalendarAlt className="text-sm" />
                            </div>
                            <div>
                              <p className="font-medium">{trip.name}</p>
                              <div className="flex items-center text-xs text-gray-500">
                                <span>{formatDate(trip.date || trip.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <FaArrowRight className="text-gray-400" />
                        </motion.div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No active trips</p>
                  )}
                  {activeTrips.length > 3 && (
                    <Link href="/trips">
                      <div className="text-center text-primary-500 hover:text-primary-600 text-sm font-medium mt-2">
                        View {activeTrips.length - 3} more active trips
                      </div>
                    </Link>
                  )}
                </div>
              </div>
              
              {/* Settled Trips */}
              <div className="col-span-1">
                <h4 className="text-md font-medium mb-3 flex items-center">
                  <FaHistory className="mr-2 text-secondary-500" />
                  Settled Trips
                </h4>
                <div className="space-y-3 max-h-[200px] overflow-auto pr-2">
                  {settledTrips.length > 0 ? (
                    settledTrips.slice(0, 3).map((trip, index) => (
                      <Link href={`/trips/${trip.id}`} key={trip.id}>
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-between hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer"
                        >
                          <div className="flex items-center">
                            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900 text-green-500 mr-3">
                              <FaCheck className="text-sm" />
                            </div>
                            <div>
                              <p className="font-medium">{trip.name}</p>
                              <div className="flex items-center text-xs text-gray-500">
                                <span>{formatDate(trip.date || trip.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <FaArrowRight className="text-gray-400" />
                        </motion.div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No settled trips</p>
                  )}
                  {settledTrips.length > 3 && (
                    <Link href="/trips">
                      <div className="text-center text-primary-500 hover:text-primary-600 text-sm font-medium mt-2">
                        View {settledTrips.length - 3} more settled trips
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Expense Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <ExpenseDistributionChart expenses={expenses} friends={friends} />
        </motion.div>
      </motion.div>
    </div>
  );
}
