import { Box, Button } from '@chakra-ui/react'
import { Clock } from 'lucide-react'
import type { ShoppingList } from '../types'

export interface ListSwitcherItemProps {
  list: ShoppingList
  selected: boolean
  onSelect: (listId: string) => void
}

export function ListSwitcherItem({
  list,
  selected,
  onSelect,
}: ListSwitcherItemProps) {
  return (
    <Box as="li" m="2px 10px">
      <Button
        type="button"
        aria-current={selected ? 'true' : undefined}
        onClick={() => onSelect(list.id)}
        display="flex"
        alignItems="center"
        gap="12px"
        w="full"
        minH="54px"
        padding="0 14px"
        bg={selected ? 'terracotta.subtle' : 'transparent'}
        border="1.5px solid"
        borderColor={selected ? 'rgba(200, 98, 43, 0.18)' : 'transparent'}
        borderRadius="12px"
        justifyContent="flex-start"
        textAlign="left"
        fontWeight={selected ? '900' : '600'}
        fontSize="16px"
        color={selected ? 'terracotta.solid' : 'fg'}
      >
        <Box
          aria-hidden="true"
          w="8px"
          h="8px"
          borderRadius="50%"
          flexShrink="0"
          bg={selected ? 'terracotta.solid' : 'border'}
        />
        {list.name}
        {list.pendingSync && (
          <Box
            as="span"
            title="Zoznam čaká na odoslanie"
            aria-label="Zoznam čaká na odoslanie"
            color="fg.subtle"
            flexShrink="0"
            display="flex"
            ml="auto"
          >
            <Clock size={15} />
          </Box>
        )}
      </Button>
    </Box>
  )
}
