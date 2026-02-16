import { cn } from '@/lib/utils';
import { 
  Mail, 
  HardDrive, 
  StickyNote, 
  Github, 
  MessageSquare, 
  Table2, 
  Triangle, 
  Puzzle,
  Globe,
  Server,
  Calendar,
  ShoppingCart,
  Headphones,
  BarChart3,
  Users,
  ClipboardList,
} from 'lucide-react';

interface ConnectorIconProps {
  slug: string;
  name: string;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'google-gmail': Mail,
  'google-drive': HardDrive,
  'google-calendar': Calendar,
  'notion': StickyNote,
  'github': Github,
  'slack': MessageSquare,
  'airtable': Table2,
  'vercel': Triangle,
  'custom-mcp': Puzzle,
  'hubspot': Users,
  'salesforce': BarChart3,
  'zendesk': Headphones,
  'shopify': ShoppingCart,
  'jira': ClipboardList,
};

const colorMap: Record<string, string> = {
  'google-gmail': 'text-red-400 bg-red-400/10',
  'google-drive': 'text-blue-400 bg-blue-400/10',
  'google-calendar': 'text-blue-500 bg-blue-500/10',
  'notion': 'text-foreground bg-foreground/10',
  'github': 'text-foreground bg-foreground/10',
  'slack': 'text-purple-400 bg-purple-400/10',
  'airtable': 'text-yellow-400 bg-yellow-400/10',
  'vercel': 'text-foreground bg-foreground/10',
  'custom-mcp': 'text-primary bg-primary/10',
  'hubspot': 'text-orange-400 bg-orange-400/10',
  'salesforce': 'text-sky-400 bg-sky-400/10',
  'zendesk': 'text-emerald-400 bg-emerald-400/10',
  'shopify': 'text-green-500 bg-green-500/10',
  'jira': 'text-blue-500 bg-blue-500/10',
};

export function ConnectorIcon({ slug, name, className }: ConnectorIconProps) {
  const isMcp = !iconMap[slug] && slug !== 'custom-mcp';
  const Icon = iconMap[slug] || (isMcp ? Server : Globe);
  const colors = colorMap[slug] || (isMcp ? 'text-primary bg-primary/10' : 'text-muted-foreground bg-muted');
  
  return (
    <div 
      className={cn(
        'flex items-center justify-center rounded-lg p-2',
        colors,
        className
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}
