import { Box, Button, Text } from '@chakra-ui/react'

// Two 72px actions revealed side by side (Upraviť + Zmazať), Zmazať flush
// against the trailing edge.
export const EDIT_ACTION_WIDTH = 72
export const DELETE_ACTION_WIDTH = 72
export const SWIPE_ACTIONS_WIDTH = EDIT_ACTION_WIDTH + DELETE_ACTION_WIDTH

export interface ActiveItemSwipeActionsProps {
  // Force the actions hidden while editing, regardless of swipeOffset --
  // the edit form doesn't apply the swipe transform, so there's nothing to
  // keep them in sync with visually.
  hidden: boolean
  onEdit: () => void
  onDelete: () => void
}

// The action buttons that sit underneath the row's foreground and get
// revealed by swiping it.
export function ActiveItemSwipeActions({
  hidden,
  onEdit,
  onDelete,
}: ActiveItemSwipeActionsProps) {
  return (
    <Box
      position="absolute"
      top="0"
      right="0"
      bottom="0"
      w={`${SWIPE_ACTIONS_WIDTH}px`}
      h="100%"
      display="flex"
      visibility={hidden ? 'hidden' : 'visible'}
    >
      <Button
        type="button"
        aria-label="Upraviť položku"
        aria-hidden={hidden}
        tabIndex={hidden ? -1 : 0}
        w={`${EDIT_ACTION_WIDTH}px`}
        h="100%"
        borderRadius="0"
        bg="bg.muted"
        color="fg"
        fontSize="13px"
        fontWeight="800"
        display="flex"
        alignItems="center"
        justifyContent="center"
        onClick={onEdit}
        _hover={{ bg: 'bg.muted' }}
        _active={{ bg: 'bg.muted' }}
      >
        <Text as="span">Upraviť</Text>
      </Button>
      <Button
        type="button"
        aria-label="Vymazať položku"
        aria-hidden={hidden}
        tabIndex={hidden ? -1 : 0}
        w={`${DELETE_ACTION_WIDTH}px`}
        h="100%"
        borderRadius="0"
        bg="red.solid"
        color="red.contrast"
        fontSize="13px"
        fontWeight="800"
        display="flex"
        alignItems="center"
        justifyContent="center"
        onClick={onDelete}
        _hover={{ bg: 'red.solid' }}
        _active={{ bg: 'red.solid' }}
      >
        <Text as="span">Zmazať</Text>
      </Button>
    </Box>
  )
}
