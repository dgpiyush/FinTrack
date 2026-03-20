import { useEffect, useMemo, useState } from 'react'
import { Camera, ImagePlus, Plus } from 'lucide-react'
import { getCategoryOptions, type Expense } from '../../types'
import { todayIso } from '../../utils/date'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'
import { useFinTrack } from '../../hooks/useFinTrack'

async function compressImage(file: File) {
  const image = document.createElement('img')
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Image load failed'))
    image.src = dataUrl
  })

  const canvas = document.createElement('canvas')
  const maxWidth = 1280
  const scale = Math.min(maxWidth / image.width, 1)
  canvas.width = image.width * scale
  canvas.height = image.height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

  let quality = 0.85
  let result = canvas.toDataURL('image/jpeg', quality)
  while (result.length > 200_000 && quality > 0.45) {
    quality -= 0.08
    result = canvas.toDataURL('image/jpeg', quality)
  }
  return result
}

export function AddExpenseSheet({
  open,
  expense,
  initialTripId,
  onClose,
  onSaved,
  onDeleted,
}: {
  open: boolean
  expense?: Expense | null
  initialTripId?: string
  onClose: () => void
  onSaved: () => void
  onDeleted?: () => void
}) {
  const { user, saveExpense, deleteExpense, trips, createCustomCategory } = useFinTrack()
  const activeTrip = useMemo(() => trips.find((trip) => initialTripId === trip.id), [initialTripId, trips])
  const categoryOptions = useMemo(() => getCategoryOptions(user), [user])
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState<Expense['category']>('food')
  const [date, setDate] = useState(todayIso())
  const [tripId, setTripId] = useState('')
  const [receipt, setReceipt] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    if (!open) return
    setAmount(expense ? String(expense.amount) : '')
    setNote(expense?.note ?? '')
    setCategory(expense?.category ?? 'food')
    setDate(expense?.date ?? todayIso())
    setTripId(expense?.tripId ?? activeTrip?.id ?? '')
    setReceipt(expense?.receiptImageBase64 ?? '')
    setTags(expense?.tags.join(', ') ?? '')
  }, [activeTrip?.id, expense, open])

  const submitDisabled = !amount || Number(amount) <= 0

  return (
    <Sheet open={open} onClose={onClose} title={expense ? 'Edit expense' : 'Add expense'}>
      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-200">Amount</span>
          <input
            autoFocus
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-2xl font-semibold outline-none focus:border-emerald-500 dark:border-stone-700 dark:bg-stone-800"
            placeholder={user?.currency ?? 'INR'}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-200">Note</span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-emerald-500 dark:border-stone-700 dark:bg-stone-800"
            placeholder="What was this for?"
          />
        </label>

        <div>
          <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-200">Category</span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categoryOptions.map((option) => {
              const key = option.id
              const meta = option
              const Icon = meta.icon
              const active = category === key
              return (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
                    active
                      ? 'border-transparent text-white shadow-sm'
                      : 'border-stone-200 bg-white text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100'
                  }`}
                  style={active ? { backgroundColor: meta.color } : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {meta.label}
                </button>
              )
            })}
            <button
              onClick={async () => {
                const label = window.prompt('Create a new category')
                if (!label) return
                const categoryId = await createCustomCategory(label)
                if (categoryId) setCategory(categoryId)
              }}
              className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-dashed border-emerald-400 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 dark:border-emerald-500/70 dark:bg-emerald-950/40 dark:text-emerald-200"
            >
              <Plus className="h-4 w-4" />
              New category
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-200">Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-emerald-500 dark:border-stone-700 dark:bg-stone-800"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-200">Trip</span>
            <select
              value={tripId}
              onChange={(event) => setTripId(event.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-emerald-500 dark:border-stone-700 dark:bg-stone-800"
            >
              <option value="">None</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.coverEmoji} {trip.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-200">Receipt photo</span>
          <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-600 dark:border-stone-700 dark:text-stone-300">
            {receipt ? <Camera className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
            {receipt ? 'Replace photo' : 'Add photo'}
            <input
              className="hidden"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                const base64 = await compressImage(file)
                setReceipt(base64)
              }}
            />
          </label>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-200">Tags</span>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-emerald-500 dark:border-stone-700 dark:bg-stone-800"
            placeholder="coffee, commute"
          />
        </label>

        <div className="flex gap-3 pt-2">
          <Button
            fullWidth
            disabled={submitDisabled}
            onClick={async () => {
              await saveExpense(
                {
                  amount: Number(amount),
                  currency: user?.currency ?? 'INR',
                  note,
                  category,
                  date,
                  tripId: tripId || undefined,
                  receiptImageBase64: receipt || undefined,
                  tags: tags.split(',').map((item) => item.trim()).filter(Boolean),
                },
                expense?.id,
              )
              onSaved()
              onClose()
            }}
          >
            {expense ? 'Save changes' : 'Save expense'}
          </Button>
          {expense && (
            <Button
              variant="danger"
              onClick={async () => {
                if (!window.confirm('Delete this expense?')) return
                await deleteExpense(expense.id)
                onDeleted?.()
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
