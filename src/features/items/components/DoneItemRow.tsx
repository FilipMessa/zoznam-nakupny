import { memo } from 'react'
import { Box, Button, Checkbox, IconButton, Text } from '@chakra-ui/react'
import { Clock, Trash2 } from 'lucide-react'
import type { ShoppingItem } from '../types'
import { useRowSwipeSync } from '../useRowSwipeSync'

// Done items only ever reveal a single "Zmazať" action -- editing a
// checked-off item's text isn't supported (see ActiveItemRow for the
// two-action swipe used by active items).
const swipeActionWidth = 84

export interface DoneItemRowProps {
  item: ShoppingItem
  onUncheck: (id: string) => void
  onDelete: (id: string) => void
  isSwipeOpen: boolean
  onSwipeOpenChange: (open: boolean) => void
  // Origin List indicator (docs/feature-all-lists-done-items.md) -- only
  // used by the All Lists screen's combined Done section, which mixes
  // items from several lists. ShoppingListScreen never passes this.
  originColor?: string
}

function DoneItemRowImpl({
  item,
  onUncheck,
  onDelete,
  isSwipeOpen,
  onSwipeOpenChange,
  originColor,
}: DoneItemRowProps) {
  const {
    swipeOffset,
    isSwiping,
    closeSwipeAction,
    swipeHandlers,
    onForegroundClickCapture,
  } = useRowSwipeSync({
    actionsWidth: swipeActionWidth,
    isSwipeOpen,
    onSwipeOpenChange,
  })

  const handleDelete = () => {
    closeSwipeAction()
    onSwipeOpenChange(false)
    onDelete(item.id)
  }

  return (
    <Box
      as="li"
      position="relative"
      minH="52px"
      overflow="hidden"
      data-testid={`done-item-${item.id}`}
      data-swipe-row={item.id}
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
        data-testid={`done-item-content-${item.id}`}
        display="flex"
        alignItems="center"
        minH="52px"
        padding="0 8px 0 0"
        bg="bg"
        transform={`translateX(${swipeOffset}px)`}
        transition={isSwiping ? 'none' : 'transform 160ms ease'}
        css={{ touchAction: 'pan-y' }}
        {...swipeHandlers}
        onClickCapture={onForegroundClickCapture}
      >
        {/* Checkbox.Root renders as a <label>, so only the control (not
            the item text) lives inside it -- otherwise tapping anywhere on
            the row's text would also toggle it. */}
        <Checkbox.Root
          checked={true}
          onCheckedChange={() => onUncheck(item.id)}
          display="flex"
          alignItems="center"
          cursor="pointer"
          pl="48px"
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
        {originColor && (
          <Box
            as="span"
            aria-hidden="true"
            data-testid="done-item-origin-dot"
            w="8px"
            h="8px"
            borderRadius="50%"
            flexShrink="0"
            m="0 0 0 10px"
            bg={originColor}
          />
        )}
        <Text
          flex="1 1 auto"
          minW="0"
          m="0 0 0 12px"
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
        {/* Always rendered (never conditionally mounted) so this icon's
            space is permanently reserved -- see ActiveItemRow for why. */}
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

export const DoneItemRow = memo(DoneItemRowImpl)
