import { Box, Checkbox, Text } from '@chakra-ui/react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { ShoppingItem } from '../types'

export interface ActiveItemRowProps {
  item: ShoppingItem
  onCheck: (id: string) => void
}

export function ActiveItemRow({ item, onCheck }: ActiveItemRowProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Box
      as="li"
      ref={(node: HTMLLIElement | null) => {
        setNodeRef(node)
        setActivatorNodeRef(node)
      }}
      style={style}
      display="flex"
      alignItems="center"
      minH="56px"
      padding="0 8px 0 0"
      animation="itemIn 0.3s ease"
      cursor="grab"
      data-testid={`active-item-${item.id}`}
      _active={{ cursor: 'grabbing' }}
      css={{
        touchAction: 'manipulation',
      }}
      {...attributes}
      {...listeners}
      {...(isDragging && {
        bg: 'bg.panel',
        borderRadius: '14px',
        boxShadow: '0 8px 28px rgba(28, 21, 16, 0.18)',
        pos: 'relative',
        zIndex: '20',
      })}
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
      <Checkbox.Root
        checked={false}
        onCheckedChange={() => onCheck(item.id)}
        display="flex"
        alignItems="center"
        gap="12px"
        flex="1 1 auto"
        minW="0"
        cursor="pointer"
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
            fontWeight="600"
            fontSize="16px"
            color="fg"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {item.text}
          </Text>
        </Checkbox.Label>
      </Checkbox.Root>
    </Box>
  )
}
