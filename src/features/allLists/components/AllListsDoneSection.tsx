import { memo } from 'react'
import { Box, Text } from '@chakra-ui/react'
import { PurchasedSection } from '@/features/items/components/PurchasedSection'
import { DoneItemRow } from '@/features/items/components/DoneItemRow'
import { useSwipeRowRegistry } from '@/features/items/useSwipeRowRegistry'
import {
  listColorFor,
  type DoneItemWithOrigin,
} from '@/features/allLists/allListsService'

export interface AllListsDoneSectionProps {
  items: DoneItemWithOrigin[]
  onUncheck: (itemId: string) => void
  onDelete: (itemId: string) => void
  onClearAll: () => void
}

function AllListsDoneSectionImpl({
  items,
  onUncheck,
  onDelete,
  onClearAll,
}: AllListsDoneSectionProps) {
  const { openSwipeItemId, handleSwipeOpenChange } = useSwipeRowRegistry()

  return (
    <PurchasedSection count={items.length} onClear={onClearAll}>
      {items.length === 0 ? (
        <Text
          padding="0 16px 20px"
          fontSize="14px"
          color="fg.subtle"
          fontWeight="500"
        >
          Zatiaľ nič hotové.
        </Text>
      ) : (
        <Box as="ul" listStyle="none" m="0" p="0" css={{ userSelect: 'none' }}>
          {items.map(({ item, listId }) => (
            <DoneItemRow
              key={item.id}
              item={item}
              originColor={listColorFor(listId).solid}
              onUncheck={onUncheck}
              onDelete={onDelete}
              isSwipeOpen={openSwipeItemId === item.id}
              onSwipeOpenChange={handleSwipeOpenChange}
            />
          ))}
        </Box>
      )}
    </PurchasedSection>
  )
}

export const AllListsDoneSection = memo(AllListsDoneSectionImpl)
