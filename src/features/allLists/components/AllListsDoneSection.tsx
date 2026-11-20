import { memo } from 'react'
import { Box, Flex, Heading, Text } from '@chakra-ui/react'
import { ClearDoneButton } from '@/features/items/components/ClearDoneButton'
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

const sectionHeadingStyle = {
  fontWeight: '800',
  fontSize: '11px',
  color: 'fg.muted',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  m: '0',
}

function AllListsDoneSectionImpl({
  items,
  onUncheck,
  onDelete,
  onClearAll,
}: AllListsDoneSectionProps) {
  const { openSwipeItemId, handleSwipeOpenChange } = useSwipeRowRegistry()

  return (
    <Box as="section" borderTop="1px solid" borderColor="border">
      <Flex align="center" justify="space-between" padding="14px 16px 6px">
        <Heading as="h2" {...sectionHeadingStyle}>
          {items.length > 0 ? `Hotové · ${items.length}` : 'Hotové'}
        </Heading>
        <ClearDoneButton doneCount={items.length} onClear={onClearAll} />
      </Flex>

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
    </Box>
  )
}

export const AllListsDoneSection = memo(AllListsDoneSectionImpl)
