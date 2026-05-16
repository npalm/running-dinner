import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ParticipantCard } from './ParticipantCard'
import { renderWithProviders } from '../../test/renderWithProviders'
import type { Participant } from '../../types'

function makeParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    id: 'p-1',
    name: 'Emma de Vries',
    count: 1,
    address: 'Cortenbachstraat 92, Eindhoven',
    coordinates: { lat: 51.4595, lng: 5.4827 },
    preference: null,
    canCook: true,
    ...overrides,
  }
}

describe('ParticipantCard', () => {
  it('renders participant name', () => {
    renderWithProviders(
      <ParticipantCard
        participant={makeParticipant()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByText('Emma de Vries')).toBeInTheDocument()
  })

  it('renders participant address', () => {
    renderWithProviders(
      <ParticipantCard
        participant={makeParticipant()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByText('Cortenbachstraat 92, Eindhoven')).toBeInTheDocument()
  })

  it('shows "1 person" count badge for singles', () => {
    renderWithProviders(
      <ParticipantCard
        participant={makeParticipant({ count: 1 })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByText('1 person')).toBeInTheDocument()
  })

  it('shows "2 persons" count badge for pairs', () => {
    renderWithProviders(
      <ParticipantCard
        participant={makeParticipant({ count: 2 })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByText('2 persons')).toBeInTheDocument()
  })

  it('shows preference badge when preference is set', () => {
    renderWithProviders(
      <ParticipantCard
        participant={makeParticipant({ preference: 'starter' })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByText('Starter')).toBeInTheDocument()
  })

  it('shows "No preference" badge when preference is null', () => {
    renderWithProviders(
      <ParticipantCard
        participant={makeParticipant({ preference: null })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByText('No preference')).toBeInTheDocument()
  })

  it('shows "Prefer not to cook" badge for prefer-not', () => {
    renderWithProviders(
      <ParticipantCard
        participant={makeParticipant({ preference: 'prefer-not' })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByText('Prefer not to cook')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderWithProviders(
      <ParticipantCard
        participant={makeParticipant()}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: /edit participant/i }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderWithProviders(
      <ParticipantCard
        participant={makeParticipant()}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    )
    await user.click(screen.getByRole('button', { name: /remove participant/i }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('shows OSM link when coordinates are present', () => {
    renderWithProviders(
      <ParticipantCard
        participant={makeParticipant({ coordinates: { lat: 51.4595, lng: 5.4827 } })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    const link = screen.getByRole('link', { name: /view on map/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/?mlat=51.4595&mlon=5.4827&zoom=17',
    )
  })

  it('hides OSM link when coordinates are null', () => {
    renderWithProviders(
      <ParticipantCard
        participant={makeParticipant({ coordinates: null })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.queryByRole('link', { name: /view on map/i })).not.toBeInTheDocument()
  })

  it('OSM link opens in new tab', () => {
    renderWithProviders(
      <ParticipantCard
        participant={makeParticipant()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    const link = screen.getByRole('link', { name: /view on map/i })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows dessert preference badge', () => {
    renderWithProviders(
      <ParticipantCard
        participant={makeParticipant({ preference: 'dessert' })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByText('Dessert')).toBeInTheDocument()
  })

  it('shows main course preference badge', () => {
    renderWithProviders(
      <ParticipantCard
        participant={makeParticipant({ preference: 'main' })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByText('Main course')).toBeInTheDocument()
  })
})
