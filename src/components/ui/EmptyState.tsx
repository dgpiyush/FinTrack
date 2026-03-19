import { Button } from './Button'

export function EmptyState({
  emoji,
  title,
  description,
  actionLabel,
  onAction,
}: {
  emoji: string
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-stone-300 bg-stone-50 px-5 py-10 text-center dark:border-stone-700 dark:bg-stone-900/60">
      <div className="text-4xl">{emoji}</div>
      <h3 className="mt-4 text-lg font-semibold text-stone-900 dark:text-stone-50">{title}</h3>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{description}</p>
      <Button className="mt-5" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  )
}
