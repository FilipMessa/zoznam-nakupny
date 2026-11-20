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
  submitText: (value: string) => void
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
}

// Rapid-entry submit gate: a non-empty trimmed value clears the field and
// submits; an empty submit just refocuses the input so the keyboard stays up.
export function useAddItemForm(
  onSubmit: (text: string) => void,
): UseAddItemFormResult {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value)
  }

  const submitText = (value: string) => {
    const trimmedText = value.trim()
    if (trimmedText.length === 0) {
      inputRef.current?.focus()
      return
    }
    setText('')
    inputRef.current?.focus()
    onSubmit(trimmedText)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitText(text)
  }

  return { submitText, text, handleTextChange, inputRef, handleSubmit }
}
