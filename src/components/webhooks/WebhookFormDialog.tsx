import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, EyeOff } from 'lucide-react';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string | null;
  events: string[];
  is_active: boolean;
  created_at: string;
  payload_template: unknown;
}

const AVAILABLE_EVENTS = [
  { id: 'connection.active', label: 'Connection Activated', description: 'When a connection becomes active' },
  { id: 'connection.expired', label: 'Connection Expired', description: 'When a connection token expires' },
  { id: 'connection.revoked', label: 'Connection Revoked', description: 'When a connection is manually revoked' },
  { id: 'connection.error', label: 'Connection Error', description: 'When a connection enters error state' },
  { id: 'token.refreshed', label: 'Token Refreshed', description: 'When a token is automatically refreshed' },
];

interface WebhookFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; url: string; secret: string; events: string[]; payloadTemplate: string }) => void;
  webhook?: WebhookConfig | null;
}

export function WebhookFormDialog({ open, onOpenChange, onSubmit, webhook }: WebhookFormDialogProps) {
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formSecret, setFormSecret] = useState('');
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [formTemplate, setFormTemplate] = useState('');
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const isEditing = !!webhook;

  useEffect(() => {
    if (open && webhook) {
      setFormName(webhook.name);
      setFormUrl(webhook.url);
      setFormSecret(webhook.secret || '');
      setFormEvents(webhook.events);
      setFormTemplate(webhook.payload_template ? JSON.stringify(webhook.payload_template, null, 2) : '');
      setTemplateError(null);
      setShowSecret(false);
    } else if (open && !webhook) {
      setFormName('');
      setFormUrl('');
      setFormSecret('');
      setFormEvents([]);
      setFormTemplate('');
      setTemplateError(null);
      setShowSecret(false);
    }
  }, [open, webhook]);

  const validateTemplate = (value: string): boolean => {
    if (!value.trim()) {
      setTemplateError(null);
      return true;
    }
    try {
      JSON.parse(value);
      setTemplateError(null);
      return true;
    } catch {
      setTemplateError('Invalid JSON format');
      return false;
    }
  };

  const toggleEvent = (eventId: string) => {
    setFormEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSubmit = () => {
    if (formTemplate && !validateTemplate(formTemplate)) return;
    onSubmit({ name: formName, url: formUrl, secret: formSecret, events: formEvents, payloadTemplate: formTemplate });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Webhook' : 'Create Webhook'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update your webhook endpoint configuration.' : 'Configure a new webhook endpoint to receive connection events.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="My Webhook" value={formName} onChange={(e) => setFormName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">Endpoint URL</Label>
            <Input id="url" type="url" placeholder="https://api.example.com/webhooks" value={formUrl} onChange={(e) => setFormUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secret">
              Secret (optional)
              <span className="text-muted-foreground text-xs ml-2">Used for HMAC signature verification</span>
            </Label>
            <div className="relative">
              <Input id="secret" type={showSecret ? 'text' : 'password'} placeholder="whsec_..." value={formSecret} onChange={(e) => setFormSecret(e.target.value)} />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7" onClick={() => setShowSecret(!showSecret)}>
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <Label>Events</Label>
            <div className="space-y-2">
              {AVAILABLE_EVENTS.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Checkbox id={event.id} checked={formEvents.includes(event.id)} onCheckedChange={() => toggleEvent(event.id)} />
                  <div className="flex-1">
                    <Label htmlFor={event.id} className="cursor-pointer">{event.label}</Label>
                    <p className="text-xs text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="template">
              Payload Template (optional)
              <span className="text-muted-foreground text-xs ml-2">JSON template with {'{{variable}}'} placeholders</span>
            </Label>
            <Textarea
              id="template"
              placeholder={`{\n  "event": "{{event}}",\n  "connector": "{{connectorName}}",\n  "status": "{{status}}",\n  "timestamp": "{{timestamp}}"\n}`}
              value={formTemplate}
              onChange={(e) => { setFormTemplate(e.target.value); validateTemplate(e.target.value); }}
              className="font-mono text-sm min-h-[120px]"
            />
            {templateError && <p className="text-xs text-destructive">{templateError}</p>}
            <p className="text-xs text-muted-foreground">
              Available variables: {'{{event}}'}, {'{{timestamp}}'}, {'{{connectionId}}'}, {'{{connectorId}}'}, {'{{connectorName}}'}, {'{{connectorSlug}}'}, {'{{userId}}'}, {'{{status}}'}, {'{{previousStatus}}'}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEditing ? 'Save Changes' : 'Create Webhook'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
