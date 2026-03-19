import { useFinTrack } from './useFinTrack'

export function useTrips() {
  const { trips, saveTrip, deleteTrip } = useFinTrack()
  return { trips, saveTrip, deleteTrip }
}
