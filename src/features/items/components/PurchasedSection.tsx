import { useId, useState, type ReactNode } from 'react'
import { Box, Flex, Heading, chakra } from '@chakra-ui/react'
import { ChevronDown } from 'lucide-react'
import { ClearDoneButton } from './ClearDoneButton'

export function PurchasedSection({
  count,
  onClear,
  children,
}: {
  count: number
  onClear: () => void
  children: ReactNode
}) {
  const [expanded, setExpanded] = useState(true)
  const panelId = useId()

  return (
    <Box as="section" borderTop="1px solid" borderColor="border">
      <Heading as="h2" m="0">
        <chakra.button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded(!expanded)}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="full"
          minH="touchTarget"
          px="16px"
          cursor="pointer"
          color="fg.muted"
          fontSize="11px"
          fontWeight="800"
          letterSpacing="0.1em"
          textTransform="uppercase"
          focusVisibleRing="inside"
        >
          <span>Kúpené · {count}</span>
          <Box
            as="span"
            display="flex"
            transform={expanded ? 'rotate(0deg)' : 'rotate(-90deg)'}
            _motionSafe={{ transition: 'transform 140ms ease' }}
          >
            <ChevronDown size={16} aria-hidden="true" />
          </Box>
        </chakra.button>
      </Heading>
      <Box id={panelId} hidden={!expanded}>
        {expanded && (
          <>
            {children}
            {count > 0 && (
              <Flex justify="flex-end" px="16px" pb="8px">
                <ClearDoneButton doneCount={count} onClear={onClear} />
              </Flex>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
