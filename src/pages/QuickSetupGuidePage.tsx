import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen,
  Store,
  Download,
  Key,
  Link2,
  Copy,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Server,
  Shield,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabaseConfig } from '@/lib/config';

const STEPS = [
  {
    id: 1,
    title: 'Install a Connector',
    subtitle: 'Pick a service you already use',
    icon: Store,
    color: 'text-primary bg-primary/10',
    content: InstallStep,
  },
  {
    id: 2,
    title: 'Connect Your Account',
    subtitle: 'Link your service credentials',
    icon: Link2,
    color: 'text-blue-400 bg-blue-400/10',
    content: ConnectStep,
  },
  {
    id: 3,
    title: 'Get Your MCP URL',
    subtitle: 'Generate your personal endpoint',
    icon: Key,
    color: 'text-amber-400 bg-amber-400/10',
    content: ApiKeyStep,
  },
  {
    id: 4,
    title: 'Add to Your AI Assistant',
    subtitle: 'Paste into Claude, ChatGPT, or Cursor',
    icon: MessageSquare,
    color: 'text-emerald-400 bg-emerald-400/10',
    content: ConfigureAIStep,
  },
];

function InstallStep() {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground leading-relaxed">
        Head to the <strong>Marketplace</strong> and pick a service you already use — like Slack, Gmail, GitHub, or HubSpot. 
        Click <strong>Install</strong> and it's added to your hub in seconds.
      </p>

      <Card className="border-dashed">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Popular first picks</p>
              <p className="text-sm text-muted-foreground">Most users start with one of these:</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Slack', 'Gmail', 'GitHub', 'Notion', 'HubSpot', 'Google Calendar'].map(name => (
              <Badge key={name} variant="secondary" className="text-sm py-1 px-3">{name}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button asChild variant="glow" className="w-full sm:w-auto">
        <Link to="/marketplace">
          <Store className="h-4 w-4" />
          Open Marketplace
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function ConnectStep() {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground leading-relaxed">
        After installing, go to <strong>Connectors</strong> and click on the service you just added. 
        Hit <strong>Connect</strong> to link your account. For OAuth services (Google, Slack, GitHub), 
        you'll be redirected to sign in. For API key services (HubSpot, Shopify), you'll paste your key.
      </p>

      <Card className="border-dashed">
        <CardContent className="p-5 space-y-3">
          <p className="font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Your credentials are safe
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              Tokens are encrypted and never exposed in the UI
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              You can revoke access anytime from the Connections page
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              OAuth tokens are automatically refreshed before they expire
            </li>
          </ul>
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="w-full sm:w-auto">
        <Link to="/connectors">
          View My Connectors
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function ApiKeyStep() {
  const mcpUrl = `${supabaseConfig.url}/functions/v1/mcp-server`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground leading-relaxed">
        Go to <strong>MCP Endpoint</strong> in settings. Click <strong>"Generate API Key"</strong> to create your personal key. 
        Copy both the <strong>API key</strong> (shown only once!) and the <strong>MCP URL</strong> below.
      </p>

      <Card className="border-dashed">
        <CardContent className="p-5 space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Your MCP Endpoint URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-lg font-mono break-all">
                {mcpUrl}
              </code>
              <Button size="icon-sm" variant="ghost" onClick={() => handleCopy(mcpUrl)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-sm text-warning-foreground">
            <strong>⚠️ Important:</strong> Save your API key immediately after generating it. 
            It's only shown once and cannot be retrieved later.
          </div>
        </CardContent>
      </Card>

      <Button asChild variant="glow" className="w-full sm:w-auto">
        <Link to="/settings/mcp-endpoint">
          <Key className="h-4 w-4" />
          Go to MCP Endpoint Settings
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function ConfigureAIStep() {
  const mcpUrl = `${supabaseConfig.url}/functions/v1/mcp-server`;
  const [selectedClient, setSelectedClient] = useState<'claude' | 'cursor' | 'chatgpt'>('claude');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const configs: Record<string, { label: string; snippet: string; instructions: string }> = {
    claude: {
      label: 'Claude Desktop',
      snippet: JSON.stringify({
        mcpServers: {
          "mcp-hub": {
            url: mcpUrl,
            headers: {
              Authorization: "Bearer YOUR_API_KEY_HERE"
            }
          }
        }
      }, null, 2),
      instructions: 'Open Claude Desktop → Settings → Developer → Edit Config → paste the snippet below and replace YOUR_API_KEY_HERE with your actual key.',
    },
    cursor: {
      label: 'Cursor',
      snippet: JSON.stringify({
        mcpServers: {
          "mcp-hub": {
            url: mcpUrl,
            headers: {
              Authorization: "Bearer YOUR_API_KEY_HERE"
            }
          }
        }
      }, null, 2),
      instructions: 'Open Cursor → Settings → MCP → Add new MCP server → paste the snippet below and replace YOUR_API_KEY_HERE.',
    },
    chatgpt: {
      label: 'ChatGPT / Copilot',
      snippet: `MCP URL: ${mcpUrl}\nAuthorization: Bearer YOUR_API_KEY_HERE`,
      instructions: 'ChatGPT and Copilot MCP support varies. Use the URL and Bearer token below wherever your AI client supports adding an MCP server.',
    },
  };

  const active = configs[selectedClient];

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground leading-relaxed">
        Pick your AI assistant below and follow the instructions. Once configured, your AI will be able to 
        use <strong>all the tools</strong> from every service you've connected — through a single URL.
      </p>

      {/* Client selector */}
      <div className="flex gap-2">
        {Object.entries(configs).map(([key, val]) => (
          <Button
            key={key}
            variant={selectedClient === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedClient(key as 'claude' | 'cursor' | 'chatgpt')}
            className="rounded-full"
          >
            {val.label}
          </Button>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">{active.instructions}</p>
          <div className="relative">
            <pre className="text-sm bg-muted p-4 rounded-lg font-mono overflow-x-auto whitespace-pre-wrap break-all">
              {active.snippet}
            </pre>
            <Button
              size="icon-sm"
              variant="ghost"
              className="absolute top-2 right-2"
              onClick={() => handleCopy(active.snippet)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">You're all set! 🎉</p>
              <p className="text-sm text-muted-foreground">
                Your AI assistant can now use all the tools from your connected services. 
                Try asking it to "list my Slack channels" or "create a GitHub issue" — it'll work through your hub automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function QuickSetupGuidePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const StepContent = STEPS[currentStep].content;

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Quick Setup Guide</h1>
              <p className="text-muted-foreground">
                Connect a service and get your AI assistant talking to it in under 5 minutes.
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex-1 flex items-center gap-1">
              <div
                className={cn(
                  'h-1.5 rounded-full flex-1 transition-colors',
                  i <= currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            </div>
          ))}
        </div>

        {/* Step navigator (horizontal) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(i)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                i === currentStep
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/30 hover:bg-muted/50'
              )}
            >
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', step.color)}>
                <step.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className={cn('text-sm font-medium truncate', i === currentStep ? 'text-foreground' : 'text-muted-foreground')}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground truncate hidden sm:block">{step.subtitle}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Step content */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="font-mono text-xs">Step {currentStep + 1} of {STEPS.length}</Badge>
            </div>
            <CardTitle className="text-xl">{STEPS[currentStep].title}</CardTitle>
            <CardDescription>{STEPS[currentStep].subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <StepContent />
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              Next Step
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button asChild variant="glow">
              <Link to="/marketplace">
                <Sparkles className="h-4 w-4" />
                Start Adding Services
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}
