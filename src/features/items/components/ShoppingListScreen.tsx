import { useState } from 'react'
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
  clearDoneItems,
  reorderItem,
} from '../itemService'
import { AddItemForm } from './AddItemForm'
import { ActiveItemsList } from './ActiveItemsList'
import { DoneItemsList } from './DoneItemsList'
import { ClearDoneButton } from './ClearDoneButton'
import { SyncStatusBanner } from './SyncStatusBanner'

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
  const pendingCount = items.filter((item) => item.pendingSync).length

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
      <Box as="main" flex="1 1 auto" minH="0" overflowY="auto">
        <SyncStatusBanner pendingCount={pendingCount} />
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
