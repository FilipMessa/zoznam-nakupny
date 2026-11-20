import type { PurchaseMemoryEntry } from './types'
import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type RefObject,
} from 'react'

export interface UseAddItemFormResult {
  text: string
  suggestions: PurchaseMemoryEntry[]
  handleTextChange: (event: ChangeEvent<HTMLInputElement>) => void
  inputRef: RefObject<HTMLInputElement | null>
  submitItem: (item: string | PurchaseMemoryEntry) => void
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
}

// Rapid-entry submit gate: a non-empty trimmed value clears the field and
// submits; an empty submit just refocuses the input so the keyboard stays up.
// `suggest` (usePurchaseSuggestions) turns the typed text into suggestions.
export function useAddItemForm(
  onSubmit: (item: string | PurchaseMemoryEntry) => void,
  suggest: (text: string) => PurchaseMemoryEntry[],
): UseAddItemFormResult {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value)
  }

  const submitItem = (item: string | PurchaseMemoryEntry) => {
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

  return {
    submitItem,
    text,
    suggestions: suggest(text),
    handleTextChange,
    inputRef,
    handleSubmit,
  }
}
