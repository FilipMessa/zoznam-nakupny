import { Box, Button, Input, Text, chakra } from '@chakra-ui/react'
import { useListNameField } from '@/features/lists/useListNameField'

export interface RenameListFormProps {
  initialName: string
  onSubmit: (name: string) => void
  pending: boolean
  error: string | null
}

export function RenameListForm({
  initialName,
  onSubmit,
  pending,
  error,
}: RenameListFormProps) {
  const { name, handleNameChange, submitDisabled, handleSubmit } =
    useListNameField({ initialName, pending, onSubmit })

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
          Premenovať zoznam
        </Text>
        <chakra.label
          htmlFor="rename-list-name-input"
          display="block"
          fontWeight="800"
          fontSize="12px"
          color="fg.muted"
          letterSpacing="0.08em"
          textTransform="uppercase"
          mb="-4px"
        >
          List name
        </chakra.label>
        <Input
          id="rename-list-name-input"
          type="text"
          value={name}
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
            Something went wrong. Please try again.
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
          Save
        </Button>
      </chakra.form>
    </Box>
  )
}
