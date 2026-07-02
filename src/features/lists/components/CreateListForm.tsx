import { useState, type FormEvent } from 'react'
import { Box, Button, Input, Text, chakra } from '@chakra-ui/react'

export interface CreateListFormProps {
  onSubmit: (name: string) => void
  pending: boolean
  error: string | null
}

export function CreateListForm({ onSubmit, pending, error }: CreateListFormProps) {
  const [name, setName] = useState('')

  const trimmedName = name.trim()
  const submitDisabled = pending || trimmedName.length === 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitDisabled) {
      return
    }
    onSubmit(trimmedName)
  }

  return (
    <Box
      pos="absolute"
      inset="0"
      zIndex="60"
      display="flex"
      alignItems="center"
      justifyContent="center"
      padding="24px"
      bg="rgba(28, 21, 16, 0.45)"
      backdropFilter="blur(2px)"
    >
      <chakra.form
        onSubmit={handleSubmit}
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
          Nový zoznam
        </Text>
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
          onChange={(event) => setName(event.target.value)}
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
