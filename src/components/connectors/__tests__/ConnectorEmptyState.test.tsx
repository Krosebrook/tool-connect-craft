import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ConnectorEmptyState } from '../ConnectorEmptyState';

function renderEmptyState(category: string, onResetCategory = vi.fn()) {
  return {
    ...render(
      <BrowserRouter>
        <ConnectorEmptyState category={category} onResetCategory={onResetCategory} />
      </BrowserRouter>
    ),
    onResetCategory,
  };
}

describe('ConnectorEmptyState', () => {
  it('renders MCP empty state with register CTA', () => {
    renderEmptyState('mcp');
    expect(screen.getByText('No MCP servers registered yet')).toBeInTheDocument();
    expect(screen.getByText('Register MCP Server')).toBeInTheDocument();
  });

  it('renders communication empty state', () => {
    renderEmptyState('communication');
    expect(screen.getByText('No communication connectors found')).toBeInTheDocument();
  });

  it('renders development empty state', () => {
    renderEmptyState('development');
    expect(screen.getByText('No development connectors found')).toBeInTheDocument();
  });

  it('renders storage empty state', () => {
    renderEmptyState('storage');
    expect(screen.getByText('No storage connectors found')).toBeInTheDocument();
  });

  it('renders database empty state', () => {
    renderEmptyState('database');
    expect(screen.getByText('No database connectors found')).toBeInTheDocument();
  });

  it('renders productivity empty state', () => {
    renderEmptyState('productivity');
    expect(screen.getByText('No productivity connectors found')).toBeInTheDocument();
  });

  it('renders custom empty state', () => {
    renderEmptyState('custom');
    expect(screen.getByText('No custom connectors found')).toBeInTheDocument();
  });

  it('renders generic fallback for unknown category', () => {
    renderEmptyState('all');
    expect(screen.getByText('No connectors found matching your criteria.')).toBeInTheDocument();
  });

  it('shows Browse All Connectors button and calls onResetCategory', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    renderEmptyState('communication', onReset);
    const browseBtn = screen.getByText('Browse All Connectors');
    await user.click(browseBtn);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('MCP state has a link to /connectors/add-mcp', () => {
    renderEmptyState('mcp');
    const link = screen.getByText('Register MCP Server').closest('a');
    expect(link).toHaveAttribute('href', '/connectors/add-mcp');
  });
});
