import { Button } from './Button'

export function UpdateBanner({ open, onRefresh }: { open: boolean; onRefresh: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-x-4 top-24 z-50 rounded-[24px] bg-amber-500 px-4 py-4 text-stone-950 shadow-xl">
      <p className="text-sm font-semibold">Update available. Refresh to load the latest version.</p>
      <Button className="mt-3 bg-stone-950 text-white" onClick={onRefresh}>
        Refresh app
      </Button>
    </div>
  )
}
