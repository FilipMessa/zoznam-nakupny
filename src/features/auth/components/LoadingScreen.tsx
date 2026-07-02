import { Flex } from '@chakra-ui/react'

export function LoadingScreen() {
  return (
    <Flex
      role="status"
      aria-live="polite"
      flex="1 1 auto"
      minH="100dvh"
      align="center"
      justify="center"
      bg="bg"
      color="fg.muted"
      fontWeight="bold"
    >
      Načítava sa…
    </Flex>
  )
}
