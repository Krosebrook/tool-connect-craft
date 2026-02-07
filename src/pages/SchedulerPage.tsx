import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Clock, 
  Play, 
  Pause, 
  RefreshCw, 
  Calendar,
  CheckCircle2,
  XCircle,
  Timer,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';

interface SchedulerJob {
  id: string;
  name: string;
  description: string | null;
  schedule: string;
  function_name: string;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  run_count: number;
  created_at: string;
}

function parseSchedule(schedule: string): string {
  const parts = schedule.split(' ');
  if (parts.length !== 5) return schedule;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  if (minute.startsWith('*/')) {
    const interval = minute.substring(2);
    return `Every ${interval} minute${interval !== '1' ? 's' : ''}`;
  }
  
  if (minute === '0' && hour === '*') {
    return 'Every hour';
  }
  
  if (minute === '0' && hour === '0') {
    return 'Daily at midnight';
  }
  
  return schedule;
}

export default function SchedulerPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<SchedulerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState<string | null>(null);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('scheduler_jobs')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching scheduler jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scheduler jobs',
        variant: 'destructive',
      });
      return;
    }

    setJobs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('scheduler-jobs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scheduler_jobs' },
        () => fetchJobs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleJob = async (job: SchedulerJob) => {
    const { error } = await supabase
      .from('scheduler_jobs')
      .update({ is_active: !job.is_active })
      .eq('id', job.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update job status',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: job.is_active ? 'Job Paused' : 'Job Resumed',
      description: `${job.name} has been ${job.is_active ? 'paused' : 'resumed'}`,
    });

    fetchJobs();
  };

  const runJobNow = async (job: SchedulerJob) => {
    setRunningJob(job.id);

    try {
      // Update job status
      await supabase
        .from('scheduler_jobs')
        .update({ 
          last_run_at: new Date().toISOString(),
          last_status: 'running',
        })
        .eq('id', job.id);

      // Call the edge function
      const { error } = await supabase.functions.invoke(job.function_name);

      // Update job with result
      await supabase
        .from('scheduler_jobs')
        .update({
          last_status: error ? 'failed' : 'success',
          last_error: error?.message || null,
          run_count: job.run_count + 1,
        })
        .eq('id', job.id);

      if (error) {
        toast({
          title: 'Job Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Job Completed',
          description: `${job.name} ran successfully`,
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to run job',
        variant: 'destructive',
      });
    } finally {
      setRunningJob(null);
      fetchJobs();
    }
  };

  const activeJobs = jobs.filter(j => j.is_active).length;
  const totalRuns = jobs.reduce((sum, j) => sum + j.run_count, 0);

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Scheduler</h1>
          <p className="text-muted-foreground">
            Manage automated background jobs and cron schedules.
          </p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                  <p className="text-2xl font-bold">{jobs.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                  <p className="text-2xl font-bold text-success">{activeJobs}</p>
                </div>
                <Zap className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Runs</p>
                  <p className="text-2xl font-bold">{totalRuns}</p>
                </div>
                <Timer className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Scheduled Jobs
                </CardTitle>
                <CardDescription>
                  View and manage automated background tasks
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchJobs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading scheduler jobs...
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No scheduled jobs configured
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Runs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium flex items-center gap-2">
                            {job.name}
                            {!job.is_active && (
                              <Badge variant="secondary">Paused</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {job.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-mono text-sm">{job.schedule}</div>
                          <div className="text-xs text-muted-foreground">
                            {parseSchedule(job.schedule)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.last_run_at ? (
                          <div className="space-y-1">
                            <div className="text-sm">
                              {formatDistanceToNow(new Date(job.last_run_at), { addSuffix: true })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(job.last_run_at), 'MMM d, HH:mm')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {job.last_status === 'success' ? (
                          <Badge className="bg-success/20 text-success border-success/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Success
                          </Badge>
                        ) : job.last_status === 'failed' ? (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        ) : job.last_status === 'running' ? (
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Running
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{job.run_count}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runJobNow(job)}
                            disabled={runningJob === job.id}
                          >
                            {runningJob === job.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Switch
                            checked={job.is_active}
                            onCheckedChange={() => toggleJob(job)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Error Details */}
        {jobs.some(j => j.last_error) && (
          <Card className="mt-6 border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Recent Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {jobs
                  .filter(j => j.last_error)
                  .map((job) => (
                    <div key={job.id} className="p-3 bg-destructive/10 rounded-lg">
                      <div className="font-medium text-sm">{job.name}</div>
                      <div className="text-sm text-muted-foreground mt-1 font-mono">
                        {job.last_error}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
