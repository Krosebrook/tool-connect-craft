import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Webhook, 
  Moon,
  Save,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  id?: string;
  email_enabled: boolean;
  email_connection_active: boolean;
  email_connection_expired: boolean;
  email_token_refreshed: boolean;
  email_health_alerts: boolean;
  push_enabled: boolean;
  push_connection_active: boolean;
  push_connection_expired: boolean;
  push_token_refreshed: boolean;
  push_health_alerts: boolean;
  webhook_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

const defaultPreferences: NotificationPreferences = {
  email_enabled: true,
  email_connection_active: true,
  email_connection_expired: true,
  email_token_refreshed: false,
  email_health_alerts: true,
  push_enabled: false,
  push_connection_active: true,
  push_connection_expired: true,
  push_token_refreshed: false,
  push_health_alerts: true,
  webhook_enabled: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
};

export default function NotificationPreferencesPage() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching preferences:', error);
    } else if (data) {
      setPreferences({
        ...data,
        quiet_hours_start: data.quiet_hours_start?.substring(0, 5) || '22:00',
        quiet_hours_end: data.quiet_hours_end?.substring(0, 5) || '08:00',
      });
    }

    setLoading(false);
  };

  const savePreferences = async () => {
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save preferences',
        variant: 'destructive',
      });
      setSaving(false);
      return;
    }

    const prefsToSave = {
      user_id: user.id,
      ...preferences,
      quiet_hours_start: preferences.quiet_hours_start + ':00',
      quiet_hours_end: preferences.quiet_hours_end + ':00',
    };

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(prefsToSave, { onConflict: 'user_id' });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Saved',
        description: 'Your notification preferences have been updated',
      });
    }

    setSaving(false);
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Notification Preferences</h1>
            <p className="text-muted-foreground">
              Configure how and when you receive alerts about your connections.
            </p>
          </div>
          <Button onClick={savePreferences} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <div className="space-y-6">
          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Receive alerts via email for important events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-enabled" className="flex-1">
                  Enable email notifications
                </Label>
                <Switch
                  id="email-enabled"
                  checked={preferences.email_enabled}
                  onCheckedChange={(v) => updatePreference('email_enabled', v)}
                />
              </div>
              
              {preferences.email_enabled && (
                <>
                  <Separator />
                  <div className="space-y-3 pl-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-active" className="text-sm text-muted-foreground">
                        Connection activated
                      </Label>
                      <Switch
                        id="email-active"
                        checked={preferences.email_connection_active}
                        onCheckedChange={(v) => updatePreference('email_connection_active', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-expired" className="text-sm text-muted-foreground">
                        Connection expired
                      </Label>
                      <Switch
                        id="email-expired"
                        checked={preferences.email_connection_expired}
                        onCheckedChange={(v) => updatePreference('email_connection_expired', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-refresh" className="text-sm text-muted-foreground">
                        Token refreshed
                      </Label>
                      <Switch
                        id="email-refresh"
                        checked={preferences.email_token_refreshed}
                        onCheckedChange={(v) => updatePreference('email_token_refreshed', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-health" className="text-sm text-muted-foreground">
                        Health alerts
                      </Label>
                      <Switch
                        id="email-health"
                        checked={preferences.email_health_alerts}
                        onCheckedChange={(v) => updatePreference('email_health_alerts', v)}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Push Notifications
              </CardTitle>
              <CardDescription>
                Receive real-time alerts on your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="push-enabled" className="flex-1">
                  Enable push notifications
                </Label>
                <Switch
                  id="push-enabled"
                  checked={preferences.push_enabled}
                  onCheckedChange={(v) => updatePreference('push_enabled', v)}
                />
              </div>
              
              {preferences.push_enabled && (
                <>
                  <Separator />
                  <div className="space-y-3 pl-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-active" className="text-sm text-muted-foreground">
                        Connection activated
                      </Label>
                      <Switch
                        id="push-active"
                        checked={preferences.push_connection_active}
                        onCheckedChange={(v) => updatePreference('push_connection_active', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-expired" className="text-sm text-muted-foreground">
                        Connection expired
                      </Label>
                      <Switch
                        id="push-expired"
                        checked={preferences.push_connection_expired}
                        onCheckedChange={(v) => updatePreference('push_connection_expired', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-refresh" className="text-sm text-muted-foreground">
                        Token refreshed
                      </Label>
                      <Switch
                        id="push-refresh"
                        checked={preferences.push_token_refreshed}
                        onCheckedChange={(v) => updatePreference('push_token_refreshed', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-health" className="text-sm text-muted-foreground">
                        Health alerts
                      </Label>
                      <Switch
                        id="push-health"
                        checked={preferences.push_health_alerts}
                        onCheckedChange={(v) => updatePreference('push_health_alerts', v)}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Webhook Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhook Notifications
              </CardTitle>
              <CardDescription>
                Send events to your configured webhook endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="webhook-enabled">Enable webhook notifications</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure webhook endpoints in the Webhooks settings page
                  </p>
                </div>
                <Switch
                  id="webhook-enabled"
                  checked={preferences.webhook_enabled}
                  onCheckedChange={(v) => updatePreference('webhook_enabled', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Quiet Hours
              </CardTitle>
              <CardDescription>
                Pause non-critical notifications during specific hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="quiet-enabled" className="flex-1">
                  Enable quiet hours
                </Label>
                <Switch
                  id="quiet-enabled"
                  checked={preferences.quiet_hours_enabled}
                  onCheckedChange={(v) => updatePreference('quiet_hours_enabled', v)}
                />
              </div>
              
              {preferences.quiet_hours_enabled && (
                <>
                  <Separator />
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor="quiet-start" className="text-sm text-muted-foreground">
                        Start time
                      </Label>
                      <Input
                        id="quiet-start"
                        type="time"
                        value={preferences.quiet_hours_start}
                        onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="quiet-end" className="text-sm text-muted-foreground">
                        End time
                      </Label>
                      <Input
                        id="quiet-end"
                        type="time"
                        value={preferences.quiet_hours_end}
                        onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Critical alerts like connection failures will still be delivered during quiet hours.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
