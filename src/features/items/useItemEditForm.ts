import {
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react'

export interface UseItemEditFormParams {
  itemId: string
  onSubmitEdit: (id: string, text: string) => void
  onCancelEdit: () => void
}

export interface UseItemEditFormResult {
  inputRef: RefObject<HTMLInputElement | null>
  handleEditKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  handleEditBlur: () => void
  handleEditSubmit: (event: FormEvent<HTMLFormElement>) => void
}

// Inline edit form behavior for a row: submit a trimmed non-empty value,
// treat an emptied field as cancel, and let Escape cancel without the
// subsequent blur re-submitting the old value.
export function useItemEditForm({
  itemId,
  onSubmitEdit,
  onCancelEdit,
}: UseItemEditFormParams): UseItemEditFormResult {
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelledRef = useRef(false)

  const trySubmitEdit = () => {
    const value = inputRef.current?.value ?? ''
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      onCancelEdit()
      return
    }
    onSubmitEdit(itemId, trimmed)
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

  return { inputRef, handleEditKeyDown, handleEditBlur, handleEditSubmit }
}
