import type { FormEvent, KeyboardEvent, RefObject } from 'react'
import { Input, chakra } from '@chakra-ui/react'

export interface ActiveItemEditFormProps {
  itemId: string
  text: string
  // Wiring from useItemEditForm (owned by the row so its cancel/blur state
  // survives across edit sessions exactly as before).
  inputRef: RefObject<HTMLInputElement | null>
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onBlur: () => void
}

// Inline edit form that replaces the row's foreground while editing.
export function ActiveItemEditForm({
  itemId,
  text,
  inputRef,
  onSubmit,
  onKeyDown,
  onBlur,
}: ActiveItemEditFormProps) {
  return (
    <chakra.form
      onSubmit={onSubmit}
      data-testid={`active-item-content-${itemId}`}
      display="flex"
      alignItems="center"
      w="full"
      minH="56px"
      padding="0 8px 0 16px"
      bg="bg"
      pos="relative"
      zIndex="1"
    >
      <Input
        ref={inputRef}
        defaultValue={text}
        autoFocus
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
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
  )
}
