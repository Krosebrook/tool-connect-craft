import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
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
  
  const [minute, hour] = parts;
  
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
      await supabase
        .from('scheduler_jobs')
        .update({ 
          last_run_at: new Date().toISOString(),
          last_status: 'running',
        })
        .eq('id', job.id);

      const { error } = await supabase.functions.invoke(job.function_name);

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
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-default">
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
            </TooltipTrigger>
            <TooltipContent><p>Total number of configured scheduled jobs</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-default">
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
            </TooltipTrigger>
            <TooltipContent><p>Jobs that are currently enabled and running on schedule</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-default">
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
            </TooltipTrigger>
            <TooltipContent><p>Cumulative execution count across all jobs</p></TooltipContent>
          </Tooltip>
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={fetchJobs}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Reload the latest job status from the database</p></TooltipContent>
              </Tooltip>
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="space-y-1 cursor-default">
                              <div className="font-mono text-sm">{job.schedule}</div>
                              <div className="text-xs text-muted-foreground">
                                {parseSchedule(job.schedule)}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>Cron expression: {job.schedule}</p></TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {job.last_run_at ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="space-y-1 cursor-default">
                                <div className="text-sm">
                                  {formatDistanceToNow(new Date(job.last_run_at), { addSuffix: true })}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(job.last_run_at), 'MMM d, HH:mm')}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent><p>Last execution timestamp</p></TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {job.last_status === 'success' ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className="bg-success/20 text-success border-success/30 cursor-default">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Success
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent><p>Last execution completed without errors</p></TooltipContent>
                          </Tooltip>
                        ) : job.last_status === 'failed' ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="destructive" className="cursor-default">
                                <XCircle className="h-3 w-3 mr-1" />
                                Failed
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent><p>{job.last_error || 'Last execution failed — check error details below'}</p></TooltipContent>
                          </Tooltip>
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="font-mono cursor-default">{job.run_count}</span>
                          </TooltipTrigger>
                          <TooltipContent><p>Total number of times this job has been executed</p></TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
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
                            </TooltipTrigger>
                            <TooltipContent><p>Run this job immediately</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Switch
                                  checked={job.is_active}
                                  onCheckedChange={() => toggleJob(job)}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent><p>{job.is_active ? 'Pause this job' : 'Resume this job'}</p></TooltipContent>
                          </Tooltip>
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
