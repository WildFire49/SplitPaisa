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
  FaExchangeAlt 
} from 'react-icons/fa';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div>
      <DashboardContent />
    </div>
  );
}

function DashboardContent() {
  const { expenses, friends, trips, fetchData, calculateBalances, calculateSettlements } = useExpenseStore();
  const [stats, setStats] = useState({
    totalExpenses: 0,
    avgExpensePerTrip: 0,
    totalFriends: 0,
    totalTrips: 0
  });
  const [balances, setBalances] = useState({});
  const [settlements, setSettlements] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const dataProcessed = useRef(false);

  useEffect(() => {
    if (!dataProcessed.current) {
      fetchData();
      dataProcessed.current = true;
    }
  }, [fetchData]);

  useEffect(() => {
    if (expenses.length > 0) {
      // Calculate total expenses and averages
      const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      const avgPerTrip = trips.length > 0 ? totalAmount / trips.length : 0;
      
      setStats({
        totalExpenses: totalAmount,
        avgExpensePerTrip: avgPerTrip,
        totalFriends: friends.length,
        totalTrips: trips.length
      });

      // Get recent expenses (last 5)
      const sortedExpenses = [...expenses].sort((a, b) => 
        new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
      ).slice(0, 5);
      setRecentExpenses(sortedExpenses);

      // Calculate balances and settlements
      const calculatedBalances = calculateBalances();
      setBalances(calculatedBalances);
      
      const calculatedSettlements = calculateSettlements();
      setSettlements(calculatedSettlements);
    }
  }, [expenses, friends, trips, calculateBalances, calculateSettlements]);

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
      title: 'Total Expenses',
      value: `₹${stats.totalExpenses.toFixed(2)}`,
      icon: <FaMoneyBillWave className="text-xl" />,
      color: 'from-primary-500 to-primary-600'
    },
    {
      title: 'Average per Trip',
      value: `₹${stats.avgExpensePerTrip.toFixed(2)}`,
      icon: <FaWallet className="text-xl" />,
      color: 'from-secondary-500 to-secondary-600'
    },
    {
      title: 'Total Friends',
      value: stats.totalFriends,
      icon: <FaUsers className="text-xl" />,
      color: 'from-tertiary-500 to-tertiary-600'
    },
    {
      title: 'Total Trips',
      value: stats.totalTrips,
      icon: <FaChartPie className="text-xl" />,
      color: 'from-primary-600 to-secondary-500'
    }
  ];

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
              <Card className="p-6 h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-full bg-gradient-to-br ${stat.color} text-white`}>
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
            <Card className="p-6 h-full">
              <h3 className="text-lg font-semibold mb-4">Suggested Settlements</h3>
              
              <div className="space-y-3 max-h-[350px] overflow-auto pr-2">
                {settlements.length > 0 ? (
                  settlements.map((settlement, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex items-center">
                            <div className="flex items-center justify-center px-3 py-2 rounded-lg bg-tertiary-100 dark:bg-tertiary-900 text-tertiary-600 dark:text-tertiary-400 font-medium">
                              {getFriendName(settlement.from)}
                            </div>
                            <div className="mx-2 text-gray-400">
                              <FaArrowRight />
                            </div>
                            <div className="flex items-center justify-center px-3 py-2 rounded-lg bg-secondary-100 dark:bg-secondary-900 text-secondary-600 dark:text-secondary-400 font-medium">
                              {getFriendName(settlement.to)}
                            </div>
                          </div>
                        </div>
                        <div className="font-bold">
                          ₹{settlement.amount.toFixed(2)}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <FaExchangeAlt className="mx-auto text-gray-400 mb-2" size={24} />
                    <p className="text-gray-500">Everyone is settled up!</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

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
