import { useRef, useState, type PointerEvent } from 'react'
import { Box, Button, Checkbox, IconButton, Text } from '@chakra-ui/react'
import { Trash2 } from 'lucide-react'
import type { ShoppingItem } from '../types'

export interface DoneItemRowProps {
  item: ShoppingItem
  onUncheck: (id: string) => void
  onDelete: (id: string) => void
}

const swipeActionWidth = 84
const swipeOpenThreshold = 36

function clampSwipeOffset(value: number) {
  return Math.min(0, Math.max(-swipeActionWidth, value))
}

export function DoneItemRow({ item, onUncheck, onDelete }: DoneItemRowProps) {
  const [swipeOffset, setSwipeOffsetState] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const swipeOffsetRef = useRef(0)
  const touchStartRef = useRef<{
    x: number
    y: number
    startOffset: number
    swiping: boolean
  } | null>(null)

  const setSwipeOffset = (value: number) => {
    const clampedValue = clampSwipeOffset(value)
    swipeOffsetRef.current = clampedValue
    setSwipeOffsetState(clampedValue)
  }

  const closeSwipeAction = () => setSwipeOffset(0)

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') {
      return
    }

    touchStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      startOffset: swipeOffsetRef.current,
      swiping: false,
    }
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const touchStart = touchStartRef.current
    if (!touchStart || event.pointerType !== 'touch') {
      return
    }

    const deltaX = event.clientX - touchStart.x
    const deltaY = event.clientY - touchStart.y
    const absoluteDeltaX = Math.abs(deltaX)
    const absoluteDeltaY = Math.abs(deltaY)

    if (!touchStart.swiping) {
      if (absoluteDeltaX < 8 && absoluteDeltaY < 8) {
        return
      }

      if (absoluteDeltaY > absoluteDeltaX) {
        touchStartRef.current = null
        return
      }

      touchStart.swiping = true
      setIsSwiping(true)
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }

    event.preventDefault()
    setSwipeOffset(touchStart.startOffset + deltaX)
  }

  const finishSwipe = () => {
    const touchStart = touchStartRef.current
    if (!touchStart) {
      return
    }

    const shouldOpen =
      touchStart.swiping && swipeOffsetRef.current <= -swipeOpenThreshold
    setIsSwiping(false)
    setSwipeOffset(shouldOpen ? -swipeActionWidth : 0)
    touchStartRef.current = null
  }

  const handleForegroundClickCapture = (
    event: PointerEvent<HTMLDivElement>,
  ) => {
    if (swipeOffsetRef.current === 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    closeSwipeAction()
  }

  const handleDelete = () => {
    closeSwipeAction()
    onDelete(item.id)
  }

  return (
    <Box
      as="li"
      position="relative"
      minH="52px"
      overflow="hidden"
      data-testid={`done-item-${item.id}`}
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
        onClickCapture={handleForegroundClickCapture}
      >
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
