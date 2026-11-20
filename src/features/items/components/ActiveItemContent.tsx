import type { ComponentProps, Ref } from 'react'
import { ItemAuthorAvatar } from './ItemAuthorAvatar'
import { Box, Checkbox, IconButton, Text } from '@chakra-ui/react'
import { Clock, GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { ShoppingItem } from '@/features/items/types'

export interface ActiveItemContentProps {
  item: ShoppingItem
  isDragging: boolean
  swipeOffset: number
  isSwiping: boolean
  // dnd-kit's drag activator ref, plus the attributes/listeners and the
  // swipe/tap handlers (useSwipeActions) that go on the same element --
  // spread opaquely.
  activatorRef: Ref<HTMLDivElement>
  gestureProps: ComponentProps<typeof Box>
  onCheck: (id: string) => void
  onStartEdit: (id: string) => void
  onDelete: () => void
}

// The row's foreground (grip, checkbox, text, pending-sync clock and the
// desktop edit/delete buttons) -- the part that slides over the swipe actions.
export function ActiveItemContent({
  item,
  isDragging,
  swipeOffset,
  isSwiping,
  activatorRef,
  gestureProps,
  onCheck,
  onStartEdit,
  onDelete,
}: ActiveItemContentProps) {
  return (
    <Box
      ref={activatorRef}
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
      {...gestureProps}
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
      {/* Checkbox.Root renders as a <label>, so only the control (not
          the item text) lives inside it. A tap on the rest of the row
          checks it via useSwipeActions' onTap in gestureProps, which
          leaves the label's own clicks alone so one tap never toggles
          twice. */}
      <Checkbox.Root
        checked={false}
        onCheckedChange={() => onCheck(item.id)}
        display="flex"
        alignItems="center"
        cursor="pointer"
      >
        <Checkbox.HiddenInput aria-label={item.text} />
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
      </Checkbox.Root>
      <Text
        flex="1 1 auto"
        minW="0"
        m="0 0 0 12px"
        fontWeight="600"
        fontSize="16px"
        color="fg"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        {item.text}
      </Text>
      <ItemAuthorAvatar name={item.createdByName} />
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
        aria-label="Upraviť"
        variant="ghost"
        display={{ base: 'none', md: 'inline-flex' }}
        minW="36px"
        minH="36px"
        color="fg.subtle"
        _hover={{ color: 'fg', bg: 'bg.muted' }}
        onClick={() => onStartEdit(item.id)}
      >
        <Pencil size={16} />
      </IconButton>
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
        onClick={onDelete}
      >
        <Trash2 size={17} />
      </IconButton>
    </Box>
  )
}
