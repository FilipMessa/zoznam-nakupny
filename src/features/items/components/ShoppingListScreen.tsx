import { useEffect, useState } from 'react'
import { Box, Flex, Heading } from '@chakra-ui/react'
import { useAuth } from '../../auth/useAuth'
import { LoadingScreen } from '../../auth/components/LoadingScreen'
import { useItems } from '../useItems'
import { sortItems } from '../itemLogic'
import {
  addItem,
  checkItem,
  uncheckItem,
  deleteItem,
  editItemText,
  clearDoneItems,
  reorderItem,
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

  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [openSwipeItemId, setOpenSwipeItemId] = useState<string | null>(null)

  // Native-app swipe-action pattern: an open swipe (Upraviť/Zmazať reveal)
  // closes on any interaction outside the row it belongs to -- tapping
  // another row, the add-item bar, or anywhere else on the page.
  // Opening a *different* row's swipe already forces this one closed via
  // each row's own "isSwipeOpen" prop; this listener covers everything
  // that isn't a row at all.
  useEffect(() => {
    if (!openSwipeItemId) {
      return
    }

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target as HTMLElement
      const row = target.closest('[data-swipe-row]')
      if (row?.getAttribute('data-swipe-row') !== openSwipeItemId) {
        setOpenSwipeItemId(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () =>
      document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [openSwipeItemId])

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

  const handleReorder = async (itemId: string, activeOrder: number) => {
    await reorderItem(listId, itemId, activeOrder)
  }

  const handleDelete = async (itemId: string) => {
    await deleteItem(listId, itemId)
  }

  const handleClearDone = async () => {
    await clearDoneItems(listId)
  }

  const handleStartEdit = (itemId: string) => {
    setEditingItemId(itemId)
  }

  const handleSubmitEdit = async (itemId: string, text: string) => {
    setEditingItemId(null)
    await editItemText(listId, itemId, text)
  }

  const handleCancelEdit = () => {
    setEditingItemId(null)
  }

  const handleSwipeOpenChange = (itemId: string, open: boolean) => {
    setOpenSwipeItemId(open ? itemId : null)
  }

  const handleListScroll = () => {
    if (openSwipeItemId) {
      setOpenSwipeItemId(null)
    }
  }

  const sectionHeadingStyle = {
    fontWeight: '800',
    fontSize: '11px',
    color: 'fg.muted',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    m: '0',
  }

  return (
    <Flex direction="column" flex="1 1 auto" minH="0">
      <Box
        as="main"
        flex="1 1 auto"
        minH="0"
        overflowY="auto"
        onScroll={handleListScroll}
      >
        <Box as="section">
          <Flex align="center" justify="space-between" padding="14px 16px 6px">
            <Heading as="h2" {...sectionHeadingStyle}>
              {active.length > 0 ? `Na kúpu · ${active.length}` : 'Na kúpu'}
            </Heading>
          </Flex>
          <ActiveItemsList
            items={active}
            onCheck={(itemId) => void handleCheck(itemId)}
            onDelete={(itemId) => void handleDelete(itemId)}
            onReorder={(itemId, activeOrder) =>
              void handleReorder(itemId, activeOrder)
            }
            editingItemId={editingItemId}
            onStartEdit={handleStartEdit}
            onSubmitEdit={(itemId, text) => void handleSubmitEdit(itemId, text)}
            onCancelEdit={handleCancelEdit}
            openSwipeItemId={openSwipeItemId}
            onSwipeOpenChange={handleSwipeOpenChange}
          />
        </Box>

        <Box as="section" borderTop="1px solid" borderColor="border">
          <Flex align="center" justify="space-between" padding="14px 16px 6px">
            <Heading as="h2" {...sectionHeadingStyle}>
              {done.length > 0 ? `Hotové · ${done.length}` : 'Hotové'}
            </Heading>
            <ClearDoneButton
              doneCount={done.length}
              onClear={() => void handleClearDone()}
            />
          </Flex>
          <DoneItemsList
            items={done}
            onUncheck={(itemId) => void handleUncheck(itemId)}
            onDelete={(itemId) => void handleDelete(itemId)}
            openSwipeItemId={openSwipeItemId}
            onSwipeOpenChange={handleSwipeOpenChange}
          />
        </Box>
      </Box>

      <Box flex="0 0 auto" bg="bg" borderTop="1px solid" borderColor="border" pb="env(safe-area-inset-bottom)">
        <AddItemForm
          onSubmit={(text) => void handleAdd(text)}
          pending={addPending}
          error={addError}
        />
      </Box>
    </Flex>
  )
}
