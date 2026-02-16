import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { CONNECTOR_CATEGORIES } from '@/types/seed-data';
import { Search, Grid3X3, List } from 'lucide-react';

interface ConnectorFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (value: 'grid' | 'list') => void;
}

export function ConnectorFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  viewMode,
  onViewModeChange,
}: ConnectorFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search connectors..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Filter connectors by name or description</p>
        </TooltipContent>
      </Tooltip>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
        {CONNECTOR_CATEGORIES.map((cat) => (
          <Tooltip key={cat.slug}>
            <TooltipTrigger asChild>
              <Button
                variant={category === cat.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange(cat.slug)}
                className="shrink-0"
              >
                {cat.name}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{cat.slug === 'all' ? 'Show all connectors' : `Show only ${cat.name} connectors`}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="flex items-center gap-1 border border-border rounded-lg p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => onViewModeChange('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Grid view — show connectors as cards</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => onViewModeChange('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>List view — show connectors in a compact list</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
