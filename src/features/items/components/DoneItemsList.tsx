import { Box, Text } from '@chakra-ui/react'
import type { ShoppingItem } from '@/features/items/types'
import { DoneItemRow } from './DoneItemRow'

export interface DoneItemsListProps {
  items: ShoppingItem[]
  onUncheck: (id: string) => void
  onDelete: (id: string) => void
  openSwipeItemId: string | null
  onSwipeOpenChange: (itemId: string, open: boolean) => void
}

export function DoneItemsList({
  items,
  onUncheck,
  onDelete,
  openSwipeItemId,
  onSwipeOpenChange,
}: DoneItemsListProps) {
  if (items.length === 0) {
    return (
      <Text
        padding="10px 16px 20px"
        fontSize="14px"
        color="fg.subtle"
        fontWeight="500"
      >
        Zatiaľ nič hotové.
      </Text>
    )
  }

  return (
    <Box as="ul" listStyle="none" m="0" p="0" css={{ userSelect: 'none' }}>
      {items.map((item) => (
        <DoneItemRow
          key={item.id}
          item={item}
          onUncheck={onUncheck}
          onDelete={onDelete}
          isSwipeOpen={openSwipeItemId === item.id}
          onSwipeOpenChange={(open) => onSwipeOpenChange(item.id, open)}
        />
      ))}
    </Box>
  )
}
