import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConnectorGrid } from '../ConnectorGrid';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Database } from '@/integrations/supabase/types';

type DbConnector = Database['public']['Tables']['connectors']['Row'];
type DbUserConnection = Database['public']['Tables']['user_connections']['Row'];

const makeConnector = (overrides: Partial<DbConnector> = {}): DbConnector => ({
  id: 'c1',
  name: 'Gmail',
  slug: 'gmail',
  description: 'Send emails',
  category: 'Communication',
  icon_url: null,
  auth_type: 'oauth',
  mcp_server_url: null,
  oauth_provider: 'google',
  oauth_scopes: [],
  oauth_config: null,
  is_active: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

const makeConnection = (overrides: Partial<DbUserConnection> = {}): DbUserConnection => ({
  id: 'conn-1',
  user_id: 'u1',
  connector_id: 'c1',
  status: 'active',
  expires_at: null,
  last_used_at: null,
  scopes: null,
  secret_ref_access: null,
  secret_ref_refresh: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const defaultProps = {
  connections: [] as DbUserConnection[],
  viewMode: 'grid' as const,
  animationKey: 'test',
  onConnect: vi.fn(),
  onDisconnect: vi.fn(),
  onRefreshToken: vi.fn(),
  isConnecting: false,
  connectingConnectorId: null,
  getHealth: vi.fn().mockReturnValue({ status: 'unknown' as const, latencyMs: null }),
};

function renderGrid(overrides = {}) {
  const props = {
    oauthConnectors: [] as DbConnector[],
    otherConnectors: [] as DbConnector[],
    ...defaultProps,
    ...overrides,
  };
  return render(
    <BrowserRouter>
      <TooltipProvider>
        <ConnectorGrid {...props} />
      </TooltipProvider>
    </BrowserRouter>
  );
}

describe('ConnectorGrid', () => {
  it('renders nothing when both lists are empty', () => {
    const { container } = renderGrid();
    expect(container.textContent).toBe('');
  });

  it('renders OAuth section header when oauth connectors exist', () => {
    renderGrid({ oauthConnectors: [makeConnector()] });
    expect(screen.getByText('OAuth Integrations')).toBeInTheDocument();
    expect(screen.getByText('(1)')).toBeInTheDocument();
  });

  it('renders connector name in OAuth section', () => {
    renderGrid({ oauthConnectors: [makeConnector()] });
    expect(screen.getByText('Gmail')).toBeInTheDocument();
  });

  it('renders Other Integrations header when both sections have items', () => {
    renderGrid({
      oauthConnectors: [makeConnector()],
      otherConnectors: [makeConnector({ id: 'c2', name: 'Custom MCP', slug: 'custom-mcp', auth_type: 'api_key' })],
    });
    expect(screen.getByText('Other Integrations')).toBeInTheDocument();
  });

  it('does not render Other header when only other connectors exist', () => {
    renderGrid({
      otherConnectors: [makeConnector({ id: 'c2', name: 'Custom', slug: 'custom', auth_type: 'api_key' })],
    });
    expect(screen.queryByText('Other Integrations')).not.toBeInTheDocument();
  });

  it('applies staggered animation delays to card wrappers', () => {
    const { container } = renderGrid({
      oauthConnectors: [
        makeConnector(),
        makeConnector({ id: 'c2', name: 'Drive', slug: 'drive' }),
      ],
    });
    // Select only direct card wrappers (children of the grid container)
    const gridEl = container.querySelector('.grid');
    const cards = gridEl ? Array.from(gridEl.children) : [];
    expect(cards).toHaveLength(2);
    expect((cards[0] as HTMLElement).style.animationDelay).toBe('0ms');
    expect((cards[1] as HTMLElement).style.animationDelay).toBe('75ms');
  });
});
