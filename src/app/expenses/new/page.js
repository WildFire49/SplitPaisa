'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ExpenseForm from '@/components/forms/ExpenseForm';
import { useExpenseStore } from '@/store/expenseStore';
import Card from '@/components/ui/Card';

// Client component that uses useSearchParams
function ExpensePageContent() {
  const searchParams = useSearchParams();
  const [tripId, setTripId] = useState(null);
  const { getTripById } = useExpenseStore();
  const [tripName, setTripName] = useState('');

  useEffect(() => {
    const tripIdParam = searchParams.get('tripId');
    if (tripIdParam) {
      const id = parseInt(tripIdParam);
      setTripId(id);
      
      const trip = getTripById(id);
      if (trip) {
        setTripName(trip.name);
      }
    }
  }, [searchParams, getTripById]);

  return (
    <>
      <h1 className="text-3xl font-bold mb-8 text-center">
        {tripName ? `Add Expense to ${tripName}` : 'Add New Expense'}
      </h1>
      <ExpenseForm tripId={tripId} />
    </>
  );
}

// Loading fallback component
function ExpensePageLoading() {
  return (
    <Card className="max-w-md mx-auto p-6 text-center" elevation="medium">
      <p>Loading expense form...</p>
    </Card>
  );
}

export default function NewExpensePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Suspense fallback={<ExpensePageLoading />}>
        <ExpensePageContent />
      </Suspense>
    </div>
  );
}
