import { useRef, useState, type FormEvent } from 'react'
import { Box, IconButton, Input, VisuallyHidden, chakra } from '@chakra-ui/react'
import { Plus } from 'lucide-react'

export interface AddItemFormProps {
  onSubmit: (text: string) => void
  error: string | null
}

export function AddItemForm({ onSubmit, error }: AddItemFormProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const trimmedText = text.trim()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (trimmedText.length === 0) {
      inputRef.current?.focus()
      return
    }
    setText('')
    onSubmit(trimmedText)
  }

  return (
    <chakra.form
      onSubmit={handleSubmit}
      position="relative"
      display="flex"
      alignItems="center"
      gap="10px"
      padding="10px 12px 14px"
    >
      <VisuallyHidden asChild>
        <chakra.label htmlFor="add-item-text-input">Položka</chakra.label>
      </VisuallyHidden>
      <Input
        ref={inputRef}
        id="add-item-text-input"
        type="text"
        value={text}
        placeholder="Pridať položku…"
        enterKeyHint="send"
        onChange={(event) => setText(event.target.value)}
        flex="1 1 auto"
        minW="0"
        h="50px"
        fontSize="16px"
        fontWeight="600"
        bg="bg.muted"
        border="2px solid transparent"
        borderRadius="12px"
        color="fg"
        _focus={{ borderColor: 'terracotta.solid', bg: 'bg.panel', outline: 'none' }}
      />
      <IconButton
        type="submit"
        className="icon-btn"
        aria-label="Pridať"
        onPointerDown={(event) => event.preventDefault()}
        w="50px"
        h="50px"
        minW="50px"
        borderRadius="12px"
        flexShrink="0"
        color="white"
        bg="terracotta.solid"
        boxShadow="accent"
        _hover={{ bg: 'terracotta.emphasized' }}
      >
        <Plus size={22} />
      </IconButton>
      {error && (
        <Box
          as="p"
          role="alert"
          position="absolute"
          bottom="calc(100% + 8px)"
          left="12px"
          right="12px"
          padding="10px 14px"
          bg="red.subtle"
          border="1px solid rgba(184, 48, 48, 0.15)"
          borderRadius="10px"
          fontSize="14px"
          fontWeight="700"
          color="red.solid"
        >
          Niečo sa pokazilo. Skúste to znova.
        </Box>
      )}
    </chakra.form>
  )
}
