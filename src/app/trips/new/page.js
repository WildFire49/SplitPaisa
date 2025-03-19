'use client';

import TripForm from '@/components/forms/TripForm';

export default function NewTripPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Create New Trip</h1>
      <TripForm />
    </div>
  );
}
