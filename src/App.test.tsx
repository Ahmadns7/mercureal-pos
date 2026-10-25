// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from './pages/Dashboard'

describe('smoke render', () => {
  it('dashboard renders without crashing', () => {
    const { container } = render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(container.innerHTML).toContain('Today')
    expect(screen.queryByTestId('take-home')).toBeTruthy()
  })
})
