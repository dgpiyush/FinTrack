import { useState } from 'react'
import { AddTripSheet } from '../components/trips/AddTripSheet'
import { TripCard } from '../components/trips/TripCard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { useFinTrack } from '../hooks/useFinTrack'
import type { Trip } from '../types'
import { useToast } from '../components/ui/Toast'

export function TripsPage() {
  const { trips, expenses } = useFinTrack()
  const { pushToast } = useToast()
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)

  return (
    <div className="space-y-5">
      {trips.length ? (
        <div className="grid grid-cols-2 gap-3">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} expenses={expenses} />
          ))}
        </div>
      ) : (
        <EmptyState emoji="🧳" title="No trips yet" description="Plan a trip and FinTrack will keep that budget separate from everyday spending." actionLabel="Add your first trip" onAction={() => setSelectedTrip({} as Trip)} />
      )}

      <Button className="fixed bottom-24 right-4 z-20 rounded-full px-5 shadow-xl" onClick={() => setSelectedTrip({} as Trip)}>
        Add trip
      </Button>

      <AddTripSheet open={selectedTrip !== null} trip={selectedTrip && selectedTrip.id ? selectedTrip : null} onClose={() => setSelectedTrip(null)} onSaved={() => pushToast(selectedTrip?.id ? 'Trip updated' : 'Trip saved')} />
    </div>
  )
}
