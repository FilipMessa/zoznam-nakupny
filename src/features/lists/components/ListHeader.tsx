import { Box, Flex, IconButton } from '@chakra-ui/react'
import { ChevronDown, Clock, LogOut, Pencil, Trash2 } from 'lucide-react'
import { signOutUser } from '../../auth/googleAuth'
import { useOnlineStatus } from '../../../lib/useOnlineStatus'

export interface ListHeaderProps {
  listName: string
  pendingSync?: boolean
  onOpenSwitcher: () => void
  onRenameClick: () => void
  onDeleteClick: () => void
}

export function ListHeader({
  listName,
  pendingSync,
  onOpenSwitcher,
  onRenameClick,
  onDeleteClick,
}: ListHeaderProps) {
  const isOnline = useOnlineStatus()

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
        {pendingSync && (
          <Box
            as="span"
            title="Zoznam čaká na odoslanie"
            aria-label="Zoznam čaká na odoslanie"
            color="fg.subtle"
            flexShrink="0"
            display="flex"
          >
            <Clock size={15} />
          </Box>
        )}
        <Box as="span" color="fg.subtle" flexShrink="0" display="flex">
          <ChevronDown size={18} />
        </Box>
      </IconButton>
      <Box
        as="span"
        title={isOnline ? 'Živé spojenie' : 'Offline'}
        aria-hidden="true"
        w="8px"
        h="8px"
        borderRadius="50%"
        bg={isOnline ? '#4ade80' : 'border'}
        flexShrink="0"
        m="0 4px"
        animation={isOnline ? 'livePulse 2s ease-in-out infinite' : 'none'}
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
