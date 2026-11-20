import { memo } from 'react'
import { Box, Flex, IconButton, Text, chakra } from '@chakra-ui/react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChevronDown, ChevronRight, Clock } from 'lucide-react'
import { ActiveItemRow } from '@/features/items/components/ActiveItemRow'
import { useAllListsSection } from '@/features/allLists/useAllListsSection'
import {
  LIST_BODY_DROPPABLE_PREFIX,
  LIST_HEADER_DROPPABLE_PREFIX,
} from '@/features/allLists/allListsService'
import type { ShoppingItem } from '@/features/items/types'
import type { ShoppingList } from '@/features/lists/types'

export interface AllListsSectionProps {
  list: ShoppingList
  // This list's sorted active items (useAllListsScreen subscribes to every
  // list's items once).
  activeItems: ShoppingItem[]
  expanded: boolean
  // Takes listId rather than being pre-bound per instance, so the parent
  // can pass its own stable handler reference directly instead of a new
  // per-list closure every render -- required for React.memo below to
  // actually skip unrelated sections.
  onToggle: (listId: string) => void
  isAddTarget: boolean
  onSelectAddTarget: (listId: string) => void
}

// Per-list accordion section: renders props plus the per-list wiring from
// useAllListsSection -- active items only, done items are shown in the
// screen's combined Done section.
function AllListsSectionImpl({
  list,
  activeItems: active,
  expanded,
  onToggle,
  isAddTarget,
  onSelectAddTarget,
}: AllListsSectionProps) {
  const {
    listColor,
    sortableData,
    sortableIds,
    openSwipeItemId,
    handleSwipeOpenChange,
    handleListScroll,
    editingItemId,
    handleStartEdit,
    handleSubmitEdit,
    handleCancelEdit,
    handleCheck,
    handleDelete,
  } = useAllListsSection(list.id, active)

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
                    onSwipeOpenChange={handleSwipeOpenChange}
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
