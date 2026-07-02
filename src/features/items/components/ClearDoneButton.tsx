import { Button } from '@chakra-ui/react'

export interface ClearDoneButtonProps {
  doneCount: number
  onClear: () => void
}

export function ClearDoneButton({ doneCount, onClear }: ClearDoneButtonProps) {
  return (
    <Button
      type="button"
      disabled={doneCount === 0}
      onClick={onClear}
      variant="ghost"
      fontSize="13px"
      fontWeight="700"
      color="red.solid"
      padding="4px 0"
      h="auto"
      minW="0"
      _disabled={{ color: 'fg.subtle' }}
    >
      Vymazať hotové
    </Button>
  )
}
