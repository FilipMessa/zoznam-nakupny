import { Box, Button, Input, Text, chakra } from '@chakra-ui/react'
import { X } from 'lucide-react'
import { useListNameField } from '@/features/lists/useListNameField'
import type { CreateListError } from '@/features/lists/types'

export interface CreateListFormProps {
  onSubmit: (name: string) => void
  onCancel: () => void
  pending: boolean
  error: CreateListError | null
}

export function CreateListForm({
  onSubmit,
  onCancel,
  pending,
  error,
}: CreateListFormProps) {
  const { name, handleNameChange, submitDisabled, handleSubmit } =
    useListNameField({ pending, onSubmit })

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-list-dialog-title"
      pos="absolute"
      inset="0"
      zIndex="60"
      display="flex"
      alignItems="center"
      justifyContent="center"
      padding="24px"
      bg="rgba(28, 21, 16, 0.45)"
      backdropFilter="blur(2px)"
      onClick={onCancel}
      data-testid="create-list-backdrop"
    >
      <chakra.form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
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
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap="12px"
        >
          <Text
            id="create-list-dialog-title"
            fontWeight="800"
            fontSize="17px"
            color="fg"
            m="0"
          >
            Nový zoznam
          </Text>
          <Button
            type="button"
            onClick={onCancel}
            aria-label="Zatvoriť"
            minW="34px"
            minH="34px"
            padding="0"
            bg="bg.muted"
            color="fg.muted"
            borderRadius="10px"
          >
            <X size={16} />
          </Button>
        </Box>
        <chakra.label
          htmlFor="create-list-name-input"
          display="block"
          fontWeight="800"
          fontSize="12px"
          color="fg.muted"
          letterSpacing="0.08em"
          textTransform="uppercase"
          mb="-4px"
        >
          Názov zoznamu
        </chakra.label>
        <Input
          id="create-list-name-input"
          type="text"
          value={name}
          placeholder="Napr. Týždenný nákup"
          disabled={pending}
          onChange={handleNameChange}
          h="50px"
          fontSize="16px"
          fontWeight="600"
          bg="bg.panel"
          border="2px solid"
          borderColor="border"
          borderRadius="12px"
          color="fg"
          _focus={{ borderColor: 'terracotta.solid', outline: 'none' }}
        />
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
        <Button
          type="submit"
          disabled={submitDisabled}
          w="full"
          minH="54px"
          fontWeight="800"
          fontSize="17px"
          color="white"
          bg="terracotta.solid"
          borderRadius="14px"
          boxShadow="accent"
          _hover={{ bg: 'terracotta.emphasized' }}
          _disabled={{ opacity: 0.55, boxShadow: 'none' }}
        >
          Vytvoriť
        </Button>
      </chakra.form>
    </Box>
  )
}
