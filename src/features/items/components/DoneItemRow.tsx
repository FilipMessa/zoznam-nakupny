import { Box, Button, Checkbox, IconButton, Text } from '@chakra-ui/react'
import { Clock, Trash2 } from 'lucide-react'
import type { ShoppingItem } from '../types'
import { swipeActionWidth, useSwipeToDelete } from '../useSwipeToDelete'

export interface DoneItemRowProps {
  item: ShoppingItem
  onUncheck: (id: string) => void
  onDelete: (id: string) => void
}

export function DoneItemRow({ item, onUncheck, onDelete }: DoneItemRowProps) {
  const {
    swipeOffset,
    isSwiping,
    closeSwipeAction,
    swipeHandlers,
    onForegroundClickCapture,
  } = useSwipeToDelete()

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
        {...swipeHandlers}
        onClickCapture={onForegroundClickCapture}
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
        {item.pendingSync && (
          <Box
            as="span"
            title="Čaká na odoslanie"
            aria-label="Čaká na odoslanie"
            color="fg.subtle"
            flexShrink="0"
            display="flex"
            m="0 4px"
          >
            <Clock size={15} />
          </Box>
        )}
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
