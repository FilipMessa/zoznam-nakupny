import {
  Toaster as ChakraToaster,
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastActionTrigger,
  ToastCloseTrigger,
  Portal,
} from '@chakra-ui/react'
import { toaster } from '@/lib/toaster'

export function Toaster() {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: '4' }}>
        {(toast) => (
          <ToastRoot>
            {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
            {toast.description && (
              <ToastDescription>{toast.description}</ToastDescription>
            )}
            {toast.action && (
              <ToastActionTrigger>{toast.action.label}</ToastActionTrigger>
            )}
            <ToastCloseTrigger />
          </ToastRoot>
        )}
      </ChakraToaster>
    </Portal>
  )
}
