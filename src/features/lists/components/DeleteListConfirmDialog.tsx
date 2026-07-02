import { Button, Dialog, Text } from '@chakra-ui/react'

export interface DeleteListConfirmDialogProps {
  open: boolean
  listName: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteListConfirmDialog({
  open,
  listName,
  onConfirm,
  onCancel,
}: DeleteListConfirmDialogProps) {
  if (!open) {
    return null
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) {
          onCancel()
        }
      }}
    >
      <Dialog.Backdrop
        onClick={onCancel}
        pos="absolute"
        inset="0"
        w="100%"
        h="100%"
        zIndex="60"
        bg="rgba(28, 21, 16, 0.45)"
        backdropFilter="blur(2px)"
      />
      <Dialog.Positioner
        pos="absolute"
        inset="0"
        w="100%"
        h="100%"
        zIndex="60"
        display="flex"
        alignItems="center"
        justifyContent="center"
        padding="24px"
      >
        <Dialog.Content
          aria-label="Zmazať zoznam"
          w="full"
          maxW="340px"
          display="flex"
          flexDirection="column"
          gap="12px"
          bg="bg.panel"
          borderRadius="18px"
          padding="20px"
          boxShadow="md"
        >
          <Text fontWeight="800" fontSize="17px" color="fg" m="0">
            Zmazať „{listName}"?
          </Text>
          <Text fontSize="14px" color="fg.muted" lineHeight="1.5" m="0">
            Zmaže sa zoznam a všetky jeho položky. Nedá sa vrátiť späť.
          </Text>
          <Dialog.Footer display="flex" gap="8px" padding="0">
            <Button
              type="button"
              onClick={onCancel}
              flex="1 1 0"
              minH="46px"
              borderRadius="10px"
              fontWeight="800"
              fontSize="14px"
              bg="bg.muted"
              color="fg"
            >
              Zrušiť
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              flex="1 1 0"
              minH="46px"
              borderRadius="10px"
              fontWeight="800"
              fontSize="14px"
              bg="red.solid"
              color="white"
            >
              Zmazať
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
