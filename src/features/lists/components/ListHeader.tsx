import { Box, Flex, IconButton } from '@chakra-ui/react'
import { ChevronDown, LogOut, Pencil, Trash2 } from 'lucide-react'
import { signOutUser } from '../../auth/googleAuth'

export interface ListHeaderProps {
  listName: string
  onOpenSwitcher: () => void
  onRenameClick: () => void
  onDeleteClick: () => void
}

export function ListHeader({
  listName,
  onOpenSwitcher,
  onRenameClick,
  onDeleteClick,
}: ListHeaderProps) {
  return (
    <Flex
      as="header"
      flex="0 0 auto"
      alignItems="center"
      gap="4px"
      padding="14px 8px 12px 16px"
      borderBottom="1px solid"
      borderColor="border"
      bg="bg"
    >
      <IconButton
        type="button"
        className="icon-btn"
        aria-label="Prepnúť zoznam"
        onClick={onOpenSwitcher}
        variant="ghost"
        display="flex"
        alignItems="center"
        gap="6px"
        flex="1 1 auto"
        minW="0"
        justifyContent="flex-start"
        padding="4px 0"
        minH="touchTarget"
        _hover={{ bg: 'transparent', color: 'fg' }}
      >
        <Box
          as="span"
          fontWeight="900"
          fontSize="20px"
          color="fg"
          letterSpacing="-0.5px"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {listName}
        </Box>
        <Box as="span" color="fg.subtle" flexShrink="0" display="flex">
          <ChevronDown size={18} />
        </Box>
      </IconButton>
      <Box
        as="span"
        title="Živé spojenie"
        aria-hidden="true"
        w="8px"
        h="8px"
        borderRadius="50%"
        bg="#4ade80"
        flexShrink="0"
        m="0 4px"
        animation="livePulse 2s ease-in-out infinite"
      />
      <IconButton
        type="button"
        className="icon-btn"
        aria-label="Premenovať"
        onClick={onRenameClick}
        variant="ghost"
        minW="touchTarget"
        minH="touchTarget"
        color="fg.muted"
        _hover={{ bg: 'bg.muted', color: 'fg' }}
      >
        <Pencil size={18} />
      </IconButton>
      <IconButton
        type="button"
        className="icon-btn"
        aria-label="Zmazať zoznam"
        onClick={onDeleteClick}
        variant="ghost"
        minW="touchTarget"
        minH="touchTarget"
        color="fg.muted"
        _hover={{ bg: 'bg.muted', color: 'fg' }}
      >
        <Trash2 size={18} />
      </IconButton>
      <IconButton
        type="button"
        className="icon-btn"
        aria-label="Odhlásiť sa"
        onClick={() => void signOutUser()}
        variant="ghost"
        minW="touchTarget"
        minH="touchTarget"
        color="fg.muted"
        _hover={{ bg: 'bg.muted', color: 'fg' }}
      >
        <LogOut size={18} />
      </IconButton>
    </Flex>
  )
}
