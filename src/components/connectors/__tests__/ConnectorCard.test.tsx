import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConnectorCard } from '../ConnectorCard';
import type { Connector, UserConnection } from '@/types';

const mockConnector: Connector = {
  id: 'c1',
  name: 'Gmail',
  slug: 'gmail',
  description: 'Send and receive emails via Gmail API',
  category: 'communication',
  iconUrl: '',
  authType: 'oauth',
  isActive: true,
  createdAt: new Date().toISOString(),
};

const mockConnection: UserConnection = {
  id: 'conn-1',
  userId: 'u1',
  connectorId: 'c1',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderCard(props: Partial<Parameters<typeof ConnectorCard>[0]> = {}) {
  return render(
    <BrowserRouter>
      <ConnectorCard connector={mockConnector} {...props} />
    </BrowserRouter>
  );
}

describe('ConnectorCard', () => {
  it('renders connector name and description', () => {
    const { getByText } = renderCard();
    expect(getByText('Gmail')).toBeInTheDocument();
    expect(getByText('Send and receive emails via Gmail API')).toBeInTheDocument();
  });

  it('renders category', () => {
    const { getByText } = renderCard();
    expect(getByText('communication')).toBeInTheDocument();
  });

  it('renders auth type label', () => {
    const { getByText } = renderCard();
    expect(getByText('OAuth 2.0')).toBeInTheDocument();
  });

  it('shows Connect button when not connected', () => {
    const { getByRole } = renderCard();
    expect(getByRole('button', { name: /connect/i })).toBeInTheDocument();
  });

  it('shows Open link when connected', () => {
    const { getByText, queryByRole } = renderCard({ connection: mockConnection });
    expect(getByText('Open')).toBeInTheDocument();
    expect(queryByRole('button', { name: /^connect$/i })).not.toBeInTheDocument();
  });

  it('calls onConnect when Connect button is clicked', () => {
    const onConnect = vi.fn();
    const { getByRole } = renderCard({ onConnect });
    getByRole('button', { name: /connect/i }).click();
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it('disables Connect button when isConnecting is true', () => {
    const { getByRole } = renderCard({ isConnecting: true });
    expect(getByRole('button', { name: /connect/i })).toBeDisabled();
  });

  it('shows API Key label for api_key auth type', () => {
    const { getByText } = renderCard({ connector: { ...mockConnector, authType: 'api_key' } });
    expect(getByText('API Key')).toBeInTheDocument();
  });

  it('shows No Auth label for none auth type', () => {
    const { getByText } = renderCard({ connector: { ...mockConnector, authType: 'none' } });
    expect(getByText('No Auth')).toBeInTheDocument();
  });
});
