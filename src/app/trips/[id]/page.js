"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaPlus, FaTrash, FaShare, FaClipboard, FaCheck } from "react-icons/fa";
import { useExpenseStore } from "@/store/expenseStore";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowRight, IndianRupee } from "lucide-react";

// Client component that uses useParams
function TripDetailsContent() {
  const params = useParams();
  const router = useRouter();
  
  // Extract and parse the ID properly
  const tripId = params?.id || null;
  
  const { 
    getTripById, 
    getExpensesByTrip, 
    getFriendById,
    deleteTrip,
    deleteExpense,
    friends,
    loading,
    error
  } = useExpenseStore();
  
  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [tripSettlements, setTripSettlements] = useState([]);
  const [tripBalances, setTripBalances] = useState({});
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

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
      balances[expense.paid_by] += parseFloat(expense.amount);
      
      // Distribute expense among participants
      expense.expense_participants.forEach(participant => {
        // Subtract share amount from each participant's balance (they owe this money)
        balances[participant.user_id] -= parseFloat(participant.share);
      });
    });

    setTripBalances(balances);

    // Calculate settlements using the same algorithm as in expenseStore
    const settlements = [];

    // Create arrays of creditors (positive balance) and debtors (negative balance)
    const creditors = Object.entries(balances)
      .filter(([_, balance]) => balance > 0)
      .map(([id, balance]) => ({ id, balance }))
      .sort((a, b) => b.balance - a.balance);

    const debtors = Object.entries(balances)
      .filter(([_, balance]) => balance < 0)
      .map(([id, balance]) => ({ id, balance: Math.abs(balance) }))
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
  }, [friends]);

  useEffect(() => {
    const fetchTripData = async () => {
      setIsLoading(true);
      try {
        // Skip fetching if tripId is not available or invalid
        if (!tripId) {
          console.error("Invalid trip ID:", params);
          setLoadError("Invalid trip ID");
          return;
        }
        
        console.log("Fetching trip with ID:", tripId);
        const tripData = await getTripById(tripId);
        
        if (!tripData) {
          console.error("Trip not found for ID:", tripId);
          setLoadError("Trip not found");
          return;
        }
        
        const tripExpenses = await getExpensesByTrip(tripId);
        setTrip(tripData);
        setExpenses(tripExpenses);
        
        // Calculate trip-specific balances and settlements
        calculateTripSettlements(tripExpenses);
        setLoadError(null);
      } catch (err) {
        console.error("Error loading trip details:", err);
        setLoadError("Failed to load trip details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading && tripId) {
      fetchTripData();
    }
  }, [tripId, getTripById, getExpensesByTrip, calculateTripSettlements, loading, params]);

  // Calculate total expenses for this trip
  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

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

  const handleDeleteTrip = async () => {
    if (confirmDelete) {
      try {
        await deleteTrip(tripId);
        router.push('/trips');
      } catch (err) {
        console.error("Error deleting trip:", err);
        setLoadError("Failed to delete trip. Please try again.");
      }
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      await deleteExpense(expenseId);
      // Refresh expenses
      const updatedExpenses = await getExpensesByTrip(tripId);
      setExpenses(updatedExpenses);
      calculateTripSettlements(updatedExpenses);
    } catch (err) {
      console.error("Error deleting expense:", err);
      setLoadError("Failed to delete expense. Please try again.");
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || loadError) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-500 mb-2">Error</h2>
          <p className="text-gray-700">{error || loadError}</p>
        </Card>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold mb-2">Trip Not Found</h2>
          <p className="text-gray-700 mb-4">The trip you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <Link href="/trips">
            <Button>Back to Trips</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Trip Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{trip.name}</h1>
          <p className="text-gray-500">
            {new Date(trip.date || trip.created_at).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Link href={`/expenses/new?tripId=${tripId}`}>
            <Button className="flex items-center gap-2">
              <FaPlus /> Add Expense
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleShareTrip}
          >
            {copied ? <FaCheck /> : <FaShare />}
            {copied ? "Copied!" : "Share"}
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2 text-error hover:bg-error hover:text-white"
            onClick={handleDeleteTrip}
          >
            <FaTrash />
            {confirmDelete ? "Confirm Delete" : "Delete Trip"}
          </Button>
        </div>
      </div>
      
      {/* Trip Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <IndianRupee className="mr-2" size={20} />
            Total Expenses
          </h2>
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(totalExpenses)}
          </p>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Participants
          </h2>
          <p className="text-3xl font-bold text-primary">
            {Object.keys(tripBalances).length}
          </p>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            Expenses
          </h2>
          <p className="text-3xl font-bold text-primary">{expenses.length}</p>
        </Card>
      </div>
      
      {/* Expenses List */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Expenses</h2>
        
        {expenses.length > 0 ? (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{expense.description}</h3>
                      <p className="text-sm text-gray-500">
                        Paid by {getFriendById(expense.paid_by)?.name || "Unknown"} • 
                        {new Date(expense.created_at).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })}
                      </p>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Split among: {expense.expense_participants.map(p => 
                            getFriendById(p.user_id)?.name || "Unknown"
                          ).join(', ')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-lg text-primary">
                        {formatCurrency(expense.amount)}
                      </span>
                      <button 
                        className="text-sm text-error mt-2 hover:underline"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-gray-500 mb-4">No expenses added yet</p>
            <Link href={`/expenses/new?tripId=${tripId}`}>
              <Button className="flex items-center gap-2 mx-auto">
                <FaPlus /> Add First Expense
              </Button>
            </Link>
          </Card>
        )}
      </section>
      
      {/* Settlements */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Settlements</h2>
        
        {tripSettlements.length > 0 ? (
          <div className="space-y-4">
            {tripSettlements.map((settlement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="font-semibold">{getFriendById(settlement.from)?.name || "Unknown"}</span>
                      <ArrowRight className="mx-3 text-primary" />
                      <span className="font-semibold">{getFriendById(settlement.to)?.name || "Unknown"}</span>
                    </div>
                    <span className="font-bold">{formatCurrency(settlement.amount)}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-gray-500">Everyone is settled up! No payments needed.</p>
          </Card>
        )}
      </section>
    </div>
  );
}

// Loading fallback component
function TripDetailsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    </div>
  );
}

export default function TripDetailsPage() {
  return (
    <Suspense fallback={<TripDetailsLoading />}>
      <TripDetailsContent />
    </Suspense>
  );
}
