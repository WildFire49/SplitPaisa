'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { FaArrowRight, FaUserFriends } from 'react-icons/fa';
import { useExpenseStore } from '@/store/expenseStore';
import Card from '@/components/ui/Card';
import { IndianRupee } from 'lucide-react';

// Client component
function DashboardContent() {
  const { friends, expenses, calculateBalances, calculateSettlements, loading, error } = useExpenseStore();
  const [balances, setBalances] = useState({});
  const [settlements, setSettlements] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (!loading && expenses.length > 0) {
      // Calculate balances and settlements
      const calculatedBalances = calculateBalances();
      setBalances(calculatedBalances);
      
      const calculatedSettlements = calculateSettlements();
      setSettlements(calculatedSettlements);
      
      // Calculate total expenses
      const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      setTotalAmount(total);
    }
  }, [expenses, calculateBalances, calculateSettlements, loading]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Helper function to get friend name by ID
  const getFriendName = (id) => {
    const friend = friends.find(f => f.id === id);
    return friend ? friend.name : 'Unknown';
  };

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Item animation variants
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-500 mb-2">Error</h2>
          <p className="text-gray-700">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      className="container mx-auto px-4 py-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.h1 
        className="text-3xl font-bold mb-8 text-center"
        variants={itemVariants}
      >
        Dashboard
      </motion.h1>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
        variants={itemVariants}
      >
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <IndianRupee className="mr-2" size={20} />
            Total Expenses
          </h2>
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(totalAmount)}
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <FaUserFriends className="mr-2" size={20} />
            Friends
          </h2>
          <p className="text-3xl font-bold text-primary">{friends.length}</p>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            Settlements
          </h2>
          <p className="text-3xl font-bold text-primary">{settlements.length}</p>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-semibold mb-4">Balances</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {Object.entries(balances).map(([friendId, balance]) => (
            <Card 
              key={friendId} 
              className={`p-4 ${balance > 0 ? 'border-green-400' : balance < 0 ? 'border-red-400' : 'border-gray-300'}`}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{getFriendName(friendId)}</h3>
                <span 
                  className={`font-bold ${
                    balance > 0 
                      ? 'text-green-600' 
                      : balance < 0 
                        ? 'text-red-600' 
                        : 'text-gray-600'
                  }`}
                >
                  {formatCurrency(balance)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {balance > 0 
                  ? 'is owed' 
                  : balance < 0 
                    ? 'owes' 
                    : 'is settled up'}
              </p>
            </Card>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-semibold mb-4">Suggested Settlements</h2>
        {settlements.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {settlements.map((settlement, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="font-semibold">{getFriendName(settlement.from)}</span>
                    <FaArrowRight className="mx-3 text-primary" />
                    <span className="font-semibold">{getFriendName(settlement.to)}</span>
                  </div>
                  <span className="font-bold">{formatCurrency(settlement.amount)}</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-gray-600">Everyone is settled up! No payments needed.</p>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}

// Loading fallback component
function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
