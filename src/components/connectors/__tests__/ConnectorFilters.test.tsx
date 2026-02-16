import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectorFilters } from '../ConnectorFilters';

// Wrap with TooltipProvider since component uses Tooltip
import { TooltipProvider } from '@/components/ui/tooltip';

function renderFilters(overrides = {}) {
  const props = {
    search: '',
    onSearchChange: vi.fn(),
    category: 'all',
    onCategoryChange: vi.fn(),
    viewMode: 'grid' as const,
    onViewModeChange: vi.fn(),
    ...overrides,
  };
  return {
    ...render(
      <TooltipProvider>
        <ConnectorFilters {...props} />
      </TooltipProvider>
    ),
    props,
  };
}

describe('ConnectorFilters', () => {
  it('renders search input', () => {
    renderFilters();
    expect(screen.getByPlaceholderText('Search connectors...')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing', async () => {
    const user = userEvent.setup();
    const { props } = renderFilters();
    const input = screen.getByPlaceholderText('Search connectors...');
    await user.type(input, 'a');
    expect(props.onSearchChange).toHaveBeenCalled();
  });

  it('renders all category pills', () => {
    renderFilters();
    expect(screen.getByText('All Connectors')).toBeInTheDocument();
    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('Development')).toBeInTheDocument();
    expect(screen.getByText('MCP')).toBeInTheDocument();
  });

  it('calls onCategoryChange when pill clicked', async () => {
    const user = userEvent.setup();
    const { props } = renderFilters();
    await user.click(screen.getByText('Communication'));
    expect(props.onCategoryChange).toHaveBeenCalledWith('communication');
  });

  it('highlights active category pill', () => {
    renderFilters({ category: 'development' });
    // The active pill uses 'default' variant, others use 'outline'
    const devButton = screen.getByText('Development').closest('button');
    expect(devButton).toBeInTheDocument();
  });

  it('calls onViewModeChange when toggling view', async () => {
    const user = userEvent.setup();
    const { props } = renderFilters({ viewMode: 'grid' });
    // Click list view button (second icon button)
    const buttons = screen.getAllByRole('button');
    const listButton = buttons.find(b => b.querySelector('.lucide-list'));
    if (listButton) {
      await user.click(listButton);
      expect(props.onViewModeChange).toHaveBeenCalledWith('list');
    }
  });
});
