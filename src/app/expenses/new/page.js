'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ExpenseForm from '@/components/forms/ExpenseForm';
import { useExpenseStore } from '@/store/expenseStore';

export default function NewExpensePage() {
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        {tripName ? `Add Expense to ${tripName}` : 'Add New Expense'}
      </h1>
      <ExpenseForm tripId={tripId} />
    </div>
  );
}
