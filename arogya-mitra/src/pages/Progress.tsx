import React, { useState } from "react";
import { 
  useGetProgressStats, 
  useLogProgress 
} from "@workspace/api-client-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { TrendingUp, Activity, Moon, Battery, Scale } from "lucide-react";

export default function Progress() {
  const { data: stats, isLoading } = useGetProgressStats();
  
  if (isLoading) return <LoadingState message="Crunching your numbers..." />;

  const weeklyData = stats?.weeklyData || [];
  const entries = stats?.progressEntries || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <header>
        <h1 className="text-4xl font-display font-extrabold text-foreground">Your Progress</h1>
        <p className="text-muted-foreground mt-1">Consistency is the key to results.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Charts Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm">
            <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
              <Activity className="text-primary" /> Workouts & Activity
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorMins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="minutes" name="Minutes" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorMins)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm">
            <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
              <Scale className="text-secondary" /> Weight Tracking
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={entries.slice(-10).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => formatDate(val).split(',')[0]} 
                    tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} 
                    axisLine={false} tickLine={false} 
                  />
                  <YAxis domain={['auto', 'auto']} tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    labelFormatter={(val) => formatDate(val)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="hsl(var(--secondary))" strokeWidth={4} dot={{r: 4, fill: "hsl(var(--secondary))", strokeWidth: 2, stroke: "#fff"}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Daily Log Form Sidebar */}
        <div className="lg:col-span-1">
          <LogProgressForm />
        </div>
      </div>
    </div>
  );
}

function LogProgressForm() {
  const logMutation = useLogProgress();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    weight: "",
    energyLevel: 5,
    sleepHours: 7,
    mood: "good"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await logMutation.mutateAsync({ 
        data: {
          weight: formData.weight ? parseFloat(formData.weight) : null,
          energyLevel: formData.energyLevel,
          sleepHours: formData.sleepHours,
          mood: formData.mood
        }
      });
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress/stats'] });
      toast({ title: "Logged Successfully", description: "Your daily check-in is saved." });
      setFormData({...formData, weight: ""}); // reset weight input
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to log progress" });
    }
  };

  return (
    <div className="bg-gradient-primary rounded-3xl p-[2px] shadow-xl">
      <form onSubmit={handleSubmit} className="bg-card p-6 rounded-[22px] space-y-6 h-full relative">
        <h3 className="text-xl font-display font-bold">Daily Check-in</h3>
        
        <div className="space-y-3">
          <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
            <Scale className="w-4 h-4" /> Current Weight (kg)
          </label>
          <input 
            type="number" step="0.1" placeholder="e.g. 70.5"
            value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})}
            className="w-full p-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background outline-none transition-all font-bold text-lg"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
            <Moon className="w-4 h-4" /> Sleep Hours ({formData.sleepHours}h)
          </label>
          <input 
            type="range" min="3" max="12" step="0.5"
            value={formData.sleepHours} onChange={e => setFormData({...formData, sleepHours: parseFloat(e.target.value)})}
            className="w-full accent-primary"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
            <Battery className="w-4 h-4" /> Energy Level ({formData.energyLevel}/10)
          </label>
          <input 
            type="range" min="1" max="10" step="1"
            value={formData.energyLevel} onChange={e => setFormData({...formData, energyLevel: parseInt(e.target.value)})}
            className="w-full accent-primary"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-muted-foreground">Mood</label>
          <div className="grid grid-cols-3 gap-2">
            {['great', 'good', 'okay', 'tired', 'bad'].map(mood => (
              <button
                key={mood} type="button"
                onClick={() => setFormData({...formData, mood})}
                className={`py-2 rounded-lg text-sm font-bold capitalize transition-colors ${
                  formData.mood === mood ? "bg-primary text-white" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        <button 
          type="submit" disabled={logMutation.isPending}
          className="w-full py-4 mt-4 bg-primary text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {logMutation.isPending ? "Saving..." : "Save Check-in"}
        </button>
      </form>
    </div>
  );
}
