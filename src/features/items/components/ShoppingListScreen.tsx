import { Box, Flex, Heading } from '@chakra-ui/react'
import { LoadingScreen } from '@/features/auth/components/LoadingScreen'
import { useShoppingListScreen } from '@/features/items/useShoppingListScreen'
import { AddItemForm } from './AddItemForm'
import { ActiveItemsList } from './ActiveItemsList'
import { DoneItemsList } from './DoneItemsList'
import { ClearDoneButton } from './ClearDoneButton'

export interface ShoppingListScreenProps {
  listId: string
}

export function ShoppingListScreen({ listId }: ShoppingListScreenProps) {
  const {
    itemsLoading,
    active,
    done,
    mainRef,
    addError,
    handleAdd,
    handleCheck,
    handleUncheck,
    handleReorder,
    handleDelete,
    handleClearDone,
    editingItemId,
    handleStartEdit,
    handleSubmitEdit,
    handleCancelEdit,
    openSwipeItemId,
    handleSwipeOpenChange,
    handleListScroll,
  } = useShoppingListScreen(listId)

  if (itemsLoading) {
    return <LoadingScreen />
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
        ref={mainRef}
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
            onCheck={handleCheck}
            onDelete={handleDelete}
            onReorder={(itemId, activeOrder) =>
              void handleReorder(itemId, activeOrder)
            }
            editingItemId={editingItemId}
            onStartEdit={handleStartEdit}
            onSubmitEdit={handleSubmitEdit}
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
            onUncheck={handleUncheck}
            onDelete={handleDelete}
            openSwipeItemId={openSwipeItemId}
            onSwipeOpenChange={handleSwipeOpenChange}
          />
        </Box>
      </Box>

      <Box
        flex="0 0 auto"
        bg="bg"
        borderTop="1px solid"
        borderColor="border"
        pb="env(safe-area-inset-bottom)"
      >
        <AddItemForm
          onSubmit={(text) => void handleAdd(text)}
          error={addError}
        />
      </Box>
    </Flex>
  )
}
