import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Eye, Globe, Activity } from 'lucide-react';

interface AnalyticsStats {
  totalPageviews: number;
  uniqueUsers: number;
  uniqueVisitors: number;
  countryStats: { country: string; count: number }[];
  topPages: { page: string; count: number }[];
  recentActivity: Array<{
    page_path: string;
    country: string | null;
    created_at: string;
  }>;
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalPageviews: 0,
    uniqueUsers: 0,
    uniqueVisitors: 0,
    countryStats: [],
    topPages: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      // Get all pageview events
      const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'pageview')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      const allEvents = events || [];

      // Calculate stats
      const totalPageviews = allEvents.length;
      
      // Unique authenticated users
      const uniqueUsers = new Set(
        allEvents.filter(e => e.user_id).map(e => e.user_id)
      ).size;

      // Unique visitors (by session_id)
      const uniqueVisitors = new Set(
        allEvents.map(e => e.session_id)
      ).size;

      // Country stats
      const countryMap = new Map<string, number>();
      allEvents.forEach(event => {
        if (event.country) {
          countryMap.set(event.country, (countryMap.get(event.country) || 0) + 1);
        }
      });
      const countryStats = Array.from(countryMap.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top pages
      const pageMap = new Map<string, number>();
      allEvents.forEach(event => {
        pageMap.set(event.page_path, (pageMap.get(event.page_path) || 0) + 1);
      });
      const topPages = Array.from(pageMap.entries())
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Recent activity
      const recentActivity = allEvents.slice(0, 20).map(e => ({
        page_path: e.page_path,
        country: e.country,
        created_at: e.created_at,
      }));

      setStats({
        totalPageviews,
        uniqueUsers,
        uniqueVisitors,
        countryStats,
        topPages,
        recentActivity,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pageviews</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPageviews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">By session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Authenticated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.countryStats.length}</div>
            <p className="text-xs text-muted-foreground">Unique locations</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Pages */}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topPages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.topPages.map((page, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{page.page}</TableCell>
                      <TableCell className="text-right">{page.count.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Countries */}
        <Card>
          <CardHeader>
            <CardTitle>Top Countries</CardTitle>
            <CardDescription>Visitors by location</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.countryStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.countryStats.map((stat, i) => (
                    <TableRow key={i}>
                      <TableCell>{stat.country || 'Unknown'}</TableCell>
                      <TableCell className="text-right">{stat.count.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest 20 pageviews</CardDescription>
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
              {stats.recentActivity.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No recent activity
                  </TableCell>
                </TableRow>
              ) : (
                stats.recentActivity.map((activity, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm">{activity.page_path}</TableCell>
                    <TableCell>{activity.country || 'Unknown'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
