import { Flex, Heading, Text } from '@chakra-ui/react'
import { Users } from 'lucide-react'
import { InviteCodeForm } from './InviteCodeForm'
import { useRedeemInviteCode } from '../useRedeemInviteCode'

export interface InviteCodeScreenProps {
  markAsMember: () => void
}

export function InviteCodeScreen({ markAsMember }: InviteCodeScreenProps) {
  const { pending, error, handleSubmit } = useRedeemInviteCode(markAsMember)

  return (
    <Flex direction="column" flex="1 1 auto" minH="100dvh" padding="56px 28px 32px" bg="bg">
      <Flex
        aria-hidden="true"
        align="center"
        justify="center"
        w="48px"
        h="48px"
        borderRadius="14px"
        bg="terracotta.subtle"
        color="terracotta.solid"
        mb="16px"
      >
        <Users size={22} />
      </Flex>
      <Heading as="h1" fontSize="28px" fontWeight="900" color="fg" letterSpacing="-0.6px" lineHeight="1.15" m="0 0 10px">
        Pripojte sa k rodine
      </Heading>
      <Text fontSize="15px" color="fg.muted" lineHeight="1.6" m="0 0 32px">
        Zadajte pozývací kód, ktorý ste dostali od ostatných členov domácnosti.
      </Text>
      <InviteCodeForm onSubmit={handleSubmit} pending={pending} error={error} />
    </Flex>
  )
}
