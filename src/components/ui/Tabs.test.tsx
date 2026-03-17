import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { Tabs, Tab } from './Tabs'

describe('Tabs', () => {
  const TestTabs = () => (
    <Tabs>
      <Tab id="tab1" label="Tab 1">
        <p>Content 1</p>
      </Tab>
      <Tab id="tab2" label="Tab 2">
        <p>Content 2</p>
      </Tab>
      <Tab id="tab3" label="Tab 3">
        <p>Content 3</p>
      </Tab>
    </Tabs>
  )

  describe('rendering', () => {
    it('renders all tab buttons', () => {
      render(<TestTabs />)
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Tab 3' })).toBeInTheDocument()
    })

    it('renders tablist container', () => {
      render(<TestTabs />)
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })

    it('renders tabpanels', () => {
      render(<TestTabs />)
      // Multiple tabpanels are rendered (one per tab), use getAllByRole
      expect(screen.getAllByRole('tabpanel').length).toBeGreaterThan(0)
    })
  })

  describe('uncontrolled mode', () => {
    it('shows first tab content by default', () => {
      render(<TestTabs />)
      expect(screen.getByText('Content 1')).toBeInTheDocument()
    })

    it('activates first tab by default', () => {
      render(<TestTabs />)
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveClass('active')
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('aria-selected', 'true')
    })

    it('uses defaultTab when provided', () => {
      render(
        <Tabs defaultTab="tab2">
          <Tab id="tab1" label="Tab 1"><p>Content 1</p></Tab>
          <Tab id="tab2" label="Tab 2"><p>Content 2</p></Tab>
        </Tabs>
      )
      expect(screen.getByText('Content 2')).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveClass('active')
    })

    it('switches tabs on click', async () => {
      const { user } = render(<TestTabs />)

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }))

      expect(screen.getByText('Content 2')).toBeInTheDocument()
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveClass('active')
    })
  })

  describe('controlled mode', () => {
    const ControlledTabs = () => {
      const [activeTab, setActiveTab] = useState('tab1')
      return (
        <Tabs activeTab={activeTab} onTabChange={setActiveTab}>
          <Tab id="tab1" label="Tab 1"><p>Content 1</p></Tab>
          <Tab id="tab2" label="Tab 2"><p>Content 2</p></Tab>
        </Tabs>
      )
    }

    it('shows controlled tab content', () => {
      render(<ControlledTabs />)
      expect(screen.getByText('Content 1')).toBeInTheDocument()
    })

    it('calls onTabChange when tab is clicked', async () => {
      const onTabChange = vi.fn()
      const { user } = render(
        <Tabs activeTab="tab1" onTabChange={onTabChange}>
          <Tab id="tab1" label="Tab 1"><p>Content 1</p></Tab>
          <Tab id="tab2" label="Tab 2"><p>Content 2</p></Tab>
        </Tabs>
      )

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }))
      expect(onTabChange).toHaveBeenCalledWith('tab2')
    })
  })

  describe('variants', () => {
    it('applies default variant without extra class', () => {
      render(<TestTabs />)
      const tablist = screen.getByRole('tablist')
      expect(tablist).toHaveClass('tabs')
      expect(tablist).not.toHaveClass('tabs--vertical')
      expect(tablist).not.toHaveClass('tabs--compact')
    })

    it.each(['vertical', 'compact'] as const)('applies %s variant class', (variant) => {
      render(
        <Tabs variant={variant}>
          <Tab id="tab1" label="Tab 1"><p>Content</p></Tab>
        </Tabs>
      )
      expect(screen.getByRole('tablist')).toHaveClass(`tabs--${variant}`)
    })
  })

  describe('icons', () => {
    it('renders icon in tab button', () => {
      render(
        <Tabs>
          <Tab id="tab1" label="Settings" icon={<span data-testid="icon">⚙️</span>}>
            <p>Content</p>
          </Tab>
        </Tabs>
      )
      expect(screen.getByTestId('icon')).toBeInTheDocument()
    })
  })

  describe('disabled tabs', () => {
    it('disables tab button when disabled prop is true', () => {
      render(
        <Tabs>
          <Tab id="tab1" label="Tab 1"><p>Content 1</p></Tab>
          <Tab id="tab2" label="Tab 2" disabled><p>Content 2</p></Tab>
        </Tabs>
      )
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeDisabled()
    })

    it('does not switch to disabled tab on click', async () => {
      const { user } = render(
        <Tabs>
          <Tab id="tab1" label="Tab 1"><p>Content 1</p></Tab>
          <Tab id="tab2" label="Tab 2" disabled><p>Content 2</p></Tab>
        </Tabs>
      )

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }))
      expect(screen.getByText('Content 1')).toBeInTheDocument()
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has aria-controls linking tab to panel', () => {
      render(<TestTabs />)
      const tab = screen.getByRole('tab', { name: 'Tab 1' })
      expect(tab).toHaveAttribute('aria-controls', 'tabpanel-tab1')
    })

    it('has aria-labelledby on tabpanel', () => {
      render(<TestTabs />)
      // Get all tabpanels and check the first (active) one
      const panels = screen.getAllByRole('tabpanel')
      expect(panels[0]).toHaveAttribute('aria-labelledby', 'tab1')
    })
  })

  describe('custom className', () => {
    it('merges custom className with default classes', () => {
      render(
        <Tabs className="custom-tabs">
          <Tab id="tab1" label="Tab 1"><p>Content</p></Tab>
        </Tabs>
      )
      expect(screen.getByRole('tablist')).toHaveClass('tabs')
      expect(screen.getByRole('tablist')).toHaveClass('custom-tabs')
    })
  })
})

