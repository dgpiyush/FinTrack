import { useEffect, useState } from 'react'
import type { Trip } from '../../types'
import { TRIP_EMOJIS } from '../../types'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'
import { useFinTrack } from '../../hooks/useFinTrack'
import { todayIso } from '../../utils/date'

export function AddTripSheet({
  open,
  trip,
  onClose,
  onSaved,
}: {
  open: boolean
  trip?: Trip | null
  onClose: () => void
  onSaved: () => void
}) {
  const { saveTrip, deleteTrip, user } = useFinTrack()
  const [form, setForm] = useState({
    name: '',
    destination: '',
    coverEmoji: '✈️',
    startDate: todayIso(),
    endDate: todayIso(),
    budget: '',
    currency: user?.currency ?? 'INR',
    notes: '',
  })

  useEffect(() => {
    if (!open) return
    setForm({
      name: trip?.name ?? '',
      destination: trip?.destination ?? '',
      coverEmoji: trip?.coverEmoji ?? '✈️',
      startDate: trip?.startDate ?? todayIso(),
      endDate: trip?.endDate ?? todayIso(),
      budget: trip ? String(trip.budget) : '',
      currency: trip?.currency ?? user?.currency ?? 'INR',
      notes: trip?.notes ?? '',
    })
  }, [open, trip, user?.currency])

  return (
    <Sheet open={open} onClose={onClose} title={trip ? 'Edit trip' : 'New trip'}>
      <div className="space-y-4">
        <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800" placeholder="Trip name" />
        <input value={form.destination} onChange={(event) => setForm((current) => ({ ...current, destination: event.target.value }))} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800" placeholder="Destination" />
        <div className="grid grid-cols-4 gap-2">
          {TRIP_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setForm((current) => ({ ...current, coverEmoji: emoji }))}
              className={`min-h-14 rounded-2xl text-2xl ${
                form.coverEmoji === emoji ? 'bg-emerald-100 ring-2 ring-emerald-500' : 'bg-stone-100 dark:bg-stone-800'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800" />
          <input type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input inputMode="decimal" value={form.budget} onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800" placeholder="Budget" />
          <input value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800" placeholder="Currency" />
        </div>
        <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-28 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800" placeholder="Notes" />
        <div className="flex gap-3">
          <Button
            fullWidth
            onClick={async () => {
              await saveTrip(
                {
                  name: form.name,
                  destination: form.destination,
                  coverEmoji: form.coverEmoji,
                  startDate: form.startDate,
                  endDate: form.endDate,
                  budget: Number(form.budget || 0),
                  currency: form.currency,
                  notes: form.notes,
                },
                trip?.id,
              )
              onSaved()
              onClose()
            }}
          >
            {trip ? 'Save trip' : 'Create trip'}
          </Button>
          {trip && (
            <Button
              variant="danger"
              onClick={async () => {
                if (!window.confirm('Delete this trip?')) return
                await deleteTrip(trip.id)
                onSaved()
                onClose()
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  )
}
