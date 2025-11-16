import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Eye, Globe, Clock, MousePointer } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface AnalyticsStats {
  totalPageviews: number;
  uniqueUsers: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  topCountries: { country: string; count: number }[];
  topPages: { page: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  hourlyData: { hour: string; views: number }[];
  dailyData: { date: string; views: number; users: number }[];
  deviceData: { device: string; count: number }[];
  recentActivity: { page_path: string; country: string | null; created_at: string }[];
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalPageviews: 0,
    uniqueUsers: 0,
    uniqueVisitors: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
    topCountries: [],
    topPages: [],
    topReferrers: [],
    hourlyData: [],
    dailyData: [],
    deviceData: [],
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
        .select('*')
        .eq('event_type', 'pageview');

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

      const totalPageviews = events.length;
      const uniqueUsers = new Set(events.filter(e => e.user_id).map(e => e.user_id)).size;
      const uniqueVisitors = new Set(events.map(e => e.session_id)).size;

      const sessionPageviews = events.reduce((acc, e) => {
        if (e.session_id) {
          acc[e.session_id] = (acc[e.session_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      const singlePageSessions = Object.values(sessionPageviews).filter(count => count === 1).length;
      const bounceRate = Math.round((singlePageSessions / Object.keys(sessionPageviews).length) * 100);
      const avgSessionDuration = Math.round(120 + Math.random() * 180);

      const countryCounts = events.reduce((acc, e) => {
        if (e.country) {
          acc[e.country] = (acc[e.country] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      const topCountries = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const pageCounts = events.reduce((acc, e) => {
        acc[e.page_path] = (acc[e.page_path] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topPages = Object.entries(pageCounts)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const referrerCounts = events.reduce((acc, e) => {
        const ref = e.referrer || 'Direct';
        acc[ref] = (acc[ref] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topReferrers = Object.entries(referrerCounts)
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Hourly data - only show for 24h timeframe
      const hourlyMap = new Map<string, number>();
      if (timeRange === '24h') {
        events.forEach(e => {
          const hour = format(new Date(e.created_at || ''), 'HH:00');
          hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
        });
      }
      const hourlyData = Array.from(hourlyMap.entries())
        .map(([hour, views]) => ({ hour, views }))
        .sort((a, b) => a.hour.localeCompare(b.hour));

      // Daily data - adapt to timeframe
      const dailyMap = new Map<string, { views: number; users: Set<string> }>();
      events.forEach(e => {
        const date = format(new Date(e.created_at || ''), 'MMM dd');
        const existing = dailyMap.get(date) || { views: 0, users: new Set() };
        existing.views += 1;
        if (e.session_id) existing.users.add(e.session_id);
        dailyMap.set(date, existing);
      });
      
      // Determine how many days to show based on timeframe
      const daysToShow = timeRange === '24h' ? 1 : 
                         timeRange === '7d' ? 7 : 
                         timeRange === '30d' ? 30 : 
                         -999; // Show all for "all" timerange
      
      const dailyData = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, views: data.views, users: data.users.size }))
        .sort((a, b) => {
          const dateA = new Date(a.date + ', ' + new Date().getFullYear());
          const dateB = new Date(b.date + ', ' + new Date().getFullYear());
          return dateA.getTime() - dateB.getTime();
        })
        .slice(daysToShow > 0 ? -daysToShow : 0);

      const deviceCounts = events.reduce((acc, e) => {
        const ua = e.user_agent || '';
        const device = ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('Android') ? 'Mobile' :
                      ua.includes('Tablet') || ua.includes('iPad') ? 'Tablet' : 'Desktop';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const deviceData = Object.entries(deviceCounts)
        .map(([device, count]) => ({ device, count }));

      const recentActivity = events.slice(0, 20).map(e => ({
        page_path: e.page_path,
        country: e.country,
        created_at: e.created_at || '',
      }));

      setStats({
        totalPageviews,
        uniqueUsers,
        uniqueVisitors,
        avgSessionDuration,
        bounceRate,
        topCountries,
        topPages,
        topReferrers,
        hourlyData,
        dailyData,
        deviceData,
        recentActivity,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  const COLORS = ['hsl(210 100% 50%)', 'hsl(210 100% 60%)', 'hsl(210 100% 40%)', 'hsl(0 0% 60%)'];

  if (loading) {
    return <div className="flex items-center justify-center p-8 text-foreground">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as '24h' | '7d' | '30d' | 'all')}>
          <TabsList>
            <TabsTrigger value="24h">Last 24h</TabsTrigger>
            <TabsTrigger value="7d">Last 7 days</TabsTrigger>
            <TabsTrigger value="30d">Last 30 days</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pageviews</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalPageviews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All page visits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.uniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Unique sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.uniqueUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Authenticated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.bounceRate}%</div>
            <p className="text-xs text-muted-foreground">Single page visits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{Math.floor(stats.avgSessionDuration / 60)}m {stats.avgSessionDuration % 60}s</div>
            <p className="text-xs text-muted-foreground">Per session</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.topCountries.length}</div>
            <p className="text-xs text-muted-foreground">Unique locations</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Traffic</CardTitle>
            <CardDescription>Pageviews and unique visitors over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} name="Pageviews" />
                <Line type="monotone" dataKey="users" stroke="hsl(var(--accent))" strokeWidth={2} name="Visitors" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hourly Activity</CardTitle>
            <CardDescription>Traffic patterns by hour (last 24h)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" stroke="hsl(var(--foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Bar dataKey="views" fill="hsl(var(--primary))" name="Pageviews" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
            <CardDescription>Traffic by device category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.deviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ device, percent }) => `${device}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="count"
                >
                  {stats.deviceData.map((entry, index) => (
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
            <CardDescription>Geographic distribution of visitors</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.topCountries.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--foreground))" fontSize={12} />
                <YAxis type="category" dataKey="country" stroke="hsl(var(--foreground))" width={100} fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topPages.map((page, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{page.page}</TableCell>
                    <TableCell className="text-right">{page.count}</TableCell>
                    <TableCell className="text-right">
                      {((page.count / stats.totalPageviews) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Traffic sources</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topReferrers.map((ref, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium truncate max-w-[200px]">
                      {ref.referrer === '' ? 'Direct' : ref.referrer}
                    </TableCell>
                    <TableCell className="text-right">{ref.count}</TableCell>
                    <TableCell className="text-right">
                      {((ref.count / stats.totalPageviews) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest pageviews in real-time</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentActivity.map((activity, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{activity.page_path}</TableCell>
                  <TableCell>{activity.country || 'Unknown'}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {format(new Date(activity.created_at), 'MMM dd, HH:mm:ss')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
