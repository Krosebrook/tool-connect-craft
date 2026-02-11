import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { format, subDays, startOfDay, isAfter } from 'date-fns';

interface WebhookDelivery {
  id: string;
  status: string;
  created_at: string;
}

interface DeliveryStatsChartProps {
  deliveries: WebhookDelivery[];
}

export function DeliveryStatsChart({ deliveries }: DeliveryStatsChartProps) {
  const chartData = useMemo(() => {
    const days = 7;
    const now = new Date();
    const cutoff = startOfDay(subDays(now, days - 1));

    // Initialize buckets
    const buckets: Record<string, { date: string; delivered: number; failed: number; pending: number }> = {};
    for (let i = 0; i < days; i++) {
      const day = startOfDay(subDays(now, days - 1 - i));
      const key = format(day, 'yyyy-MM-dd');
      buckets[key] = { date: format(day, 'MMM d'), delivered: 0, failed: 0, pending: 0 };
    }

    // Fill buckets
    deliveries.forEach(d => {
      const created = new Date(d.created_at);
      if (!isAfter(created, subDays(cutoff, 1))) return;
      const key = format(startOfDay(created), 'yyyy-MM-dd');
      if (!buckets[key]) return;
      if (d.status === 'delivered') buckets[key].delivered++;
      else if (d.status === 'failed') buckets[key].failed++;
      else buckets[key].pending++;
    });

    return Object.values(buckets);
  }, [deliveries]);

  const totalDelivered = chartData.reduce((s, d) => s + d.delivered, 0);
  const totalFailed = chartData.reduce((s, d) => s + d.failed, 0);
  const total = totalDelivered + totalFailed;
  const successRate = total > 0 ? Math.round((totalDelivered / total) * 100) : 0;

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Delivery Stats
            </CardTitle>
            <CardDescription>
              Success/failure rates over the last 7 days
              {total > 0 && (
                <span className="ml-2 text-success font-medium">
                  {successRate}% success rate
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No delivery data yet</p>
            <p className="text-sm">Stats will appear once webhooks start firing</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 32%, 18%)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(217, 32%, 18%)' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222, 47%, 10%)',
                  border: '1px solid hsl(217, 32%, 18%)',
                  borderRadius: '8px',
                  color: 'hsl(210, 20%, 95%)',
                  fontSize: 13,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: 'hsl(215, 20%, 55%)' }}
              />
              <Bar dataKey="delivered" name="Delivered" fill="hsl(142, 76%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" name="Failed" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill="hsl(215, 20%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
