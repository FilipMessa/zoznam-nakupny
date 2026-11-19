import { Button, Flex, Heading, Text } from '@chakra-ui/react'
import { Plus, ShoppingBag } from 'lucide-react'

export interface EmptyListsStateProps {
  onCreateClick: () => void
}

export function EmptyListsState({ onCreateClick }: EmptyListsStateProps) {
  return (
    <Flex
      direction="column"
      flex="1 1 auto"
      minH="100dvh"
      align="center"
      justify="center"
      textAlign="center"
      padding="32px"
      bg="bg"
    >
      <Flex
        aria-hidden="true"
        align="center"
        justify="center"
        w="110px"
        h="110px"
        borderRadius="28px"
        bg="bg.muted"
        color="fg.muted"
        mb="28px"
      >
        <ShoppingBag size={46} strokeWidth={1.5} />
      </Flex>
      <Heading
        as="h2"
        fontSize="24px"
        fontWeight="900"
        color="fg"
        letterSpacing="-0.4px"
        m="0 0 12px"
      >
        Zatiaľ žiadne zoznamy
      </Heading>
      <Text
        fontSize="16px"
        color="fg.muted"
        lineHeight="1.6"
        m="0 0 44px"
        maxW="260px"
      >
        Vytvorte si svoj prvý zoznam a začnite nakupovať.
      </Text>
      <Button
        type="button"
        onClick={onCreateClick}
        w="auto"
        minH="54px"
        px="24px"
        gap="10px"
        fontWeight="800"
        fontSize="17px"
        color="white"
        bg="terracotta.solid"
        borderRadius="14px"
        boxShadow="accent"
        _hover={{ bg: 'terracotta.emphasized' }}
      >
        <Plus size={20} />
        Vytvoriť zoznam
      </Button>
    </Flex>
  )
}
