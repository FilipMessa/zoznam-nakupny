import { Box, Text, chakra } from '@chakra-ui/react'
import { ChevronDown, ChevronRight, Clock } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { useItems } from '../../items/useItems'
import { sortItems } from '../../items/itemLogic'
import { useItemActions } from '../../items/useItemActions'
import { useItemEditing } from '../../items/useItemEditing'
import { useSwipeRowRegistry } from '../../items/useSwipeRowRegistry'
import { ActiveItemRow } from '../../items/components/ActiveItemRow'
import type { ShoppingList } from '../types'

export interface AllListsSectionProps {
  list: ShoppingList
  expanded: boolean
  onToggle: () => void
}

// Self-contained per-list accordion section, mirroring useShoppingListScreen
// -- but active items only (done items are out of scope for this screen,
// see the plan) and no DndContext/SortableContext yet (that's Phase 7).
// Each section owns its own useItems subscription: React's rules of hooks
// rule out fanning these out via a loop in a single parent hook, since the
// number of lists can change while the screen is open -- one useItems call
// per AllListsSection component instance (keyed by list.id in the parent's
// map) is the only correct way to do this.
export function AllListsSection({ list, expanded, onToggle }: AllListsSectionProps) {
  const { user } = useAuth()
  const { items } = useItems(list.id)
  const { active } = sortItems(items)

  const { openSwipeItemId, handleSwipeOpenChange, handleListScroll } =
    useSwipeRowRegistry()
  const { editingItemId, handleStartEdit, handleSubmitEdit, handleCancelEdit } =
    useItemEditing(list.id)
  const { handleCheck, handleDelete } = useItemActions({
    listId: list.id,
    user,
    activeItems: active,
  })

  return (
    <Box as="section" borderTop="1px solid" borderColor="border">
      <chakra.button
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
            <Text padding="0 16px 20px" fontSize="14px" color="fg.subtle" fontWeight="500">
              Žiadne položky na kúpu.
            </Text>
          ) : (
            <Box as="ul" listStyle="none" m="0" p="0" css={{ userSelect: 'none' }}>
              {active.map((item) => (
                <ActiveItemRow
                  key={item.id}
                  item={item}
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
          )}
        </Box>
      )}
    </Box>
  )
}
