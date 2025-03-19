'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaRupeeSign, FaArrowRight, FaUserFriends } from 'react-icons/fa';
import { useExpenseStore } from '@/store/expenseStore';
import Card from '@/components/ui/Card';

export default function DashboardPage() {
  const { friends, expenses, calculateBalances, calculateSettlements } = useExpenseStore();
  const [balances, setBalances] = useState({});
  const [settlements, setSettlements] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    // Calculate balances and settlements
    const calculatedBalances = calculateBalances();
    setBalances(calculatedBalances);
    
    const calculatedSettlements = calculateSettlements();
    setSettlements(calculatedSettlements);
    
    // Calculate total amount of all expenses
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    setTotalAmount(total);
  }, [expenses, calculateBalances, calculateSettlements]);

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
      opacity: 1
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {/* Summary Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="text-center p-6">
            <FaRupeeSign className="text-4xl text-primary mx-auto mb-3" />
            <h3 className="text-xl font-semibold mb-2">Total Expenses</h3>
            <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="text-center p-6">
            <FaUserFriends className="text-4xl text-secondary mx-auto mb-3" />
            <h3 className="text-xl font-semibold mb-2">Friends</h3>
            <p className="text-3xl font-bold">{friends.length}</p>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="text-center p-6">
            <div className="text-4xl text-accent mx-auto mb-3">₹</div>
            <h3 className="text-xl font-semibold mb-2">Settlements</h3>
            <p className="text-3xl font-bold">{settlements.length}</p>
          </Card>
        </motion.div>
      </motion.div>
      
      {/* Individual Balances */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Individual Balances</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {friends.map(friend => {
            const balance = balances[friend.id] || 0;
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
              >
                <h3 className="font-semibold text-lg mb-2">{friend.name}</h3>
                <p className={`text-xl font-bold ${
                  isPositive 
                    ? 'lending' 
                    : isNegative 
                      ? 'borrowing' 
                      : ''
                }`}>
                  {formatCurrency(balance)}
                </p>
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
      </section>
      
      {/* Settlements */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Settlements</h2>
        
        {settlements.length > 0 ? (
          <motion.div 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {settlements.map((settlement, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="p-4">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                      <p className="text-lg font-semibold">{getFriendName(settlement.from)}</p>
                      <p className="text-sm text-gray-500">pays</p>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="text-xl font-bold text-primary">
                        {formatCurrency(settlement.amount)}
                      </div>
                      <FaArrowRight className="mx-4 text-gray-400" />
                    </div>
                    
                    <div className="text-center md:text-right">
                      <p className="text-lg font-semibold">{getFriendName(settlement.to)}</p>
                      <p className="text-sm text-gray-500">receives</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <Card className="text-center p-8">
            <p className="text-gray-500">Everyone is settled up! No payments needed.</p>
          </Card>
        )}
      </section>
    </div>
  );
}
