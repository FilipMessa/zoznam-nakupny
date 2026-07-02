import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../test/render'
import { LoadingScreen } from './LoadingScreen'

describe('LoadingScreen', () => {
  it('renders a loading indicator', () => {
    render(<LoadingScreen />)
    expect(screen.getByText(/načítava/i)).toBeInTheDocument()
  })
})
