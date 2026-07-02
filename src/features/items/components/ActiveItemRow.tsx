import { Box, Button, Checkbox, IconButton, Text } from '@chakra-ui/react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock, GripVertical, Trash2 } from 'lucide-react'
import type { ShoppingItem } from '../types'
import { swipeActionWidth, useSwipeToDelete } from '../useSwipeToDelete'

export interface ActiveItemRowProps {
  item: ShoppingItem
  onCheck: (id: string) => void
  onDelete: (id: string) => void
}

export function ActiveItemRow({ item, onCheck, onDelete }: ActiveItemRowProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const {
    swipeOffset,
    isSwiping,
    closeSwipeAction,
    swipeHandlers,
    onForegroundClickCapture,
  } = useSwipeToDelete()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleDelete = () => {
    closeSwipeAction()
    onDelete(item.id)
  }

  return (
    <Box
      as="li"
      ref={setNodeRef}
      style={style}
      position="relative"
      minH="56px"
      overflow="hidden"
      animation="itemIn 0.3s ease"
      data-testid={`active-item-${item.id}`}
      {...(isDragging && {
        borderRadius: '14px',
        boxShadow: '0 8px 28px rgba(28, 21, 16, 0.18)',
        pos: 'relative',
        zIndex: '20',
      })}
    >
      <Button
        type="button"
        aria-label="Vymazať položku"
        aria-hidden={swipeOffset === 0}
        tabIndex={swipeOffset === 0 ? -1 : 0}
        position="absolute"
        top="0"
        right="0"
        bottom="0"
        w={`${swipeActionWidth}px`}
        h="100%"
        borderRadius="0"
        bg="red.solid"
        color="red.contrast"
        fontSize="13px"
        fontWeight="800"
        display="flex"
        alignItems="center"
        justifyContent="center"
        onClick={handleDelete}
        _hover={{ bg: 'red.solid' }}
        _active={{ bg: 'red.solid' }}
      >
        <Text as="span">Zmazať</Text>
      </Button>

      <Box
        ref={setActivatorNodeRef}
        data-testid={`active-item-content-${item.id}`}
        display="flex"
        alignItems="center"
        minH="56px"
        padding="0 8px 0 0"
        bg={isDragging ? 'bg.panel' : 'bg'}
        transform={`translateX(${swipeOffset}px)`}
        transition={isSwiping ? 'none' : 'transform 160ms ease'}
        cursor="grab"
        _active={{ cursor: 'grabbing' }}
        css={{ touchAction: 'pan-y' }}
        {...attributes}
        {...listeners}
        {...swipeHandlers}
        onClickCapture={onForegroundClickCapture}
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
        {/* Always rendered (never conditionally mounted) so this icon's
            space is permanently reserved -- toggling it in and out of the
            layout would shift the checkbox next to it, which is exactly
            what happens if hasPendingWrites flickers while Firestore
            retries a dropped connection, making the checkbox miss taps. */}
        <Box
          as="span"
          title={item.pendingSync ? 'Čaká na odoslanie' : undefined}
          aria-label={item.pendingSync ? 'Čaká na odoslanie' : undefined}
          aria-hidden={item.pendingSync ? undefined : true}
          visibility={item.pendingSync ? 'visible' : 'hidden'}
          color="fg.subtle"
          flexShrink="0"
          display="flex"
          m="0 4px"
        >
          <Clock size={15} />
        </Box>
        <IconButton
          type="button"
          className="icon-btn"
          aria-label="Zmazať"
          variant="ghost"
          display={{ base: 'none', md: 'inline-flex' }}
          minW="36px"
          minH="36px"
          color="fg.subtle"
          _hover={{ color: 'red.solid', bg: 'red.subtle' }}
          onClick={handleDelete}
        >
          <Trash2 size={17} />
        </IconButton>
      </Box>
    </Box>
  )
}
