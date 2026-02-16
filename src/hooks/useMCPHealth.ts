import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MCPHealthResult {
  connectorId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  latencyMs: number | null;
  checkedAt: string | null;
}

type HealthMap = Record<string, MCPHealthResult>;

export function useMCPHealth(connectorIds: string[]) {
  const [healthMap, setHealthMap] = useState<HealthMap>({});
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    if (connectorIds.length === 0) return;
    setIsChecking(true);

    try {
      const { data, error } = await supabase.functions.invoke('health-check');

      if (error || !data?.success) {
        console.warn('Health check failed:', error || data?.error);
        return;
      }

      const results: MCPHealthResult[] = (data.results || []).map(
        (r: { connectorId: string; status: string; mcpServer?: { latencyMs: number | null }; checkedAt: string }) => ({
          connectorId: r.connectorId,
          status: r.status as MCPHealthResult['status'],
          latencyMs: r.mcpServer?.latencyMs ?? null,
          checkedAt: r.checkedAt,
        })
      );

      const map: HealthMap = {};
      for (const r of results) {
        map[r.connectorId] = r;
      }
      setHealthMap(map);
    } catch (err) {
      console.warn('Health check error:', err);
    } finally {
      setIsChecking(false);
    }
  }, [connectorIds.join(',')]);

  useEffect(() => {
    checkHealth();
    // Refresh every 60 seconds
    const interval = setInterval(checkHealth, 60_000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const getHealth = (connectorId: string): MCPHealthResult => {
    return healthMap[connectorId] || {
      connectorId,
      status: 'unknown',
      latencyMs: null,
      checkedAt: null,
    };
  };

  return { healthMap, getHealth, isChecking, refetch: checkHealth };
}
