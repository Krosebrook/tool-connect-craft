import { Layout } from '@/components/layout/Layout';
import { useConnectors } from '@/context/ConnectorContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { 
  Shield, 
  Key, 
  Trash2, 
  RefreshCw,
  AlertTriangle,
  Clock,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SecuritySettingsPage() {
  const { connections, disconnect } = useConnectors();
  const [revoking, setRevoking] = useState(false);
  
  const activeConnections = connections.filter(c => c.status === 'active');
  
  const handleRevokeAll = async () => {
    setRevoking(true);
    try {
      for (const conn of activeConnections) {
        await disconnect(conn.id);
      }
      toast({
        title: 'All connections revoked',
        description: 'All active connections have been disconnected.',
      });
    } finally {
      setRevoking(false);
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Security Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your security preferences, tokens, and session settings.
          </p>
        </div>
        
        <div className="space-y-6">
          {/* Token Management */}
          <div className="connector-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Key className="h-5 w-5 text-muted-foreground" />
              Token Management
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-default">
                      <div className="font-medium text-foreground">Active Connections</div>
                      <div className="text-sm text-muted-foreground">
                        {activeConnections.length} connector{activeConnections.length !== 1 ? 's' : ''} currently connected
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p>OAuth connections with valid access tokens</p></TooltipContent>
                </Tooltip>
                <AlertDialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={activeConnections.length === 0 || revoking}
                        >
                          {revoking ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Revoke All
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>Disconnect all active connectors at once</p></TooltipContent>
                  </Tooltip>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Revoke All Connections?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will disconnect all {activeConnections.length} active connection{activeConnections.length !== 1 ? 's' : ''}. 
                        You'll need to reconnect each service to use them again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRevokeAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Revoke All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-border">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-default">
                      <div className="font-medium text-foreground">Auto-refresh Tokens</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically refresh OAuth tokens before expiration
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p>When enabled, tokens are refreshed automatically before they expire to prevent disruptions</p></TooltipContent>
                </Tooltip>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between py-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-default">
                      <div className="font-medium text-foreground">Token Expiry Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Get notified when tokens are about to expire
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p>Sends alerts when a token is within 1 hour of expiration</p></TooltipContent>
                </Tooltip>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
          
          {/* Session Security */}
          <div className="connector-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Session Security
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-default">
                      <div className="font-medium text-foreground">Session Timeout</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically log out after 24 hours of inactivity
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p>Ends your session after 24 hours without any activity for added security</p></TooltipContent>
                </Tooltip>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between py-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-default">
                      <div className="font-medium text-foreground">Single Session Mode</div>
                      <div className="text-sm text-muted-foreground">
                        Only allow one active session at a time
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p>Signing in from another device will end the current session</p></TooltipContent>
                </Tooltip>
                <Switch />
              </div>
            </div>
          </div>
          
          {/* Privacy */}
          <div className="connector-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Privacy
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-default">
                      <div className="font-medium text-foreground">Hide Request Data in Logs</div>
                      <div className="text-sm text-muted-foreground">
                        Redact sensitive data from action logs
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p>Replaces request/response bodies with [REDACTED] in the audit log</p></TooltipContent>
                </Tooltip>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-border">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-default">
                      <div className="font-medium text-foreground">Log Retention</div>
                      <div className="text-sm text-muted-foreground">
                        Keep action logs for 30 days
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p>Action logs older than 30 days are automatically purged</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm">Configure</Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Change log retention period</p></TooltipContent>
                </Tooltip>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-default">
                      <div className="font-medium text-foreground">Export Data</div>
                      <div className="text-sm text-muted-foreground">
                        Download all your connection and log data
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p>Download a JSON export of all connections, logs, and settings</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm">Export</Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Generate and download data export</p></TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
          
          {/* Danger Zone */}
          <div className="connector-card p-6 border-destructive/50">
            <h2 className="text-lg font-semibold text-destructive mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-default">
                      <div className="font-medium text-foreground">Delete All Data</div>
                      <div className="text-sm text-muted-foreground">
                        Permanently delete all connections, logs, and settings
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p>⚠️ This action is irreversible — all data will be permanently erased</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Permanently remove all stored data</p></TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
