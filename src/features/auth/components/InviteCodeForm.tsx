import { Box, Button, Input, chakra } from '@chakra-ui/react'
import { useInviteCodeField } from '@/features/auth/useInviteCodeField'
import type { RedeemError } from '@/features/auth/types'

export interface InviteCodeFormProps {
  onSubmit: (code: string) => void
  pending: boolean
  error: RedeemError | null
}

export function InviteCodeForm({
  onSubmit,
  pending,
  error,
}: InviteCodeFormProps) {
  const { code, handleCodeChange, submitDisabled, handleSubmit } =
    useInviteCodeField({ pending, onSubmit })

  return (
    <chakra.form
      display="flex"
      flexDirection="column"
      flex="1 1 auto"
      onSubmit={handleSubmit}
    >
      <chakra.label
        htmlFor="invite-code-input"
        display="block"
        fontWeight="800"
        fontSize="12px"
        color="fg.muted"
        letterSpacing="0.08em"
        textTransform="uppercase"
        mb="8px"
      >
        Pozývací kód
      </chakra.label>
      <Input
        id="invite-code-input"
        type="text"
        value={code}
        placeholder="RODINA-2024"
        autoCapitalize="characters"
        disabled={pending}
        onChange={handleCodeChange}
        h="54px"
        fontSize="20px"
        fontWeight="800"
        letterSpacing="0.12em"
        textTransform="uppercase"
        bg="bg.panel"
        border="2px solid"
        borderColor="border"
        borderRadius="12px"
        color="fg"
        _focus={{ borderColor: 'terracotta.solid', outline: 'none' }}
      />
      {error === 'invalid-code' && (
        <Box
          as="p"
          role="alert"
          mt="10px"
          padding="10px 14px"
          bg="red.subtle"
          border="1px solid rgba(184, 48, 48, 0.15)"
          borderRadius="10px"
          fontSize="14px"
          fontWeight="700"
          color="red.solid"
        >
          Neplatný pozývací kód
        </Box>
      )}
      {error === 'unknown' && (
        <Box
          as="p"
          role="alert"
          mt="10px"
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
        mt="auto"
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
        Pripojiť sa
      </Button>
    </chakra.form>
  )
}
