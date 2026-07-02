import type { ReactElement } from 'react'
import { render as rtlRender, type RenderOptions } from '@testing-library/react'
import { Provider } from '../components/ui/provider'

export { screen, waitFor, within, fireEvent, cleanup, act } from '@testing-library/react'

export function render(ui: ReactElement, options?: RenderOptions) {
  return rtlRender(ui, { wrapper: Provider, ...options })
}
