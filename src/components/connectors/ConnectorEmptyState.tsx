import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus, Server, MessageSquare, Zap, Code2, HardDrive, Database, Puzzle } from 'lucide-react';

interface ConnectorEmptyStateProps {
  category: string;
  onResetCategory: () => void;
}

const EMPTY_STATES: Record<string, { icon: React.ComponentType<{ className?: string }>; title: string; description: string; showBrowse?: boolean }> = {
  mcp: {
    icon: Server,
    title: 'No MCP servers registered yet',
    description: 'Register your first MCP-compatible server to discover its tools and make them available to your team.',
    showBrowse: true,
  },
  communication: {
    icon: MessageSquare,
    title: 'No communication connectors found',
    description: 'Connect messaging platforms like Slack or Gmail to send messages and manage communications.',
    showBrowse: true,
  },
  productivity: {
    icon: Zap,
    title: 'No productivity connectors found',
    description: 'Integrate tools like Notion or Airtable to streamline your workflows and boost productivity.',
    showBrowse: true,
  },
  development: {
    icon: Code2,
    title: 'No development connectors found',
    description: 'Connect platforms like GitHub or Vercel to manage code, deployments, and CI/CD pipelines.',
    showBrowse: true,
  },
  storage: {
    icon: HardDrive,
    title: 'No storage connectors found',
    description: 'Add cloud storage integrations like Google Drive to access and manage your files.',
    showBrowse: true,
  },
  database: {
    icon: Database,
    title: 'No database connectors found',
    description: 'Connect database tools like Airtable to query, create, and manage your structured data.',
    showBrowse: true,
  },
  custom: {
    icon: Puzzle,
    title: 'No custom connectors found',
    description: 'Register custom integrations via API keys or MCP protocol to extend your toolset.',
    showBrowse: true,
  },
};

export function ConnectorEmptyState({ category, onResetCategory }: ConnectorEmptyStateProps) {
  const state = EMPTY_STATES[category];

  if (!state) {
    return (
      <div key={category} className="text-center py-16 space-y-4 animate-fade-in">
        <p className="text-muted-foreground">No connectors found matching your criteria.</p>
      </div>
    );
  }

  const IconComponent = state.icon;

  return (
    <div key={category} className="text-center py-16 space-y-4 animate-fade-in">
      <IconComponent className="h-12 w-12 text-muted-foreground/50 mx-auto" />
      <h3 className="text-lg font-semibold text-foreground">{state.title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto">{state.description}</p>
      <div className="flex items-center justify-center gap-3 mt-2">
        {category === 'mcp' && (
          <Button asChild variant="glow" className="gap-2">
            <Link to="/connectors/add-mcp">
              <Plus className="h-4 w-4" />
              Register MCP Server
            </Link>
          </Button>
        )}
        {state.showBrowse && (
          <Button variant="outline" className="gap-2" onClick={onResetCategory}>
            Browse All Connectors
          </Button>
        )}
      </div>
    </div>
  );
}
