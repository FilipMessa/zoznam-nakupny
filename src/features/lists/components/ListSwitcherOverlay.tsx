import { Box, Button, Drawer } from '@chakra-ui/react'
import { Plus, X } from 'lucide-react'
import type { ShoppingList } from '../types'
import { ListSwitcherItem } from './ListSwitcherItem'

export interface ListSwitcherOverlayProps {
  open: boolean
  lists: ShoppingList[]
  selectedListId: string | null
  onSelect: (listId: string) => void
  onClose: () => void
  onCreate: () => void
}

export function ListSwitcherOverlay({
  open,
  lists,
  selectedListId,
  onSelect,
  onClose,
  onCreate,
}: ListSwitcherOverlayProps) {
  if (!open) {
    return null
  }

  return (
    <Drawer.Root
      open={open}
      placement="bottom"
      onOpenChange={(details) => {
        if (!details.open) {
          onClose()
        }
      }}
    >
      <Drawer.Backdrop
        data-testid="list-switcher-backdrop"
        onClick={onClose}
        pos="absolute"
        inset="0"
        w="100%"
        h="100%"
        zIndex="50"
        bg="rgba(28, 21, 16, 0.45)"
        backdropFilter="blur(2px)"
      />
      <Drawer.Positioner
        pos="absolute"
        inset="0"
        w="100%"
        h="100%"
        zIndex="50"
        display="flex"
        alignItems="flex-end"
      >
        <Drawer.Content
          aria-label="Prepnúť zoznam"
          w="full"
          maxH="78dvh"
          display="flex"
          flexDirection="column"
          bg="bg.panel"
          borderTopRadius="22px"
          boxShadow="0 -6px 32px rgba(28, 21, 16, 0.14)"
          overflow="hidden"
        >
          <Box
            pos="relative"
            display="flex"
            alignItems="center"
            justifyContent="center"
            padding="18px 16px 10px"
            borderBottom="1px solid"
            borderColor="border"
          >
            <Box
              aria-hidden="true"
              pos="absolute"
              top="8px"
              left="50%"
              transform="translateX(-50%)"
              w="32px"
              h="4px"
              borderRadius="2px"
              bg="border"
            />
            <Box fontWeight="800" fontSize="16px" color="fg">
              Moje zoznamy
            </Box>
            <Button
              type="button"
              onClick={onClose}
              aria-label="Zatvoriť"
              pos="absolute"
              right="12px"
              top="14px"
              minW="30px"
              minH="30px"
              bg="bg.muted"
              color="fg.muted"
            >
              <X size={16} />
            </Button>
          </Box>
          <Box as="ul" overflowY="auto" flex="1 1 auto" padding="8px 0" listStyle="none" m="0">
            {lists.map((list) => (
              <ListSwitcherItem
                key={list.id}
                list={list}
                selected={list.id === selectedListId}
                onSelect={(listId) => {
                  onSelect(listId)
                  onClose()
                }}
              />
            ))}
          </Box>
          <Button
            type="button"
            onClick={onCreate}
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap="8px"
            w="calc(100% - 24px)"
            m="8px 12px 20px"
            padding="13px"
            fontWeight="700"
            fontSize="15px"
            color="terracotta.solid"
            bg="terracotta.subtle"
            border="1.5px dashed rgba(200, 98, 43, 0.35)"
            borderRadius="12px"
          >
            <Plus size={18} />
            Vytvoriť nový zoznam
          </Button>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  )
}
