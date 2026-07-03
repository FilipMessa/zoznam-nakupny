import { Box, Flex, Heading, IconButton } from '@chakra-ui/react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { ArrowLeft } from 'lucide-react'
import { useShoppingListDndSensors } from '../../items/dndSensors'
import { useAllListsScreen } from '../useAllListsScreen'
import { AllListsSection } from './AllListsSection'
import type { ShoppingList } from '../types'

export interface AllListsScreenProps {
  lists: ShoppingList[]
  onClose: () => void
}

export function AllListsScreen({ lists, onClose }: AllListsScreenProps) {
  const { isExpanded, toggleSection, registerActiveItems, handleDragEnd } =
    useAllListsScreen()
  const sensors = useShoppingListDndSensors()

  return (
    <Flex direction="column" h="100dvh" minH="0" bg="bg">
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
          aria-label="Späť"
          onClick={onClose}
          variant="ghost"
          minW="touchTarget"
          minH="touchTarget"
          color="fg.muted"
          _hover={{ bg: 'bg.muted', color: 'fg' }}
        >
          <ArrowLeft size={20} />
        </IconButton>
        <Heading
          as="h1"
          fontWeight="900"
          fontSize="20px"
          color="fg"
          letterSpacing="-0.5px"
        >
          Všetky zoznamy
        </Heading>
      </Flex>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Box as="main" flex="1 1 auto" minH="0" overflowY="auto">
          {lists.map((list) => (
            <AllListsSection
              key={list.id}
              list={list}
              expanded={isExpanded(list.id)}
              onToggle={() => toggleSection(list.id)}
              onActiveItemsChange={registerActiveItems}
            />
          ))}
        </Box>
      </DndContext>
    </Flex>
  )
}
