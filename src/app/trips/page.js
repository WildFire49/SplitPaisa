'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaPlus, FaCalendarAlt } from 'react-icons/fa';
import { useExpenseStore } from '@/store/expenseStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

// Client component
function TripsContent() {
  const { trips, loading, error } = useExpenseStore();
  const [sortedTrips, setSortedTrips] = useState([]);

  useEffect(() => {
    if (!loading && trips.length > 0) {
      // Sort trips by date (newest first)
      const sorted = [...trips].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setSortedTrips(sorted);
    }
  }, [trips, loading]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Trips</h1>
        <Link href="/trips/new">
          <Button className="flex items-center gap-2">
            <FaPlus /> Add Trip
          </Button>
        </Link>
      </div>
      
      {sortedTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTrips.map((trip) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (sortedTrips.indexOf(trip) % 10) }}
            >
              <Link href={`/trips/${trip.id}`}>
                <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-300">
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-2">{trip.name}</h2>
                    
                    <div className="flex items-center text-gray-500 mb-4">
                      <FaCalendarAlt className="mr-2" />
                      <span>{formatDate(trip.date || trip.created_at)}</span>
                    </div>
                    
                    {trip.description && (
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {trip.description}
                      </p>
                    )}
                    
                    <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-primary font-medium">View Details</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="text-center p-8">
          <h2 className="text-xl font-bold mb-4">No trips yet</h2>
          <p className="text-gray-500 mb-6">Create your first trip to start tracking expenses</p>
          <Link href="/trips/new">
            <Button className="flex items-center gap-2 mx-auto">
              <FaPlus /> Create Trip
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

// Loading fallback component
function TripsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    </div>
  );
}

export default function TripsPage() {
  return (
    <Suspense fallback={<TripsLoading />}>
      <TripsContent />
    </Suspense>
  );
}
