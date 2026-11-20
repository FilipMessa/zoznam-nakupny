import type { ShoppingItem } from './types'
import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type RefObject,
} from 'react'

export interface UseAddItemFormResult {
  text: string
  handleTextChange: (event: ChangeEvent<HTMLInputElement>) => void
  inputRef: RefObject<HTMLInputElement | null>
  submitItem: (item: string | ShoppingItem) => void
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
}

// Rapid-entry submit gate: a non-empty trimmed value clears the field and
// submits; an empty submit just refocuses the input so the keyboard stays up.
export function useAddItemForm(
  onSubmit: (item: string | ShoppingItem) => void,
): UseAddItemFormResult {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value)
  }

  const submitItem = (item: string | ShoppingItem) => {
    const value = typeof item === 'string' ? item.trim() : item
    if (value === '') {
      inputRef.current?.focus()
      return
    }
    setText('')
    inputRef.current?.focus()
    onSubmit(value)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitItem(text)
  }

  return { submitItem, text, handleTextChange, inputRef, handleSubmit }
}
