import { Box, Text } from '@chakra-ui/react'
import { GripVertical } from 'lucide-react'
import type { ShoppingItem } from '@/features/items/types'

export interface DraggedItemPreviewProps {
  item: ShoppingItem
}

// Floating visual clone rendered inside <DragOverlay> while dragging an
// item across list boundaries in AllListsScreen. Deliberately NOT
// ActiveItemRow reused verbatim: ActiveItemRow calls useSortable
// internally, and mounting it a second time here -- alongside the original
// row still mounted in its own section under the same item id -- would
// register two draggables/droppables under that one id, a real dnd-kit
// footgun. This is presentational only, with no drag hooks of its own.
export function DraggedItemPreview({ item }: DraggedItemPreviewProps) {
  return (
    <Box
      display="flex"
      alignItems="center"
      minH="56px"
      padding="0 16px 0 0"
      bg="bg.panel"
      borderRadius="14px"
      boxShadow="0 8px 28px rgba(28, 21, 16, 0.18)"
      cursor="grabbing"
    >
      <Box
        aria-hidden="true"
        display="flex"
        alignItems="center"
        justifyContent="center"
        minW="48px"
        w="48px"
        h="56px"
        color="fg.subtle"
      >
        <GripVertical size={20} />
      </Box>
      <Text
        flex="1 1 auto"
        minW="0"
        fontWeight="600"
        fontSize="16px"
        color="fg"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        {item.text}
      </Text>
    </Box>
  )
}
