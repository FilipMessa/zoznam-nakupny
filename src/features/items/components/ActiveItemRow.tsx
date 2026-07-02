import { useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { Box, Button, Checkbox, IconButton, Input, Text, chakra } from '@chakra-ui/react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock, GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { ShoppingItem } from '../types'
import { useSwipeActions } from '../useSwipeActions'

// Two 72px actions revealed side by side (Upraviť + Zmazať), Zmazať flush
// against the trailing edge as before.
const editActionWidth = 72
const deleteActionWidth = 72
const swipeActionWidth = editActionWidth + deleteActionWidth

export interface ActiveItemRowProps {
  item: ShoppingItem
  onCheck: (id: string) => void
  onDelete: (id: string) => void
  isEditing: boolean
  onStartEdit: (id: string) => void
  onSubmitEdit: (id: string, text: string) => void
  onCancelEdit: () => void
  isSwipeOpen: boolean
  onSwipeOpenChange: (open: boolean) => void
}

export function ActiveItemRow({
  item,
  onCheck,
  onDelete,
  isEditing,
  onStartEdit,
  onSubmitEdit,
  onCancelEdit,
  isSwipeOpen,
  onSwipeOpenChange,
}: ActiveItemRowProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: isEditing })

  const {
    swipeOffset,
    isSwiping,
    closeSwipeAction,
    swipeHandlers,
    onForegroundClickCapture,
  } = useSwipeActions(swipeActionWidth)

  // A row that lost exclusive "open" status (another row opened, or a tap
  // landed outside every row) snaps itself shut. This is the React-endorsed
  // "adjust state during rendering" pattern, not an effect, since it's
  // purely deriving local state from a prop.
  if (!isSwipeOpen && swipeOffset !== 0) {
    closeSwipeAction()
  }

  // The reverse direction -- telling the parent this row just became the
  // open one -- has to be an effect: it's notifying a sibling's state, not
  // deriving this row's own render output.
  useEffect(() => {
    if (swipeOffset !== 0) {
      onSwipeOpenChange(true)
    }
  }, [swipeOffset, onSwipeOpenChange])

  const inputRef = useRef<HTMLInputElement>(null)
  const cancelledRef = useRef(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleDelete = () => {
    closeSwipeAction()
    onSwipeOpenChange(false)
    onDelete(item.id)
  }

  const handleEditTrigger = () => {
    closeSwipeAction()
    onSwipeOpenChange(false)
    onStartEdit(item.id)
  }

  const trySubmitEdit = () => {
    const value = inputRef.current?.value ?? ''
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      onCancelEdit()
      return
    }
    onSubmitEdit(item.id, trimmed)
  }

  const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      cancelledRef.current = true
      onCancelEdit()
    }
  }

  const handleEditBlur = () => {
    if (cancelledRef.current) {
      cancelledRef.current = false
      return
    }
    trySubmitEdit()
  }

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    trySubmitEdit()
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
      data-swipe-row={item.id}
      {...(isDragging && {
        borderRadius: '14px',
        boxShadow: '0 8px 28px rgba(28, 21, 16, 0.18)',
        pos: 'relative',
        zIndex: '20',
      })}
    >
      <Box
        position="absolute"
        top="0"
        right="0"
        bottom="0"
        w={`${swipeActionWidth}px`}
        h="100%"
        display="flex"
      >
        <Button
          type="button"
          aria-label="Upraviť položku"
          aria-hidden={swipeOffset === 0}
          tabIndex={swipeOffset === 0 ? -1 : 0}
          w={`${editActionWidth}px`}
          h="100%"
          borderRadius="0"
          bg="bg.muted"
          color="fg"
          fontSize="13px"
          fontWeight="800"
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={handleEditTrigger}
          _hover={{ bg: 'bg.muted' }}
          _active={{ bg: 'bg.muted' }}
        >
          <Text as="span">Upraviť</Text>
        </Button>
        <Button
          type="button"
          aria-label="Vymazať položku"
          aria-hidden={swipeOffset === 0}
          tabIndex={swipeOffset === 0 ? -1 : 0}
          w={`${deleteActionWidth}px`}
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
      </Box>

      {isEditing ? (
        <chakra.form
          onSubmit={handleEditSubmit}
          data-testid={`active-item-content-${item.id}`}
          display="flex"
          alignItems="center"
          minH="56px"
          padding="0 8px 0 16px"
          bg="bg"
        >
          <Input
            ref={inputRef}
            defaultValue={item.text}
            autoFocus
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={handleEditKeyDown}
            onBlur={handleEditBlur}
            flex="1 1 auto"
            minW="0"
            h="40px"
            fontSize="16px"
            fontWeight="600"
            bg="bg.panel"
            border="2px solid"
            borderColor="terracotta.solid"
            borderRadius="10px"
            color="fg"
            _focus={{ outline: 'none' }}
          />
        </chakra.form>
      ) : (
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
            onClick={handleDelete}
          >
            <Trash2 size={17} />
          </IconButton>
        </Box>
      )}
    </Box>
  )
}
