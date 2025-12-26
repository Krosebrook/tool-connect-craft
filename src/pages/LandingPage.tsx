import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Plug2, 
  Zap, 
  Shield, 
  Activity,
  ArrowRight,
  Code2,
  Database,
  Lock
} from 'lucide-react';

export default function LandingPage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-primary/10 via-transparent to-transparent" />
        
        <div className="relative container mx-auto max-w-7xl px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-8">
              <Zap className="h-4 w-4" />
              <span>Model Context Protocol Ready</span>
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="text-foreground">Connect. Execute.</span>
              <br />
              <span className="text-gradient">Automate.</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              A production-grade connector hub for integrating services via OAuth, 
              API keys, and MCP servers. Real-time pipelines, audit logs, and 
              enterprise security built-in.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="glow" size="xl" asChild>
                <Link to="/connectors" className="gap-2">
                  Browse Connectors
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/dashboard">
                  View Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Grid */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Enterprise-Grade Integration Platform
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to connect, manage, and monitor your service integrations.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Plug2}
              title="Universal Connectors"
              description="OAuth 2.0 + PKCE, API keys, and MCP protocol support. Connect to any service."
            />
            <FeatureCard
              icon={Code2}
              title="Tool Discovery"
              description="Automatically discover and execute tools from connected services and MCP servers."
            />
            <FeatureCard
              icon={Activity}
              title="Real-time Pipelines"
              description="Live job status, event streaming, and instant feedback on every operation."
            />
            <FeatureCard
              icon={Database}
              title="Audit Logging"
              description="Complete audit trail for every action. Request/response logging with latency tracking."
            />
            <FeatureCard
              icon={Shield}
              title="Security First"
              description="Encrypted secrets, RLS policies, rate limiting, and circuit breakers."
            />
            <FeatureCard
              icon={Lock}
              title="Token Management"
              description="Automatic token refresh, revocation support, and secure secret storage."
            />
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-16 border-t border-border bg-muted/20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value="8+" label="Connectors" />
            <StatCard value="20+" label="Tools" />
            <StatCard value="100%" label="Type-safe" />
            <StatCard value="<50ms" label="Latency" />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to integrate?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Start connecting your services in minutes. OAuth flows, tool execution, 
            and real-time monitoring out of the box.
          </p>
          <Button variant="glow" size="xl" asChild>
            <Link to="/connectors" className="gap-2">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  description: string;
}) {
  return (
    <div className="connector-card p-6 group">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
