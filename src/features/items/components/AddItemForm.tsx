import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Box, IconButton, Input, VisuallyHidden, chakra } from '@chakra-ui/react'
import { Plus } from 'lucide-react'

export interface AddItemFormProps {
  onSubmit: (text: string) => void
  pending: boolean
  error: string | null
}

export function AddItemForm({ onSubmit, pending, error }: AddItemFormProps) {
  const [text, setText] = useState('')
  const wasPending = useRef(pending)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (wasPending.current && !pending && !error) {
      setText('')
    }
    wasPending.current = pending
  }, [pending, error])

  const trimmedText = text.trim()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) {
      return
    }
    if (trimmedText.length === 0) {
      inputRef.current?.focus()
      return
    }
    onSubmit(trimmedText)
  }

  return (
    <chakra.form
      onSubmit={handleSubmit}
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
        disabled={pending}
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
        disabled={pending}
        w="50px"
        h="50px"
        minW="50px"
        borderRadius="12px"
        flexShrink="0"
        color="white"
        bg="terracotta.solid"
        boxShadow="accent"
        _hover={{ bg: 'terracotta.emphasized' }}
        _disabled={{ bg: 'bg.muted', color: 'fg.subtle', boxShadow: 'none' }}
      >
        <Plus size={22} />
      </IconButton>
      {error && (
        <Box
          as="p"
          role="alert"
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
