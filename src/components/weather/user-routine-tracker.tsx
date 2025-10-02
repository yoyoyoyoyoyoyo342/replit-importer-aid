import { useState, useEffect } from "react";
import { Clock, MapPin, Activity, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface UserRoutine {
  id: string;
  name: string;
  time: string;
  location: string;
  activity_type: 'outdoor' | 'indoor' | 'commute' | 'exercise' | 'other';
  weather_sensitive: boolean;
  created_at: string;
}

interface UserRoutineTrackerProps {
  onRoutineUpdate: (routines: UserRoutine[]) => void;
}

export function UserRoutineTracker({ onRoutineUpdate }: UserRoutineTrackerProps) {
  const [routines, setRoutines] = useState<UserRoutine[]>([]);
  const [isAddingRoutine, setIsAddingRoutine] = useState(false);
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    time: '',
    location: '',
    activity_type: 'other' as const,
    weather_sensitive: true
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchRoutines();
    }
  }, [user]);

  const fetchRoutines = async () => {
    try {
      const { data, error } = await supabase
        .from('user_routines' as any)
        .select('*')
        .eq('user_id', user?.id)
        .order('time');

      if (error) throw error;
      
      const routineData = data as unknown as UserRoutine[] || [];
      setRoutines(routineData);
      onRoutineUpdate(routineData);
    } catch (error) {
      console.error('Error fetching routines:', error);
    }
  };

  const addRoutine = async () => {
    if (!newRoutine.name || !newRoutine.time || !user) return;

    try {
      const { data, error } = await supabase
        .from('user_routines' as any)
        .insert([{
          user_id: user.id,
          name: newRoutine.name,
          time: newRoutine.time,
          location: newRoutine.location,
          activity_type: newRoutine.activity_type,
          weather_sensitive: newRoutine.weather_sensitive
        }])
        .select()
        .single();

      if (error) throw error;

      const newData = data as unknown as UserRoutine;
      setRoutines(prev => [...prev, newData]);
      onRoutineUpdate([...routines, newData]);
      setNewRoutine({
        name: '',
        time: '',
        location: '',
        activity_type: 'other',
        weather_sensitive: true
      });
      setIsAddingRoutine(false);

      toast({
        title: "Routine Added",
        description: "Your routine will help provide better weather insights!"
      });
    } catch (error) {
      console.error('Error adding routine:', error);
      toast({
        title: "Error",
        description: "Failed to add routine. Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteRoutine = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_routines' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      const updatedRoutines = routines.filter(r => r.id !== id);
      setRoutines(updatedRoutines);
      onRoutineUpdate(updatedRoutines);

      toast({
        title: "Routine Removed",
        description: "Your routine has been deleted."
      });
    } catch (error) {
      console.error('Error deleting routine:', error);
      toast({
        title: "Error",
        description: "Failed to delete routine. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'outdoor': return '🌳';
      case 'indoor': return '🏠';
      case 'commute': return '🚗';
      case 'exercise': return '🏃‍♂️';
      default: return '📅';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'outdoor': return 'bg-green-100 text-green-800';
      case 'indoor': return 'bg-blue-100 text-blue-800';
      case 'commute': return 'bg-yellow-100 text-yellow-800';
      case 'exercise': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Sign in to track your daily routines and get personalized weather recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-primary" />
          Daily Routines
          <Badge variant="outline" className="ml-auto text-xs">
            AI Learning
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {routines.length === 0 && !isAddingRoutine && (
          <div className="text-center py-6">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Track your daily routines to get personalized weather insights!
            </p>
            <Button onClick={() => setIsAddingRoutine(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Routine
            </Button>
          </div>
        )}

        {routines.map((routine) => (
          <div key={routine.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-lg">{getActivityIcon(routine.activity_type)}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{routine.name}</span>
                  <Badge variant="outline" className={`text-xs ${getActivityColor(routine.activity_type)}`}>
                    {routine.activity_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {routine.time}
                  {routine.location && (
                    <>
                      <MapPin className="w-3 h-3 ml-2" />
                      {routine.location}
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteRoutine(routine.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        {routines.length > 0 && !isAddingRoutine && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsAddingRoutine(true)}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Routine
          </Button>
        )}

        {isAddingRoutine && (
          <div className="space-y-3 p-4 glass-card border border-border rounded-lg">
            <Input
              placeholder="Routine name (e.g., Morning Jog, Commute to Work)"
              value={newRoutine.name}
              onChange={(e) => setNewRoutine(prev => ({ ...prev, name: e.target.value }))}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="time"
                value={newRoutine.time}
                onChange={(e) => setNewRoutine(prev => ({ ...prev, time: e.target.value }))}
              />
              
              <Select
                value={newRoutine.activity_type}
                onValueChange={(value) => setNewRoutine(prev => ({ ...prev, activity_type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outdoor">Outdoor Activity</SelectItem>
                  <SelectItem value="indoor">Indoor Activity</SelectItem>
                  <SelectItem value="commute">Commute</SelectItem>
                  <SelectItem value="exercise">Exercise</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              placeholder="Location (optional)"
              value={newRoutine.location}
              onChange={(e) => setNewRoutine(prev => ({ ...prev, location: e.target.value }))}
            />

            <div className="flex gap-2">
              <Button onClick={addRoutine} size="sm" className="flex-1">
                Add Routine
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddingRoutine(false)} 
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          💡 Your routines help the AI provide weather insights tailored to your daily schedule
        </div>
      </CardContent>
    </Card>
  );
}