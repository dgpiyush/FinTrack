import { useFinTrack } from './useFinTrack'

export function useSync() {
  const { syncMeta, syncState, triggerSync } = useFinTrack()
  return { syncMeta, syncState, triggerSync }
}
