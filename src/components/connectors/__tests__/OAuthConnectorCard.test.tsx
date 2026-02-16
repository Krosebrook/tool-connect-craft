import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OAuthConnectorCard } from '../OAuthConnectorCard';
import type { Database } from '@/integrations/supabase/types';

type DbConnector = Database['public']['Tables']['connectors']['Row'];
type DbUserConnection = Database['public']['Tables']['user_connections']['Row'];

const mockConnector: DbConnector = {
  id: 'c1',
  name: 'Google',
  slug: 'google',
  description: 'Connect to Google services',
  category: 'productivity',
  icon_url: null,
  auth_type: 'oauth',
  oauth_provider: 'google',
  oauth_scopes: ['email', 'profile'],
  oauth_config: null,
  mcp_server_url: null,
  is_active: true,
  created_at: new Date().toISOString(),
};

const activeConnection: DbUserConnection = {
  id: 'conn-1',
  user_id: 'u1',
  connector_id: 'c1',
  status: 'active',
  scopes: ['email', 'profile', 'drive.readonly', 'calendar'],
  expires_at: new Date(Date.now() + 3600000).toISOString(),
  secret_ref_access: null,
  secret_ref_refresh: null,
  last_used_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const expiredConnection: DbUserConnection = {
  ...activeConnection,
  status: 'expired',
  expires_at: new Date(Date.now() - 3600000).toISOString(),
};

const defaultProps = {
  connector: mockConnector,
  onConnect: vi.fn(),
  onDisconnect: vi.fn(),
  onRefreshToken: vi.fn(),
  isConnecting: false,
  isCurrentConnector: false,
};

function renderCard(props: Partial<typeof defaultProps & { connection?: DbUserConnection }> = {}) {
  return render(
    <BrowserRouter>
      <OAuthConnectorCard {...defaultProps} {...props} />
    </BrowserRouter>
  );
}

describe('OAuthConnectorCard', () => {
  it('renders connector name and description', () => {
    const { getByText } = renderCard();
    expect(getByText('Google')).toBeInTheDocument();
    expect(getByText('Connect to Google services')).toBeInTheDocument();
  });

  it('shows "Not Connected" when no connection', () => {
    const { getByText } = renderCard();
    expect(getByText('Not Connected')).toBeInTheDocument();
  });

  it('shows Connect button when not connected', () => {
    const { getByRole } = renderCard();
    expect(getByRole('button', { name: /connect/i })).toBeInTheDocument();
  });

  it('calls onConnect with connector id when Connect is clicked', () => {
    const onConnect = vi.fn();
    const { getByRole } = renderCard({ onConnect });
    getByRole('button', { name: /connect/i }).click();
    expect(onConnect).toHaveBeenCalledWith('c1');
  });

  it('shows "Connected" status when connection is active', () => {
    const { getByText } = renderCard({ connection: activeConnection });
    expect(getByText('Connected')).toBeInTheDocument();
  });

  it('shows Open link when connected', () => {
    const { getByText } = renderCard({ connection: activeConnection });
    expect(getByText('Open')).toBeInTheDocument();
  });

  it('renders scopes as badges (max 3 visible)', () => {
    const { getByText } = renderCard({ connection: activeConnection });
    expect(getByText('email')).toBeInTheDocument();
    expect(getByText('profile')).toBeInTheDocument();
    expect(getByText('drive.readonly')).toBeInTheDocument();
    expect(getByText('+1 more')).toBeInTheDocument();
  });

  it('shows "Token Expired" for expired connections', () => {
    const { getByText } = renderCard({ connection: expiredConnection });
    expect(getByText('Token Expired')).toBeInTheDocument();
  });

  it('shows Reconnect button for expired connections', () => {
    const { getByRole } = renderCard({ connection: expiredConnection });
    expect(getByRole('button', { name: /reconnect/i })).toBeInTheDocument();
  });

  it('shows expiry info in footer', () => {
    const { getByText } = renderCard({ connection: activeConnection });
    expect(getByText(/expires in/i)).toBeInTheDocument();
  });

  it('shows "Expired" text for past expiry dates', () => {
    const { getByText } = renderCard({ connection: expiredConnection });
    expect(getByText('Expired')).toBeInTheDocument();
  });

  it('renders OAuth 2.0 auth type label', () => {
    const { getByText } = renderCard();
    expect(getByText('OAuth 2.0')).toBeInTheDocument();
  });

  it('disables Connect button when isConnecting and isCurrentConnector', () => {
    const { getByRole } = renderCard({ isConnecting: true, isCurrentConnector: true });
    expect(getByRole('button', { name: /connect/i })).toBeDisabled();
  });
});
