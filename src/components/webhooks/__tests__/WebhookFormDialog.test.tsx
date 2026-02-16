import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { WebhookFormDialog } from '../WebhookFormDialog';

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  onSubmit: vi.fn(),
};

function renderDialog(props: Partial<Parameters<typeof WebhookFormDialog>[0]> = {}) {
  return render(<WebhookFormDialog {...defaultProps} {...props} />);
}

describe('WebhookFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create mode', () => {
    it('renders create title and description', () => {
      const { getByText } = renderDialog();
      expect(getByText('Create Webhook')).toBeInTheDocument();
      expect(getByText(/Configure a new webhook endpoint/)).toBeInTheDocument();
    });

    it('renders empty form fields', () => {
      const { getByPlaceholderText } = renderDialog();
      expect(getByPlaceholderText('My Webhook')).toHaveValue('');
      expect(getByPlaceholderText('https://api.example.com/webhooks')).toHaveValue('');
      expect(getByPlaceholderText('whsec_...')).toHaveValue('');
    });

    it('renders all available event checkboxes', () => {
      const { getByText } = renderDialog();
      expect(getByText('Connection Activated')).toBeInTheDocument();
      expect(getByText('Connection Expired')).toBeInTheDocument();
      expect(getByText('Connection Revoked')).toBeInTheDocument();
      expect(getByText('Connection Error')).toBeInTheDocument();
      expect(getByText('Token Refreshed')).toBeInTheDocument();
    });

    it('submits form data when Create Webhook is clicked', () => {
      const onSubmit = vi.fn();
      const { getByPlaceholderText, getByRole } = renderDialog({ onSubmit });

      fireEvent.change(getByPlaceholderText('My Webhook'), { target: { value: 'Test Hook' } });
      fireEvent.change(getByPlaceholderText('https://api.example.com/webhooks'), { target: { value: 'https://example.com/hook' } });
      fireEvent.change(getByPlaceholderText('whsec_...'), { target: { value: 'secret123' } });

      // Click the submit button (the one that says "Create Webhook" in the footer)
      const buttons = getByRole('button', { name: /create webhook/i });
      fireEvent.click(buttons);

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test Hook',
        url: 'https://example.com/hook',
        secret: 'secret123',
        events: [],
        payloadTemplate: '',
      });
    });

    it('calls onOpenChange when Cancel is clicked', () => {
      const onOpenChange = vi.fn();
      const { getByRole } = renderDialog({ onOpenChange });
      fireEvent.click(getByRole('button', { name: /cancel/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Edit mode', () => {
    const existingWebhook = {
      id: 'wh-1',
      name: 'Slack Notifications',
      url: 'https://hooks.slack.com/services/xxx',
      secret: 'whsec_abc123',
      events: ['connection.active', 'connection.expired'],
      is_active: true,
      created_at: new Date().toISOString(),
      payload_template: { event: '{{event}}', status: '{{status}}' },
    };

    it('renders edit title and description', () => {
      const { getByText } = renderDialog({ webhook: existingWebhook });
      expect(getByText('Edit Webhook')).toBeInTheDocument();
      expect(getByText(/Update your webhook endpoint/)).toBeInTheDocument();
    });

    it('pre-fills form with existing webhook data', () => {
      const { getByDisplayValue } = renderDialog({ webhook: existingWebhook });
      expect(getByDisplayValue('Slack Notifications')).toBeInTheDocument();
      expect(getByDisplayValue('https://hooks.slack.com/services/xxx')).toBeInTheDocument();
      expect(getByDisplayValue('whsec_abc123')).toBeInTheDocument();
    });

    it('shows Save Changes button instead of Create Webhook', () => {
      const { getByRole } = renderDialog({ webhook: existingWebhook });
      expect(getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('pre-fills payload template as formatted JSON', () => {
      const { getByDisplayValue } = renderDialog({ webhook: existingWebhook });
      const expectedJson = JSON.stringify(existingWebhook.payload_template, null, 2);
      expect(getByDisplayValue(expectedJson)).toBeInTheDocument();
    });
  });

  describe('Payload template validation', () => {
    it('shows error for invalid JSON', () => {
      const { getByLabelText, getByText } = renderDialog();
      const textarea = getByLabelText(/payload template/i);
      fireEvent.change(textarea, { target: { value: '{ invalid json' } });
      expect(getByText('Invalid JSON format')).toBeInTheDocument();
    });

    it('clears error for valid JSON', () => {
      const { getByLabelText, getByText, queryByText } = renderDialog();
      const textarea = getByLabelText(/payload template/i);
      fireEvent.change(textarea, { target: { value: '{ invalid' } });
      expect(getByText('Invalid JSON format')).toBeInTheDocument();
      fireEvent.change(textarea, { target: { value: '{"valid": true}' } });
      expect(queryByText('Invalid JSON format')).not.toBeInTheDocument();
    });

    it('does not submit when template has invalid JSON', () => {
      const onSubmit = vi.fn();
      const { getByLabelText, getByRole } = renderDialog({ onSubmit });
      const textarea = getByLabelText(/payload template/i);
      fireEvent.change(textarea, { target: { value: '{ bad' } });
      fireEvent.click(getByRole('button', { name: /create webhook/i }));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('allows empty template', () => {
      const onSubmit = vi.fn();
      const { getByRole } = renderDialog({ onSubmit });
      fireEvent.click(getByRole('button', { name: /create webhook/i }));
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  describe('Secret visibility toggle', () => {
    it('toggles secret field visibility', () => {
      const { getByPlaceholderText, getAllByRole } = renderDialog();
      const secretInput = getByPlaceholderText('whsec_...');
      expect(secretInput).toHaveAttribute('type', 'password');

      // Find the eye toggle button (ghost button inside the secret field)
      const toggleButtons = getAllByRole('button');
      const eyeButton = toggleButtons.find(
        btn => btn.querySelector('svg') && btn.closest('.relative')
      );
      if (eyeButton) {
        fireEvent.click(eyeButton);
        expect(secretInput).toHaveAttribute('type', 'text');
      }
    });
  });

  describe('Not rendered when closed', () => {
    it('does not render content when open is false', () => {
      const { queryByText } = render(
        <WebhookFormDialog open={false} onOpenChange={vi.fn()} onSubmit={vi.fn()} />
      );
      expect(queryByText('Create Webhook')).not.toBeInTheDocument();
    });
  });
});
