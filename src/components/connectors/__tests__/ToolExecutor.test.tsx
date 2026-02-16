/**
 * Unit tests for ToolExecutor component.
 * @module ToolExecutor.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolExecutor } from '../ToolExecutor';
import type { ConnectorTool } from '@/types';

function makeTool(overrides: Partial<ConnectorTool> = {}): ConnectorTool {
  return {
    id: 'tool-1',
    connectorId: 'conn-1',
    name: 'test-tool',
    description: 'A test tool',
    source: 'mcp',
    createdAt: new Date().toISOString(),
    schema: {
      type: 'object',
      properties: {},
    },
    ...overrides,
  };
}

describe('ToolExecutor', () => {
  it('renders Execute Tool button', () => {
    render(<ToolExecutor tool={makeTool()} onExecute={vi.fn()} />);
    expect(screen.getByRole('button', { name: /execute tool/i })).toBeInTheDocument();
  });

  it('shows "no input parameters" for tools without properties', () => {
    render(<ToolExecutor tool={makeTool()} onExecute={vi.fn()} />);
    expect(screen.getByText(/no input parameters/i)).toBeInTheDocument();
  });

  it('renders string input field', () => {
    const tool = makeTool({
      schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
        },
      },
    });
    render(<ToolExecutor tool={tool} onExecute={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search query')).toBeInTheDocument();
  });

  it('renders number input field', () => {
    const tool = makeTool({
      schema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max results' },
        },
      },
    });
    render(<ToolExecutor tool={tool} onExecute={vi.fn()} />);
    expect(screen.getByPlaceholderText('Max results')).toBeInTheDocument();
  });

  it('renders boolean switch field', () => {
    const tool = makeTool({
      schema: {
        type: 'object',
        properties: {
          verbose: { type: 'boolean', description: 'Enable verbose output' },
        },
      },
    });
    render(<ToolExecutor tool={tool} onExecute={vi.fn()} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getAllByText(/verbose/i).length).toBeGreaterThan(0);
  });

  it('renders enum select field', () => {
    const tool = makeTool({
      schema: {
        type: 'object',
        properties: {
          format: { type: 'string', enum: ['json', 'csv', 'xml'] },
        },
      },
    });
    render(<ToolExecutor tool={tool} onExecute={vi.fn()} />);
    expect(screen.getByText(/select format/i)).toBeInTheDocument();
  });

  it('renders textarea for body/content/message fields', () => {
    const tool = makeTool({
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Your message' },
        },
      },
    });
    render(<ToolExecutor tool={tool} onExecute={vi.fn()} />);
    expect(screen.getByPlaceholderText('Your message').tagName).toBe('TEXTAREA');
  });

  it('marks required fields with asterisk', () => {
    const tool = makeTool({
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name' },
        },
        required: ['name'],
      },
    });
    render(<ToolExecutor tool={tool} onExecute={vi.fn()} />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('calls onExecute with form values on submit', async () => {
    const user = userEvent.setup();
    const onExecute = vi.fn().mockResolvedValue(undefined);
    const tool = makeTool({
      schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
        },
      },
    });

    render(<ToolExecutor tool={tool} onExecute={onExecute} />);

    await user.type(screen.getByPlaceholderText('Search query'), 'hello');
    await user.click(screen.getByRole('button', { name: /execute tool/i }));

    expect(onExecute).toHaveBeenCalledWith({ query: 'hello' });
  });

  it('shows loading state when isExecuting is true', () => {
    render(<ToolExecutor tool={makeTool()} onExecute={vi.fn()} isExecuting />);
    expect(screen.getByText(/executing/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /executing/i })).toBeDisabled();
  });

  it('disables button when isExecuting is true', () => {
    render(<ToolExecutor tool={makeTool()} onExecute={vi.fn()} isExecuting />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
