import { Box, Flex, IconButton, Menu, Portal } from '@chakra-ui/react'
import {
  ChevronDown,
  Clock,
  Ellipsis,
  LayoutList,
  LogOut,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useOnlineStatus } from '@/lib/useOnlineStatus'

export interface ListHeaderProps {
  listName: string
  pendingSync?: boolean
  onOpenSwitcher: () => void
  onOpenAllLists: () => void
  onRenameClick: () => void
  onDeleteClick: () => void
  onSignOut: () => void
}

export function ListHeader({
  listName,
  pendingSync,
  onOpenSwitcher,
  onOpenAllLists,
  onRenameClick,
  onDeleteClick,
  onSignOut,
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
        {/* Always rendered, space always reserved -- see ActiveItemRow for
            why this can't be a conditional mount. */}
        <Box
          as="span"
          title={pendingSync ? 'Zoznam čaká na odoslanie' : undefined}
          aria-label={pendingSync ? 'Zoznam čaká na odoslanie' : undefined}
          aria-hidden={pendingSync ? undefined : true}
          visibility={pendingSync ? 'visible' : 'hidden'}
          color="fg.subtle"
          flexShrink="0"
          display="flex"
        >
          <Clock size={15} />
        </Box>
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
        aria-label="Všetky zoznamy"
        onClick={onOpenAllLists}
        variant="ghost"
        minW="touchTarget"
        minH="touchTarget"
        color="fg.muted"
        _hover={{ bg: 'bg.muted', color: 'fg' }}
      >
        <LayoutList size={18} />
      </IconButton>
      <Menu.Root positioning={{ placement: 'bottom-end' }}>
        <Menu.Trigger asChild>
          <IconButton
            type="button"
            className="icon-btn"
            aria-label="Ďalšie možnosti"
            variant="ghost"
            minW="touchTarget"
            minH="touchTarget"
            color="fg.muted"
            _hover={{ bg: 'bg.muted', color: 'fg' }}
          >
            <Ellipsis size={18} />
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner zIndex="60">
            <Menu.Content
              minW="200px"
              bg="bg.panel"
              color="fg"
              border="1px solid"
              borderColor="border"
              borderRadius="14px"
              boxShadow="0 6px 24px rgba(28, 21, 16, 0.14)"
              padding="4px"
            >
              <Menu.Item
                value="rename"
                minH="touchTarget"
                gap="10px"
                padding="0 12px"
                borderRadius="10px"
                color="fg"
                onSelect={onRenameClick}
              >
                <Pencil size={18} />
                Premenovať
              </Menu.Item>
              <Menu.Item
                value="sign-out"
                minH="touchTarget"
                gap="10px"
                padding="0 12px"
                borderRadius="10px"
                color="fg"
                onSelect={onSignOut}
              >
                <LogOut size={18} />
                Odhlásiť sa
              </Menu.Item>
              <Menu.Separator borderColor="border" />
              <Menu.Item
                value="delete"
                minH="touchTarget"
                gap="10px"
                padding="0 12px"
                borderRadius="10px"
                color="red.solid"
                _hover={{ bg: 'bg.muted' }}
                onSelect={onDeleteClick}
              >
                <Trash2 size={18} />
                Zmazať zoznam
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </Flex>
  )
}
