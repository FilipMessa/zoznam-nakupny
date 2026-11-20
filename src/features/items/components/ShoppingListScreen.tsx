import { Box, Flex, Heading } from '@chakra-ui/react'
import { LoadingScreen } from '@/features/auth/components/LoadingScreen'
import { useShoppingListScreen } from '@/features/items/useShoppingListScreen'
import { AddItemForm } from './AddItemForm'
import { ActiveItemsList } from './ActiveItemsList'
import { DoneItemsList } from './DoneItemsList'
import { PurchasedSection } from './PurchasedSection'

export interface ShoppingListScreenProps {
  listId: string
}

export function ShoppingListScreen({ listId }: ShoppingListScreenProps) {
  const { itemsLoading, active, done, mainRef, swipe, editing, add, actions } =
    useShoppingListScreen(listId)

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
        onScroll={swipe.handleListScroll}
      >
        <Box as="section">
          <Flex align="center" justify="space-between" padding="14px 16px 6px">
            <Heading as="h2" {...sectionHeadingStyle}>
              {active.length > 0 ? `Na kúpu · ${active.length}` : 'Na kúpu'}
            </Heading>
          </Flex>
          <ActiveItemsList
            items={active}
            onCheck={actions.handleCheck}
            onDelete={actions.handleDelete}
            onReorder={actions.handleReorder}
            editingItemId={editing.editingItemId}
            onStartEdit={editing.handleStartEdit}
            onSubmitEdit={editing.handleSubmitEdit}
            onCancelEdit={editing.handleCancelEdit}
            openSwipeItemId={swipe.openSwipeItemId}
            onSwipeOpenChange={swipe.handleSwipeOpenChange}
          />
        </Box>

        <PurchasedSection
          key={listId}
          count={done.length}
          onClear={actions.handleClearDone}
        >
          <DoneItemsList
            items={done}
            onUncheck={actions.handleUncheck}
            onDelete={actions.handleDelete}
            openSwipeItemId={swipe.openSwipeItemId}
            onSwipeOpenChange={swipe.handleSwipeOpenChange}
          />
        </PurchasedSection>
      </Box>

      <Box
        flex="0 0 auto"
        bg="bg"
        borderTop="1px solid"
        borderColor="border"
        pb="env(safe-area-inset-bottom)"
      >
        <AddItemForm
          purchasedItems={done}
          onSubmit={add.handleAdd}
          error={add.addError}
        />
      </Box>
    </Flex>
  )
}
