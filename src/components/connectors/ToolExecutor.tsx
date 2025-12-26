import { ConnectorTool, ToolSchemaProperty } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';

interface ToolExecutorProps {
  tool: ConnectorTool;
  onExecute: (args: Record<string, unknown>) => Promise<void>;
  isExecuting?: boolean;
}

export function ToolExecutor({ tool, onExecute, isExecuting }: ToolExecutorProps) {
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onExecute(formValues);
  };
  
  const updateValue = (key: string, value: unknown) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };
  
  const properties = tool.schema.properties || {};
  const required = tool.schema.required || [];
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {Object.entries(properties).map(([key, prop]) => (
          <ToolField
            key={key}
            name={key}
            property={prop}
            value={formValues[key]}
            onChange={(value) => updateValue(key, value)}
            required={required.includes(key)}
          />
        ))}
      </div>
      
      {Object.keys(properties).length === 0 && (
        <div className="text-sm text-muted-foreground py-4 text-center">
          This tool has no input parameters.
        </div>
      )}
      
      <Button 
        type="submit" 
        variant="glow" 
        className="w-full gap-2"
        disabled={isExecuting}
      >
        {isExecuting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Executing...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Execute Tool
          </>
        )}
      </Button>
    </form>
  );
}

interface ToolFieldProps {
  name: string;
  property: ToolSchemaProperty;
  value: unknown;
  onChange: (value: unknown) => void;
  required: boolean;
}

function ToolField({ name, property, value, onChange, required }: ToolFieldProps) {
  const label = (
    <Label className="flex items-center gap-1">
      {formatFieldName(name)}
      {required && <span className="text-destructive">*</span>}
    </Label>
  );
  
  // Enum select
  if (property.enum) {
    return (
      <div className="space-y-2">
        {label}
        <Select value={value as string || ''} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${formatFieldName(name)}`} />
          </SelectTrigger>
          <SelectContent>
            {property.enum.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {property.description && (
          <p className="text-xs text-muted-foreground">{property.description}</p>
        )}
      </div>
    );
  }
  
  // Boolean switch
  if (property.type === 'boolean') {
    return (
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          {label}
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
        </div>
        <Switch
          checked={value as boolean || false}
          onCheckedChange={onChange}
        />
      </div>
    );
  }
  
  // Number input
  if (property.type === 'number') {
    return (
      <div className="space-y-2">
        {label}
        <Input
          type="number"
          value={value as number || property.default as number || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          placeholder={property.description}
        />
        {property.description && (
          <p className="text-xs text-muted-foreground">{property.description}</p>
        )}
      </div>
    );
  }
  
  // Long text - textarea
  if (name.toLowerCase().includes('body') || name.toLowerCase().includes('content') || name.toLowerCase().includes('message')) {
    return (
      <div className="space-y-2">
        {label}
        <Textarea
          value={value as string || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={property.description}
          rows={4}
        />
        {property.description && (
          <p className="text-xs text-muted-foreground">{property.description}</p>
        )}
      </div>
    );
  }
  
  // Default: string input
  return (
    <div className="space-y-2">
      {label}
      <Input
        type="text"
        value={value as string || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={property.description}
      />
      {property.description && (
        <p className="text-xs text-muted-foreground">{property.description}</p>
      )}
    </div>
  );
}

function formatFieldName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
