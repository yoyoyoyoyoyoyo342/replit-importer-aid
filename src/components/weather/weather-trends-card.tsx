import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { TrendingUp, Calendar } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { CurrentWeather } from "@/types/weather";
import { useEffect } from "react";
import { useUserPreferences } from "@/hooks/use-user-preferences";

interface WeatherTrendsCardProps {
  currentWeather?: CurrentWeather;
  location?: string;
  latitude?: number;
  longitude?: number;
  isImperial?: boolean;
}

interface WeatherHistoryEntry {
  date: string;
  avg_temp: number;
  high_temp: number;
  low_temp: number;
  precipitation: number;
  condition: string;
}

export function WeatherTrendsCard({
  currentWeather,
  location,
  latitude,
  longitude,
  isImperial = false,
}: WeatherTrendsCardProps) {
  const { is24Hour } = useUserPreferences();
  
  const { data: historyData = [], isLoading } = useQuery({
    queryKey: ["weather-history", latitude, longitude],
    queryFn: async () => {
      if (!latitude || !longitude) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("weather_history")
        .select("*")
        .eq("user_id", user.id)
        .eq("latitude", latitude)
        .eq("longitude", longitude)
        .gte("date", thirtyDaysAgo)
        .order("date", { ascending: true });

      if (error) throw error;
      return data as WeatherHistoryEntry[];
    },
    enabled: !!latitude && !!longitude,
  });

  // Save current weather to history
  useEffect(() => {
    const saveWeatherHistory = async () => {
      if (!currentWeather || !location || !latitude || !longitude) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Only save for authenticated users

      const today = format(new Date(), "yyyy-MM-dd");

      await supabase.from("weather_history").upsert({
        user_id: user.id,
        location_name: location,
        latitude,
        longitude,
        date: today,
        avg_temp: currentWeather.temperature,
        high_temp: currentWeather.temperature,
        low_temp: currentWeather.temperature,
        precipitation: currentWeather.precipitation || 0,
        condition: currentWeather.condition,
        humidity: currentWeather.humidity,
        wind_speed: currentWeather.windSpeed,
      }, {
        onConflict: "latitude,longitude,date",
      });
    };

    saveWeatherHistory();
  }, [currentWeather, location, latitude, longitude]);

  const convertTemp = (temp: number) => {
    if (isImperial) return temp;
    return ((temp - 32) * 5) / 9;
  };

  const tempChartData = historyData.map((entry) => ({
    date: format(new Date(entry.date), "MMM d"),
    high: Math.round(convertTemp(parseFloat(entry.high_temp.toString()))),
    low: Math.round(convertTemp(parseFloat(entry.low_temp.toString()))),
    avg: Math.round(convertTemp(parseFloat(entry.avg_temp.toString()))),
  }));

  const precipChartData = historyData.map((entry) => ({
    date: format(new Date(entry.date), "MMM d"),
    precipitation: parseFloat(entry.precipitation.toString()),
  }));

  if (isLoading) {
    return (
      <Card className="p-6 glass-panel">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5" />
          <h3 className="font-semibold">Weather Trends</h3>
        </div>
        <p className="text-sm text-muted-foreground">Loading historical data...</p>
      </Card>
    );
  }

  if (historyData.length === 0) {
    return (
      <Card className="p-6 glass-panel">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5" />
          <h3 className="font-semibold">Weather Trends</h3>
        </div>
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No historical data yet. Come back tomorrow to see trends!
          </p>
        </div>
      </Card>
    );
  }

  const avgTemp = Math.round(
    historyData.reduce((sum, entry) => sum + convertTemp(parseFloat(entry.avg_temp.toString())), 0) / historyData.length
  );
  const totalPrecip = historyData.reduce((sum, entry) => sum + parseFloat(entry.precipitation.toString()), 0);
  const tempUnit = isImperial ? "°F" : "°C";
  const precipUnit = isImperial ? "in" : "mm";

  return (
    <Card className="p-6 glass-panel">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5" />
        <h3 className="font-semibold">Weather Trends</h3>
        <span className="text-xs text-muted-foreground ml-auto">Last 30 days</span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground">Avg Temperature</p>
          <p className="text-2xl font-bold">{avgTemp}{tempUnit}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground">Total Precipitation</p>
          <p className="text-2xl font-bold">{totalPrecip.toFixed(1)} {precipUnit}</p>
        </div>
      </div>

      {/* Temperature Trend */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">Temperature Trend</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={tempChartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" stroke="hsl(var(--muted-foreground))" />
            <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Line type="monotone" dataKey="high" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="low" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Avg</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-chart-2" />
            <span>Low</span>
          </div>
        </div>
      </div>

      {/* Precipitation */}
      <div>
        <h4 className="text-sm font-medium mb-3">Precipitation</h4>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={precipChartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" stroke="hsl(var(--muted-foreground))" />
            <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="precipitation" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}