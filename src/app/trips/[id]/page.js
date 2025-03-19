"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaPlus, FaTrash, FaShare, FaClipboard, FaCheck, FaExchangeAlt, FaMoneyBillWave, FaArrowRight, FaUserFriends, FaTimes } from "react-icons/fa";
import { useExpenseStore } from "@/store/expenseStore";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowRight, IndianRupee } from "lucide-react";
import AddTripMember from "@/components/trips/AddTripMember";

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
    error,
    trips,
    expenses: allExpenses,
    getTripMembers,
    removeTripMember
  } = useExpenseStore();
  
  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [tripSettlements, setTripSettlements] = useState([]);
  const [tripBalances, setTripBalances] = useState({});
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [tripMembers, setTripMembers] = useState([]);
  const [removingMember, setRemovingMember] = useState(null);

  // Track if data has been fetched to prevent duplicate API calls
  const dataFetched = useRef(false);
  const pendingRequest = useRef(false);

  // Calculate settlements specific to this trip
  const calculateTripSettlements = useCallback((tripExpenses) => {
    try {
      // Initialize balances for all friends
      const balances = {};
      friends.forEach(friend => {
        balances[friend.id] = 0;
      });

      console.log("Initial balances:", balances);
      console.log("Trip expenses:", tripExpenses);

      // Create a map to track who owes what to whom
      const debts = {};
      
      // Initialize the debt tracking structure
      friends.forEach(debtor => {
        debts[debtor.id] = {};
        friends.forEach(creditor => {
          if (debtor.id !== creditor.id) {
            debts[debtor.id][creditor.id] = 0;
          }
        });
      });
      
      // Process each expense to determine who owes what to whom
      tripExpenses.forEach(expense => {
        const payer = expense.paid_by;
        if (!payer) return;
        
        // Get participants for this expense
        const participants = expense.expense_participants;
        if (!participants || !Array.isArray(participants) || participants.length === 0) {
          console.error(`Missing or invalid expense_participants for expense ${expense.id} (${expense.description})`);
          return;
        }
        
        // Calculate each participant's debt to the payer
        participants.forEach(participant => {
          if (participant.user_id && participant.user_id !== payer) {
            const share = parseFloat(participant.share);
            
            // Add to the debt that this participant owes to the payer
            if (debts[participant.user_id] && debts[participant.user_id][payer] !== undefined) {
              debts[participant.user_id][payer] += share;
            }
            
            // Update balances for UI display
            balances[participant.user_id] = (balances[participant.user_id] || 0) - share;
          }
        });
        
        // Update the payer's balance
        const payerShare = participants.find(p => p.user_id === payer)?.share || 0;
        const paidForOthers = parseFloat(expense.amount) - parseFloat(payerShare);
        balances[payer] = (balances[payer] || 0) + paidForOthers;
      });
      
      console.log("Final balances:", balances);
      setTripBalances(balances);
      
      console.log("Raw debts:", JSON.stringify(debts, null, 2));
      
      // Simplify debts (if A owes B and B owes A, cancel out the common amount)
      friends.forEach(person1 => {
        friends.forEach(person2 => {
          if (person1.id !== person2.id) {
            // If both owe each other, cancel out the common amount
            const debt1to2 = debts[person1.id][person2.id] || 0;
            const debt2to1 = debts[person2.id][person1.id] || 0;
            
            if (debt1to2 > 0 && debt2to1 > 0) {
              // Calculate the net debt
              const netDebt = Math.abs(debt1to2 - debt2to1);
              
              if (debt1to2 > debt2to1) {
                // person1 still owes person2
                debts[person1.id][person2.id] = netDebt;
                debts[person2.id][person1.id] = 0;
              } else {
                // person2 still owes person1
                debts[person2.id][person1.id] = netDebt;
                debts[person1.id][person2.id] = 0;
              }
            }
          }
        });
      });
      
      console.log("Simplified debts:", JSON.stringify(debts, null, 2));
      
      // Create settlement records from the debts
      const settlements = [];
      Object.entries(debts).forEach(([debtorId, creditors]) => {
        Object.entries(creditors).forEach(([creditorId, amount]) => {
          if (amount > 0.01) { // Only create settlements for non-zero amounts
            const debtorName = getFriendById(debtorId)?.name || "Unknown";
            const creditorName = getFriendById(creditorId)?.name || "Unknown";
            
            console.log(`Settlement: ${debtorName} pays ${creditorName} ${amount}`);
            
            settlements.push({
              from: debtorId,
              to: creditorId,
              amount: amount
            });
          }
        });
      });
      
      console.log("Final settlements:", settlements);
      setTripSettlements(settlements);
    } catch (error) {
      console.error("Error calculating trip settlements:", error);
      setTripSettlements([]);
    }
  }, [friends, getFriendById]);

  useEffect(() => {
    const fetchTripData = async () => {
      // Prevent duplicate API calls
      if (pendingRequest.current) {
        console.log('Trip data fetch already in progress, skipping duplicate call');
        return;
      }
      
      // Skip if data is already fetched
      if (dataFetched.current && trip) {
        console.log('Trip data already fetched, skipping fetch');
        setIsLoading(false);
        return;
      }
      
      // Skip fetching if tripId is not available or invalid
      if (!tripId) {
        console.error("Invalid trip ID:", params);
        setLoadError("Invalid trip ID");
        setIsLoading(false);
        return;
      }
      
      pendingRequest.current = true;
      setIsLoading(true);
      
      try {
        console.log("Fetching trip with ID:", tripId);
        const tripData = await getTripById(tripId);
        
        if (!tripData) {
          console.error("Trip not found for ID:", tripId);
          setLoadError(`Trip not found. The trip with ID ${tripId} may have been deleted or does not exist.`);
          setIsLoading(false);
          pendingRequest.current = false;
          return;
        }
        
        const tripExpenses = await getExpensesByTrip(tripId);
        setTrip(tripData);
        setExpenses(tripExpenses);
        
        // Calculate trip-specific balances and settlements
        calculateTripSettlements(tripExpenses);
        setLoadError(null);
        
        // Get trip members
        const members = await getTripMembers(tripId);
        setTripMembers(members);
        
        // Mark data as fetched
        dataFetched.current = true;
      } catch (err) {
        console.error("Error loading trip details:", err);
        setLoadError(`Failed to load trip details: ${err.message}. Please try again.`);
      } finally {
        setIsLoading(false);
        pendingRequest.current = false;
      }
    };

    if (!loading && tripId) {
      fetchTripData();
    }
  }, [tripId, getTripById, getExpensesByTrip, calculateTripSettlements, loading, trip, params, getTripMembers]);

  // Handle removing a trip member
  const handleRemoveMember = async (userId) => {
    if (!tripId || !userId) return;
    
    setRemovingMember(userId);
    
    try {
      await removeTripMember(tripId, userId);
      
      // Update the local state
      setTripMembers(prev => prev.filter(id => id !== userId));
    } catch (err) {
      console.error("Error removing trip member:", err);
      alert(err.message || "Failed to remove member");
    } finally {
      setRemovingMember(null);
    }
  };

  // Handle when a new member is added
  const handleMemberAdded = async () => {
    // Refresh the trip members
    if (tripId) {
      const members = await getTripMembers(tripId);
      setTripMembers(members);
    }
  };

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

  if (loadError) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Error</h2>
          <p className="text-red-600 mb-4">{loadError}</p>
          <Link href="/trips">
            <Button variant="primary" className="mx-auto">
              Return to Trips
            </Button>
          </Link>
        </div>
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
      {/* Trip Info */}
      <section className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold">{trip?.name || "Trip Details"}</h1>
          <div className="flex space-x-2">
            <Link href={`/expenses/new?tripId=${tripId}`}>
              <Button
                variant="primary"
                size="sm"
                className="flex items-center"
              >
                <FaPlus className="mr-2" />
                Add Expense
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareTrip}
              className="flex items-center"
            >
              <FaShare className="mr-2" />
              {copied ? "Copied!" : "Share"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center"
            >
              <FaTrash className="mr-2" />
              Delete
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-2">Trip Details</h3>
            <p className="text-gray-600 mb-1"><span className="font-medium">Date:</span> {trip?.date ? new Date(trip.date).toLocaleDateString() : "Not specified"}</p>
            <p className="text-gray-600 mb-1"><span className="font-medium">Location:</span> {trip?.location || "Not specified"}</p>
            <p className="text-gray-600"><span className="font-medium">Description:</span> {trip?.description || "No description provided"}</p>
          </Card>
          
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Trip Members</h3>
            </div>
            
            <div className="space-y-2 mb-3">
              {tripMembers.length > 0 ? (
                tripMembers.map(memberId => {
                  const member = getFriendById(memberId);
                  if (!member) return null;
                  
                  return (
                    <div key={memberId} className="flex items-center justify-between p-3 bg-[#1e293b] border-2 border-[#334155] rounded-lg shadow-md hover:shadow-lg transition-all">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#818CF8] flex items-center justify-center text-[#f8fafc] mr-3 shadow-md">
                          {member.name.charAt(0)}
                        </div>
                        <span className="font-medium text-[#f8fafc]">{member.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(memberId)}
                        disabled={removingMember === memberId}
                        className="text-[#ef4444] hover:text-[#f87171] hover:bg-[#1e293b] rounded-full p-2"
                      >
                        {removingMember === memberId ? (
                          <span className="text-xs">Removing...</span>
                        ) : (
                          <FaTimes />
                        )}
                      </Button>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-sm">No members added to this trip yet.</p>
              )}
            </div>
            
            <AddTripMember tripId={tripId} onMemberAdded={handleMemberAdded} />
          </Card>
        </div>
      </section>
        
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
                        className="text-sm text-error mt-2 hover:underline flex items-center"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <FaTrash className="mr-1" size={12} />
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
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Settlements</h3>
          {tripSettlements.length > 0 ? (
            <div className="space-y-4">
              {tripSettlements.map((settlement, index) => {
                const fromFriend = getFriendById(settlement.from);
                const toFriend = getFriendById(settlement.to);
                
                if (!fromFriend || !toFriend) {
                  console.error(`Friend not found for settlement: from=${settlement.from}, to=${settlement.to}`);
                  return null;
                }
                
                return (
                  <div key={index} className="flex items-center p-4 bg-[#1e293b] border-2 border-[#334155] rounded-xl shadow-md hover:shadow-lg transition-all">
                    <div className="flex-1 flex items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#059669] via-[#10B981] to-[#34D399] flex items-center justify-center text-[#f8fafc] mr-3 shadow-md">
                        {fromFriend.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#f8fafc]">{fromFriend.name}</p>
                        <p className="text-sm text-[#d1d5db] flex items-center">
                          <span className="mr-1">pays</span> 
                          <span role="img" aria-label="money">💸</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex-1 text-center">
                      <div className="font-bold text-lg bg-[#0f172a] py-2 px-4 rounded-full shadow-inner border border-[#334155] text-[#f8fafc]">
                        ₹{settlement.amount.toFixed(2)}
                      </div>
                      <div className="text-[#d1d5db] my-1">
                        <FaArrowRight className="inline mx-2" />
                      </div>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-end">
                      <div className="flex-1 text-right">
                        <p className="font-semibold text-[#f8fafc]">{toFriend.name}</p>
                        <p className="text-sm text-[#d1d5db] flex items-center justify-end">
                          <span role="img" aria-label="money bag">💰</span>
                          <span className="ml-1">receives</span>
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#34D399] via-[#10B981] to-[#059669] flex items-center justify-center text-[#f8fafc] ml-3 shadow-md">
                        {toFriend.name.charAt(0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No settlements needed. Everyone is square!</p>
            </div>
          )}
        </div>
        
        {/* Individual Balances */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Individual Balances</h3>
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(tripBalances).map(([friendId, balance]) => {
              const friend = getFriendById(friendId);
              if (!friend) return null;
              
              const isPositive = balance > 0;
              const isNegative = balance < 0;
              const isZero = Math.abs(balance) < 0.01;
              
              let statusText = "is settled up";
              let statusClass = "text-[#d1d5db]";
              let bgColor = "bg-[#1e293b]";
              let borderColor = "border-[#334155]";
              let emoji = "✓";
              
              if (isPositive) {
                statusText = "is owed";
                statusClass = "text-[#34D399]";
                bgColor = "bg-[#1e293b]";
                borderColor = "border-[#10B981]";
                
                // Different emojis based on amount owed
                if (balance > 1000) {
                  emoji = "🤑";
                } else if (balance > 500) {
                  emoji = "💰";
                } else {
                  emoji = "💵";
                }
              } else if (isNegative) {
                statusText = "owes";
                statusClass = "text-[#ef4444]";
                bgColor = "bg-[#1e293b]";
                borderColor = "border-[#ef4444]";
                
                // Different emojis based on amount owed
                if (Math.abs(balance) > 1000) {
                  emoji = "😱";
                } else if (Math.abs(balance) > 500) {
                  emoji = "😰";
                } else {
                  emoji = "😓";
                }
              }
              
              return (
                <div key={friendId} className={`flex items-center p-4 ${bgColor} border-2 ${borderColor} rounded-xl shadow-md hover:shadow-lg transition-all`}>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D97706] via-[#F59E0B] to-[#FBBF24] flex items-center justify-center text-[#f8fafc] mr-3 shadow-md">
                    {friend.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#f8fafc]">{friend.name}</p>
                    <div className="flex items-center">
                      <p className={`text-sm ${statusClass} font-medium flex items-center`}>
                        <span className="mr-2">{statusText}</span>
                        {!isZero && (
                          <>
                            <span className="font-bold mr-2">₹{Math.abs(balance).toFixed(2)}</span>
                            <span role="img" aria-label="status">{emoji}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
