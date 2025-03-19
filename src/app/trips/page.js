'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaPlus, FaCalendarAlt } from 'react-icons/fa';
import { useExpenseStore } from '@/store/expenseStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function TripsPage() {
  const { trips } = useExpenseStore();
  const [sortedTrips, setSortedTrips] = useState([]);

  useEffect(() => {
    // Sort trips by date (newest first)
    const sorted = [...trips].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    setSortedTrips(sorted);
  }, [trips]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Trips</h1>
        <Link href="/trips/new">
          <Button className="flex items-center gap-2">
            <FaPlus /> New Trip
          </Button>
        </Link>
      </div>

      {sortedTrips.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sortedTrips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/trips/${trip.id}`}>
                <Card className="h-full cursor-pointer hover:border-primary transition-colors">
                  <h2 className="text-xl font-semibold mb-2">{trip.name}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {trip.description || 'No description'}
                  </p>
                  <div className="flex items-center text-gray-500 text-sm">
                    <FaCalendarAlt className="mr-2" />
                    {new Date(trip.date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <Card className="text-center p-8">
          <h2 className="text-xl font-semibold mb-4">No trips yet</h2>
          <p className="text-gray-500 mb-6">
            Create your first trip to start tracking expenses with your friends.
          </p>
          <Link href="/trips/new">
            <Button className="flex items-center gap-2 mx-auto">
              <FaPlus /> Create Your First Trip
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
