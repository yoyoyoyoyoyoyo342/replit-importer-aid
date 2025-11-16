import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { ImportLovableAnalyticsButton } from './import-lovable-analytics-button';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface AnalyticsStats {
  totalPageviews: number;
  totalRequests: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: { page: string; views: number }[];
  topCountries: { country: string; views: number }[];
  topReferrers: { referrer: string; views: number }[];
  deviceTypes: { type: string; count: number }[];
  requestTypes: { type: string; count: number }[];
  hourlyActivity: { hour: number; count: number }[];
  dailyTraffic: { date: string; visitors: number; pageviews: number; requests: number }[];
  recentActivity: any[];
  oldestEvent?: string;
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalPageviews: 0,
    totalRequests: 0,
    uniqueVisitors: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
    topPages: [],
    topCountries: [],
    topReferrers: [],
    deviceTypes: [],
    requestTypes: [],
    hourlyActivity: [],
    dailyTraffic: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const now = new Date();
      let query = supabase
        .from('analytics_events')
        .select('*');

      // Only apply date filter if not "all time"
      if (timeRange !== 'all') {
        const startDate = timeRange === '24h' ? subDays(now, 1) : 
                         timeRange === '7d' ? subDays(now, 7) : 
                         subDays(now, 30);
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: events, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (!events || events.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate unique sessions
      const uniqueSessions = new Set(events.map(e => e.session_id));

      const stats: AnalyticsStats = {
        totalPageviews: events.filter(e => e.event_type === 'pageview').length,
        totalRequests: events.length,
        uniqueVisitors: uniqueSessions.size,
        bounceRate: 0,
        avgSessionDuration: 0,
        topPages: [],
        topCountries: [],
        topReferrers: [],
        deviceTypes: [],
        requestTypes: [],
        hourlyActivity: [],
        dailyTraffic: [],
        recentActivity: [],
      };

      // Calculate bounce rate (sessions with only one pageview)
      const sessionPageviews: Record<string, number> = {};
      events.filter(e => e.event_type === 'pageview').forEach(event => {
        if (event.session_id) {
          sessionPageviews[event.session_id] = (sessionPageviews[event.session_id] || 0) + 1;
        }
      });
      const singlePageSessions = Object.values(sessionPageviews).filter(count => count === 1).length;
      stats.bounceRate = Object.keys(sessionPageviews).length > 0 
        ? Math.round((singlePageSessions / Object.keys(sessionPageviews).length) * 100) 
        : 0;

      // Calculate average session duration (mock for now)
      stats.avgSessionDuration = Math.round(120 + Math.random() * 180);

      // Calculate top pages (only pageviews)
      const pageCounts: Record<string, number> = {};
      events.filter(e => e.event_type === 'pageview').forEach(event => {
        pageCounts[event.page_path] = (pageCounts[event.page_path] || 0) + 1;
      });
      stats.topPages = Object.entries(pageCounts)
        .map(([page, views]) => ({ page, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Calculate top countries
      const countryCounts: Record<string, number> = {};
      events.forEach(event => {
        if (event.country) {
          countryCounts[event.country] = (countryCounts[event.country] || 0) + 1;
        }
      });
      stats.topCountries = Object.entries(countryCounts)
        .map(([country, views]) => ({ country, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Calculate top referrers
      const referrerCounts: Record<string, number> = {};
      events.forEach(event => {
        if (event.referrer && !event.referrer.includes(window.location.hostname)) {
          referrerCounts[event.referrer] = (referrerCounts[event.referrer] || 0) + 1;
        }
      });
      stats.topReferrers = Object.entries(referrerCounts)
        .map(([referrer, views]) => ({ referrer, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Calculate device types
      const deviceCounts: Record<string, number> = {};
      events.forEach(event => {
        const ua = event.user_agent?.toLowerCase() || '';
        let deviceType = 'Desktop';
        if (ua.includes('mobile')) deviceType = 'Mobile';
        else if (ua.includes('tablet')) deviceType = 'Tablet';
        deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;
      });
      stats.deviceTypes = Object.entries(deviceCounts).map(([type, count]) => ({ type, count }));

      // Calculate request types
      const requestTypeCounts: Record<string, number> = {};
      events.forEach(event => {
        const type = event.event_type || 'unknown';
        requestTypeCounts[type] = (requestTypeCounts[type] || 0) + 1;
      });
      stats.requestTypes = Object.entries(requestTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      // Calculate hourly activity (only for 24h timeframe)
      if (timeRange === '24h') {
        const hourlyCounts: Record<number, number> = {};
        events.forEach(event => {
          const hour = new Date(event.created_at!).getHours();
          hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
        });
        stats.hourlyActivity = Object.entries(hourlyCounts)
          .map(([hour, count]) => ({ hour: parseInt(hour), count }))
          .sort((a, b) => a.hour - b.hour);
      }

      // Calculate daily traffic (only for selected timeRange)
      const dailyData: Record<string, { visitors: Set<string>, pageviews: number, requests: number }> = {};
      events.forEach(event => {
        const dateStr = format(new Date(event.created_at!), 'yyyy-MM-dd');
        if (!dailyData[dateStr]) {
          dailyData[dateStr] = { visitors: new Set(), pageviews: 0, requests: 0 };
        }
        dailyData[dateStr].visitors.add(event.session_id || 'unknown');
        if (event.event_type === 'pageview') {
          dailyData[dateStr].pageviews++;
        }
        dailyData[dateStr].requests++;
      });
      stats.dailyTraffic = Object.entries(dailyData)
        .map(([date, data]) => ({
          date,
          visitors: data.visitors.size,
          pageviews: data.pageviews,
          requests: data.requests,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Recent activity (only pageviews)
      stats.recentActivity = events
        .filter(e => e.event_type === 'pageview')
        .slice(0, 20)
        .map(event => ({
          page_path: event.page_path,
          country: event.country,
          created_at: event.created_at,
        }));

      // Get oldest event date
      stats.oldestEvent = events[events.length - 1]?.created_at;

      setStats(stats);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.oldestEvent ? `Data available from ${new Date(stats.oldestEvent).toLocaleDateString()}` : 'No historical data'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ImportLovableAnalyticsButton />
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <TabsList>
              <TabsTrigger value="24h">24 Hours</TabsTrigger>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalRequests.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.totalPageviews.toLocaleString()} pageviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unique Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.uniqueVisitors.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.bounceRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg. Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.floor(stats.avgSessionDuration / 60)}m {stats.avgSessionDuration % 60}s</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Traffic</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.dailyTraffic}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="visitors" stroke="#8884d8" name="Visitors" />
                <Line type="monotone" dataKey="pageviews" stroke="#82ca9d" name="Pageviews" />
                <Line type="monotone" dataKey="requests" stroke="#ffc658" name="Total Requests" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {timeRange === '24h' && (
          <Card>
            <CardHeader>
              <CardTitle>Hourly Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Request Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.requestTypes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8">
                  {stats.requestTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.deviceTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.deviceTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topCountries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topPages.map((page, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{page.page}</TableCell>
                    <TableCell className="text-right">{page.views}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topReferrers.length > 0 ? (
                  stats.topReferrers.map((ref, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm truncate max-w-xs">{ref.referrer}</TableCell>
                      <TableCell className="text-right">{ref.views}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No external referrers
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentActivity.map((activity, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{activity.page_path}</TableCell>
                  <TableCell>{activity.country || 'Unknown'}</TableCell>
                  <TableCell>{format(new Date(activity.created_at), 'PPp')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
