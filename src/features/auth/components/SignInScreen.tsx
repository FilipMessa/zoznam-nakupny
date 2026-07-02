import { useState } from 'react'
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react'
import { signInWithGoogle } from '../googleAuth'

const NON_FATAL_ERROR_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/popup-blocked',
])

export function SignInScreen() {
  const [retryMessage, setRetryMessage] = useState<string | null>(null)

  const handleSignIn = async () => {
    setRetryMessage(null)
    try {
      await signInWithGoogle()
    } catch (error) {
      const code = (error as { code?: string } | undefined)?.code
      if (code && NON_FATAL_ERROR_CODES.has(code)) {
        setRetryMessage('Prihlásenie bolo prerušené. Skúste to znova.')
      } else {
        console.error('Sign-in failed', error)
      }
    }
  }

  return (
    <Flex
      direction="column"
      flex="1 1 auto"
      minH="100dvh"
      align="center"
      justify="center"
      textAlign="center"
      padding="32px"
      bg="linear-gradient(160deg, #fff8f2 0%, #fdfaf6 60%)"
    >
      <Flex
        aria-hidden="true"
        align="center"
        justify="center"
        w="80px"
        h="80px"
        borderRadius="22px"
        bg="terracotta.solid"
        color="white"
        boxShadow="0 6px 24px rgba(200, 98, 43, 0.4)"
        mb="24px"
      >
        <svg
          viewBox="0 0 24 24"
          width={42}
          height={42}
          fill="none"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </Flex>
      <Heading as="h1" fontSize="30px" fontWeight="900" color="fg" letterSpacing="-0.8px" m="0 0 8px">
        Zoznam nákupný
      </Heading>
      <Text fontSize="16px" color="fg.muted" lineHeight="1.5" m="0 0 56px" maxW="240px">
        Spoločný nákupný zoznam pre celú rodinu.
      </Text>
      <Button
        type="button"
        onClick={handleSignIn}
        w="full"
        h="auto"
        py="15px"
        px="24px"
        gap="12px"
        fontWeight="700"
        fontSize="17px"
        color="fg"
        bg="bg.panel"
        border="1.5px solid"
        borderColor="border"
        borderRadius="14px"
        boxShadow="sm"
        _hover={{ boxShadow: 'md' }}
      >
        <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Prihlásiť sa cez Google
      </Button>
      {retryMessage && (
        <Box
          as="p"
          role="alert"
          mt="20px"
          display="flex"
          alignItems="center"
          gap="8px"
          padding="10px 14px"
          bg="red.subtle"
          border="1px solid rgba(184, 48, 48, 0.15)"
          borderRadius="10px"
          fontSize="14px"
          fontWeight="700"
          color="red.solid"
        >
          {retryMessage}
        </Box>
      )}
    </Flex>
  )
}
