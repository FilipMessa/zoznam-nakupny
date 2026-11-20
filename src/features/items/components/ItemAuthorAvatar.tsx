import { Box } from '@chakra-ui/react'

export function ItemAuthorAvatar({ name }: { name?: string }) {
  const author = name?.trim()
  if (!author) {
    return null
  }

  const [initial] = Array.from(author.normalize('NFC'))
  return (
    <Box
      as="span"
      role="img"
      aria-label={`Autor položky: ${author}`}
      flexShrink={0}
      ms="6px"
      display="grid"
      placeItems="center"
      boxSize="26px"
      rounded="full"
      bg="bg.muted"
      color="fg.muted"
      fontSize="13px"
      fontWeight="700"
    >
      {initial.toLocaleUpperCase('sk')}
    </Box>
  )
}
