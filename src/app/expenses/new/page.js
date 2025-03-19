"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ExpenseForm from "@/components/forms/ExpenseForm";
import { useExpenseStore } from "@/store/expenseStore";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";

// Client component that uses URL search params
function ExpensePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tripId, setTripId] = useState(null);
  const { getTripById, loading, error } = useExpenseStore();
  const [tripName, setTripName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const fetchTripData = async () => {
      setIsLoading(true);
      try {
        // Get the trip ID from search params
        const rawTripId = searchParams.get("tripId");
        
        // Only proceed if we have a valid ID
        if (rawTripId) {
          setTripId(rawTripId);
          
          console.log("Fetching trip with ID:", rawTripId);
          const trip = await getTripById(rawTripId);
          
          if (trip) {
            setTripName(trip.name);
            setLoadError(null);
          } else {
            console.error("Trip not found for ID:", rawTripId);
            setLoadError(`Trip not found. Please check if the trip with ID ${rawTripId} exists.`);
            // Keep the tripId so the user can still go back
          }
        } else {
          // No trip ID in URL, this is a new expense without a trip
          setTripId(null);
          setLoadError(null);
        }
      } catch (err) {
        console.error("Error loading trip data:", err);
        setLoadError("Failed to load trip data. Please try again.");
        // Keep the tripId if we have it so the user can still go back
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading) {
      fetchTripData();
    }
  }, [getTripById, loading, searchParams]);

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || loadError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 max-w-md w-full mx-auto">
          <h2 className="text-xl font-semibold text-red-500 mb-2">Error</h2>
          <p className="text-gray-700 mb-4">{error || loadError}</p>
          <div className="flex gap-4">
            <Link href="/trips">
              <Button>Back to Trips</Button>
            </Link>
            {tripId && (
              <Link href={`/trips/${tripId}`}>
                <Button variant="secondary">Try Again</Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Add New Expense</h1>
          {tripName && (
            <p className="text-gray-500">For trip: {tripName}</p>
          )}
        </div>
        
        <Link href={tripId ? `/trips/${tripId}` : "/trips"}>
          <Button variant="secondary">Cancel</Button>
        </Link>
      </div>
      
      <ExpenseForm tripId={tripId} />
    </div>
  );
}

// Loading fallback component
function ExpensePageLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function ExpensePage() {
  return (
    <Suspense fallback={<ExpensePageLoading />}>
      <ExpensePageContent />
    </Suspense>
  );
}
