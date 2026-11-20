import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { Provider } from '@/components/ui/provider'
import { Toaster } from '@/components/ui/toaster'
import { ServiceWorkerUpdatePrompt } from '@/components/ServiceWorkerUpdatePrompt'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider>
      <AuthProvider>
        <App />
      </AuthProvider>
      <Toaster />
      <ServiceWorkerUpdatePrompt />
    </Provider>
  </StrictMode>,
)
