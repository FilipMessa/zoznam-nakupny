import { Box, Checkbox, IconButton, Text } from '@chakra-ui/react'
import { Trash2 } from 'lucide-react'
import type { ShoppingItem } from '../types'

export interface DoneItemRowProps {
  item: ShoppingItem
  onUncheck: (id: string) => void
  onDelete: (id: string) => void
}

export function DoneItemRow({ item, onUncheck, onDelete }: DoneItemRowProps) {
  return (
    <Box as="li" display="flex" alignItems="center" minH="52px" padding="0 8px 0 0">
      <Checkbox.Root
        checked={true}
        onCheckedChange={() => onUncheck(item.id)}
        display="flex"
        alignItems="center"
        gap="12px"
        flex="1 1 auto"
        minW="0"
        cursor="pointer"
        pl="48px"
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control
          w="26px"
          h="26px"
          minW="26px"
          borderRadius="8px"
          borderWidth="2.5px"
          borderColor="border"
          bg="bg.panel"
          _checked={{ bg: 'green.solid', borderColor: 'green.solid' }}
        />
        <Checkbox.Label asChild>
          <Text
            flex="1 1 auto"
            fontWeight="500"
            fontSize="16px"
            color="fg.subtle"
            textDecoration="line-through"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {item.text}
          </Text>
        </Checkbox.Label>
      </Checkbox.Root>
      <IconButton
        type="button"
        className="icon-btn"
        aria-label="Zmazať"
        variant="ghost"
        minW="36px"
        minH="36px"
        color="fg.subtle"
        _hover={{ color: 'red.solid', bg: 'red.subtle' }}
        onClick={() => onDelete(item.id)}
      >
        <Trash2 size={17} />
      </IconButton>
    </Box>
  )
}
