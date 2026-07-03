import { useEffect } from 'react'
import { Box, Text, chakra } from '@chakra-ui/react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChevronDown, ChevronRight, Clock } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { useItems } from '../../items/useItems'
import { sortItems } from '../../items/itemLogic'
import { useItemActions } from '../../items/useItemActions'
import { useItemEditing } from '../../items/useItemEditing'
import { useSwipeRowRegistry } from '../../items/useSwipeRowRegistry'
import { ActiveItemRow } from '../../items/components/ActiveItemRow'
import type { ShoppingItem } from '../../items/types'
import type { ShoppingList } from '../types'

// Prefixes for this section's cross-list drop targets (the collapsed
// header, and the empty-state body) -- namespaced so they can never collide
// with a real Firestore item id. Shared with useAllListsScreen's onDragEnd,
// which parses these back out of `over.id`.
export const LIST_HEADER_DROPPABLE_PREFIX = 'list-header-'
export const LIST_BODY_DROPPABLE_PREFIX = 'list-body-'

export interface AllListsSectionProps {
  list: ShoppingList
  expanded: boolean
  onToggle: () => void
  // Reports this section's current active items up to the shared
  // DndContext's onDragEnd handler (in useAllListsScreen), which needs
  // synchronous read access to every list's items to compute a drop's
  // destination order and resolve the dragged item's full record -- data
  // that only exists inside each section's own useItems subscription.
  onActiveItemsChange: (listId: string, items: ShoppingItem[]) => void
}

// Self-contained per-list accordion section, mirroring useShoppingListScreen
// -- but active items only (done items are out of scope for this screen,
// see the plan). Each section owns its own useItems subscription: React's
// rules of hooks rule out fanning these out via a loop in a single parent
// hook, since the number of lists can change while the screen is open --
// one useItems call per AllListsSection component instance (keyed by
// list.id in the parent's map) is the only correct way to do this.
export function AllListsSection({
  list,
  expanded,
  onToggle,
  onActiveItemsChange,
}: AllListsSectionProps) {
  const { user } = useAuth()
  const { items } = useItems(list.id)
  const { active } = sortItems(items)

  useEffect(() => {
    onActiveItemsChange(list.id, active)
    // Runs on every render where `active` changed identity (sortItems
    // always returns a fresh array) -- cheap at this app's list/item scale,
    // and simpler than hand-rolling a deep-equality check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.id, active])

  const { openSwipeItemId, handleSwipeOpenChange, handleListScroll } =
    useSwipeRowRegistry()
  const { editingItemId, handleStartEdit, handleSubmitEdit, handleCancelEdit } =
    useItemEditing(list.id)
  const { handleCheck, handleDelete } = useItemActions({
    listId: list.id,
    user,
    activeItems: active,
  })

  // Collapsed header is a drop target -- dragging an item onto it appends
  // to the end of this list, whether or not it's currently expanded to show
  // that drop happening.
  const { setNodeRef: setHeaderDroppableRef } = useDroppable({
    id: `${LIST_HEADER_DROPPABLE_PREFIX}${list.id}`,
    data: { listId: list.id },
  })
  // Empty expanded lists have no item rows to serve as drop targets, so the
  // empty-state text itself becomes one.
  const { setNodeRef: setBodyDroppableRef } = useDroppable({
    id: `${LIST_BODY_DROPPABLE_PREFIX}${list.id}`,
    data: { listId: list.id },
  })

  return (
    <Box as="section" borderTop="1px solid" borderColor="border">
      <chakra.button
        ref={setHeaderDroppableRef}
        type="button"
        onClick={onToggle}
        display="flex"
        alignItems="center"
        gap="8px"
        w="full"
        padding="14px 16px"
        textAlign="left"
        bg="transparent"
        border="none"
        cursor="pointer"
      >
        <Box as="span" color="fg.subtle" flexShrink="0" display="flex">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </Box>
        <Text
          flex="1 1 auto"
          minW="0"
          fontWeight="800"
          fontSize="15px"
          color="fg"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {list.name}
          {active.length > 0 ? ` · ${active.length}` : ''}
        </Text>
        <Box
          as="span"
          title={list.pendingSync ? 'Zoznam čaká na odoslanie' : undefined}
          aria-label={list.pendingSync ? 'Zoznam čaká na odoslanie' : undefined}
          aria-hidden={list.pendingSync ? undefined : true}
          visibility={list.pendingSync ? 'visible' : 'hidden'}
          color="fg.subtle"
          flexShrink="0"
          display="flex"
        >
          <Clock size={15} />
        </Box>
      </chakra.button>

      {expanded && (
        <Box onScroll={handleListScroll}>
          {active.length === 0 ? (
            <Text
              ref={setBodyDroppableRef}
              padding="0 16px 20px"
              fontSize="14px"
              color="fg.subtle"
              fontWeight="500"
            >
              Žiadne položky na kúpu.
            </Text>
          ) : (
            <SortableContext
              items={active.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <Box as="ul" listStyle="none" m="0" p="0" css={{ userSelect: 'none' }}>
                {active.map((item) => (
                  <ActiveItemRow
                    key={item.id}
                    item={item}
                    sortableData={{ listId: list.id }}
                    onCheck={(itemId) => void handleCheck(itemId)}
                    onDelete={(itemId) => void handleDelete(itemId)}
                    isEditing={editingItemId === item.id}
                    onStartEdit={handleStartEdit}
                    onSubmitEdit={(itemId, text) => void handleSubmitEdit(itemId, text)}
                    onCancelEdit={handleCancelEdit}
                    isSwipeOpen={openSwipeItemId === item.id}
                    onSwipeOpenChange={(open) => handleSwipeOpenChange(item.id, open)}
                  />
                ))}
              </Box>
            </SortableContext>
          )}
        </Box>
      )}
    </Box>
  )
}
