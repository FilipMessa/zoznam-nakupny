import { memo, useEffect, useMemo } from 'react'
import type { RefObject } from 'react'
import { Box, Flex, IconButton, Text, chakra } from '@chakra-ui/react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChevronDown, ChevronRight, Clock } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { useItems } from '@/features/items/useItems'
import { sortItems } from '@/features/items/itemService'
import { useItemActions } from '@/features/items/useItemActions'
import { useItemEditing } from '@/features/items/useItemEditing'
import { useSwipeRowRegistry } from '@/features/items/useSwipeRowRegistry'
import { useScrollNewItemIntoView } from '@/features/items/useScrollNewItemIntoView'
import { ActiveItemRow } from '@/features/items/components/ActiveItemRow'
import { listColorFor } from '@/features/allLists/allListsService'
import type { ShoppingItem } from '@/features/items/types'
import type { ShoppingList } from '@/features/lists/types'

// Prefixes for this section's cross-list drop targets (the collapsed
// header, and the empty-state body) -- namespaced so they can never collide
// with a real Firestore item id. Shared with useAllListsScreen's onDragEnd,
// which parses these back out of `over.id`.
export const LIST_HEADER_DROPPABLE_PREFIX = 'list-header-'
export const LIST_BODY_DROPPABLE_PREFIX = 'list-body-'

export interface AllListsSectionProps {
  list: ShoppingList
  expanded: boolean
  // Takes listId rather than being pre-bound per instance, so the parent
  // can pass its own stable handler reference directly instead of a new
  // per-list closure every render -- required for React.memo below to
  // actually skip unrelated sections.
  onToggle: (listId: string) => void
  // Reports this section's current active items up to the shared
  // DndContext's onDragEnd handler (in useAllListsScreen), which needs
  // synchronous read access to every list's items to compute a drop's
  // destination order and resolve the dragged item's full record -- data
  // that only exists inside each section's own useItems subscription.
  onActiveItemsChange: (listId: string, items: ShoppingItem[]) => void
  // Reports this section's done items up for the combined Done section at
  // the bottom of the screen -- done items are never rendered inside this
  // section itself.
  onDoneItemsChange: (listId: string, items: ShoppingItem[]) => void
  isAddTarget: boolean
  onSelectAddTarget: (listId: string) => void
  // One shared container for the whole screen, not per section.
  mainScrollRef: RefObject<HTMLElement | null>
  onRegisterScrollRequester: (listId: string, requestScroll: () => void) => void
}

// Self-contained per-list accordion section, mirroring useShoppingListScreen
// -- but active items only (done items are out of scope for this screen,
// see the plan). Each section owns its own useItems subscription: React's
// rules of hooks rule out fanning these out via a loop in a single parent
// hook, since the number of lists can change while the screen is open --
// one useItems call per AllListsSection component instance (keyed by
// list.id in the parent's map) is the only correct way to do this.
function AllListsSectionImpl({
  list,
  expanded,
  onToggle,
  onActiveItemsChange,
  onDoneItemsChange,
  isAddTarget,
  onSelectAddTarget,
  mainScrollRef,
  onRegisterScrollRequester,
}: AllListsSectionProps) {
  const { user } = useAuth()
  const { items } = useItems(list.id)
  const { active, done } = sortItems(items)
  const listColor = listColorFor(list.id)

  useEffect(() => {
    onActiveItemsChange(list.id, active)
    // Runs on every render where `active` changed identity (sortItems
    // always returns a fresh array) -- cheap at this app's list/item scale,
    // and simpler than hand-rolling a deep-equality check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.id, active])

  useEffect(() => {
    onDoneItemsChange(list.id, done)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.id, done])

  const { requestScrollAfterAdd } = useScrollNewItemIntoView(
    active,
    mainScrollRef,
  )

  useEffect(() => {
    onRegisterScrollRequester(list.id, requestScrollAfterAdd)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.id, requestScrollAfterAdd])

  const { openSwipeItemId, handleSwipeOpenChange, handleListScroll } =
    useSwipeRowRegistry()
  const { editingItemId, handleStartEdit, handleSubmitEdit, handleCancelEdit } =
    useItemEditing(list.id)
  const { handleCheck, handleDelete } = useItemActions({
    listId: list.id,
    user,
    activeItems: active,
  })

  // Stabilized so ActiveItemRow.memo isn't defeated by a new object literal
  // every render (dnd-kit attaches this to the shared DndContext's
  // active.data.current, read in useAllListsScreen's onDragEnd).
  const sortableData = useMemo(() => ({ listId: list.id }), [list.id])
  // Same reasoning for @dnd-kit/sortable's own internal memoization, which
  // is keyed on this array's identity.
  const sortableIds = useMemo(() => active.map((item) => item.id), [active])

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
      <Flex
        ref={setHeaderDroppableRef}
        alignItems="center"
        gap="4px"
        padding="6px 16px 6px 10px"
      >
        <IconButton
          type="button"
          aria-label={expanded ? 'Zbaliť' : 'Rozbaliť'}
          onClick={() => onToggle(list.id)}
          variant="ghost"
          minW="touchTarget"
          minH="touchTarget"
          color="fg.subtle"
          flexShrink="0"
          _hover={{ bg: 'bg.muted', color: 'fg' }}
        >
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </IconButton>
        <Box
          as="span"
          aria-hidden="true"
          data-testid="list-color-dot"
          w="8px"
          h="8px"
          borderRadius="50%"
          flexShrink="0"
          bg={listColor.solid}
        />
        <chakra.button
          type="button"
          onClick={() => onSelectAddTarget(list.id)}
          aria-current={isAddTarget ? 'true' : undefined}
          display="flex"
          alignItems="center"
          gap="8px"
          flex="1 1 auto"
          minW="0"
          padding="8px"
          textAlign="left"
          bg={isAddTarget ? 'terracotta.subtle' : 'transparent'}
          border="1.5px solid"
          borderColor={isAddTarget ? 'rgba(200, 98, 43, 0.18)' : 'transparent'}
          borderRadius="12px"
          cursor="pointer"
        >
          <Text
            flex="1 1 auto"
            minW="0"
            fontWeight={isAddTarget ? '900' : '800'}
            fontSize="15px"
            color={isAddTarget ? 'terracotta.solid' : 'fg'}
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
            aria-label={
              list.pendingSync ? 'Zoznam čaká na odoslanie' : undefined
            }
            aria-hidden={list.pendingSync ? undefined : true}
            visibility={list.pendingSync ? 'visible' : 'hidden'}
            color="fg.subtle"
            flexShrink="0"
            display="flex"
          >
            <Clock size={15} />
          </Box>
        </chakra.button>
      </Flex>

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
              items={sortableIds}
              strategy={verticalListSortingStrategy}
            >
              <Box
                as="ul"
                listStyle="none"
                m="0"
                p="0"
                css={{ userSelect: 'none' }}
              >
                {active.map((item) => (
                  <ActiveItemRow
                    key={item.id}
                    item={item}
                    sortableData={sortableData}
                    dimWhileDragging
                    onCheck={handleCheck}
                    onDelete={handleDelete}
                    isEditing={editingItemId === item.id}
                    onStartEdit={handleStartEdit}
                    onSubmitEdit={handleSubmitEdit}
                    onCancelEdit={handleCancelEdit}
                    isSwipeOpen={openSwipeItemId === item.id}
                    onSwipeOpenChange={(open) =>
                      handleSwipeOpenChange(item.id, open)
                    }
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

export const AllListsSection = memo(AllListsSectionImpl)
