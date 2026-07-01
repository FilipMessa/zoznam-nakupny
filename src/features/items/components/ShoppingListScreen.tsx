import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { LoadingScreen } from '../../auth/components/LoadingScreen'
import { useItems } from '../useItems'
import { sortItems } from '../itemLogic'
import {
  addItem,
  checkItem,
  uncheckItem,
  deleteItem,
  clearDoneItems,
} from '../itemService'
import { AddItemForm } from './AddItemForm'
import { ActiveItemsList } from './ActiveItemsList'
import { DoneItemsList } from './DoneItemsList'
import { ClearDoneButton } from './ClearDoneButton'

export interface ShoppingListScreenProps {
  listId: string
}

export function ShoppingListScreen({ listId }: ShoppingListScreenProps) {
  const { user } = useAuth()
  const { items, itemsLoading } = useItems(listId)

  const [addPending, setAddPending] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  if (itemsLoading) {
    return <LoadingScreen />
  }

  const { active, done } = sortItems(items)

  const handleAdd = async (text: string) => {
    if (!user) {
      return
    }
    setAddPending(true)
    setAddError(null)
    try {
      await addItem(listId, text, user.uid, active)
    } catch {
      setAddError('unknown')
    } finally {
      setAddPending(false)
    }
  }

  const handleCheck = async (itemId: string) => {
    if (!user) {
      return
    }
    await checkItem(listId, itemId, user.uid)
  }

  const handleUncheck = async (itemId: string) => {
    await uncheckItem(listId, itemId, active)
  }

  const handleDelete = async (itemId: string) => {
    await deleteItem(listId, itemId)
  }

  const handleClearDone = async () => {
    await clearDoneItems(listId)
  }

  return (
    <div>
      <AddItemForm
        onSubmit={(text) => void handleAdd(text)}
        pending={addPending}
        error={addError}
      />

      <section>
        <h2>To buy</h2>
        <ActiveItemsList
          items={active}
          onCheck={(itemId) => void handleCheck(itemId)}
        />
      </section>

      <section>
        <h2>Done</h2>
        <ClearDoneButton
          doneCount={done.length}
          onClear={() => void handleClearDone()}
        />
        <DoneItemsList
          items={done}
          onUncheck={(itemId) => void handleUncheck(itemId)}
          onDelete={(itemId) => void handleDelete(itemId)}
        />
      </section>
    </div>
  )
}
