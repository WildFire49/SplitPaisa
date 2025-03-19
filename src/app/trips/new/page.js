'use client';

import { Suspense } from 'react';
import TripForm from '@/components/forms/TripForm';
import Card from '@/components/ui/Card';

// Client component
function NewTripContent() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Create New Trip</h1>
      <TripForm />
    </div>
  );
}

// Loading fallback component
function NewTripLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6 text-center" elevation="medium">
        <p>Loading trip form...</p>
      </Card>
    </div>
  );
}

export default function NewTripPage() {
  return (
    <Suspense fallback={<NewTripLoading />}>
      <NewTripContent />
    </Suspense>
  );
}
