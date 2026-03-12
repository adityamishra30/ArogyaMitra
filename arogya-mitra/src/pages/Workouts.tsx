import React, { useState } from "react";
import { 
  useGetCurrentWorkoutPlan, 
  useGenerateWorkoutPlan,
  useLogWorkout,
  type WorkoutGenerateRequestGoal,
  type WorkoutGenerateRequestWorkoutType,
  type WorkoutGenerateRequestFitnessLevel
} from "@workspace/api-client-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { motion } from "framer-motion";
import { Dumbbell, Plus, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Workouts() {
  const { data: currentPlan, isLoading } = useGetCurrentWorkoutPlan();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"current" | "generate">("current");

  if (isLoading) return <LoadingState message="Loading workouts..." />;

  // If no plan, default to generate tab
  if (!currentPlan && activeTab === "current" && !isGenerating) {
    setActiveTab("generate");
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-extrabold text-foreground">Workout Planner</h1>
          <p className="text-muted-foreground mt-1">Your AI-generated fitness roadmap.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab("current")}
            disabled={!currentPlan}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === "current" ? "bg-card shadow-sm text-primary" : "text-muted-foreground disabled:opacity-50"
            }`}
          >
            Current Plan
          </button>
          <button 
            onClick={() => setActiveTab("generate")}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === "generate" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"
            }`}
          >
            Generate New
          </button>
        </div>
      </header>

      {activeTab === "current" && currentPlan && (
        <CurrentPlanView plan={currentPlan} />
      )}

      {activeTab === "generate" && (
        <GeneratePlanForm onSuccess={() => setActiveTab("current")} />
      )}
    </div>
  );
}

function CurrentPlanView({ plan }: { plan: any }) {
  const [activeDay, setActiveDay] = useState(0);
  const logMutation = useLogWorkout();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleComplete = async () => {
    try {
      await logMutation.mutateAsync({
        data: {
          durationMinutes: plan.minutesPerDay,
          planId: plan.id,
          dayNumber: activeDay + 1,
          completedExercises: plan.days[activeDay].exercises?.map((e:any) => e.name) || [],
          mood: "good"
        }
      });
      toast({ title: "Workout Logged!", description: "Great job completing your workout." });
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
    } catch (e) {
      toast({ variant: "destructive", title: "Error logging workout" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Plan Summary Card */}
      <div className="bg-gradient-primary rounded-3xl p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            {plan.goal.replace('_', ' ')}
          </div>
          <h2 className="text-3xl font-display font-bold">{plan.title}</h2>
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 bg-black/10 px-4 py-2 rounded-xl">
              <Dumbbell className="w-5 h-5" />
              <span className="font-semibold capitalize">{plan.workoutType}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/10 px-4 py-2 rounded-xl">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">{plan.minutesPerDay} mins/day</span>
            </div>
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />
      </div>

      {/* Days Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {plan.days.map((day: any, idx: number) => (
          <button
            key={idx}
            onClick={() => setActiveDay(idx)}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-20 h-24 rounded-2xl border-2 transition-all ${
              activeDay === idx 
                ? "border-primary bg-primary/5 text-primary" 
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <span className="text-xs font-bold uppercase mb-1">Day</span>
            <span className="text-2xl font-display font-bold">{day.dayNumber}</span>
          </button>
        ))}
      </div>

      {/* Active Day Content */}
      <div className="bg-card rounded-3xl border border-border shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-border">
          <div>
            <h3 className="text-2xl font-display font-bold flex items-center gap-3">
              {plan.days[activeDay].day}
              {plan.days[activeDay].isRestDay && (
                <span className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full">Rest Day</span>
              )}
            </h3>
            {plan.days[activeDay].focus && (
              <p className="text-primary font-semibold mt-1">Focus: {plan.days[activeDay].focus}</p>
            )}
          </div>
          {!plan.days[activeDay].isRestDay && (
            <button 
              onClick={handleComplete}
              disabled={logMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {logMutation.isPending ? "Logging..." : "Complete Workout"}
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {plan.days[activeDay].isRestDay ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-xl font-display">Take it easy today.</p>
            <p className="mt-2">{plan.days[activeDay].tip || "Recovery is when the magic happens."}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(plan.days[activeDay].exercises || []).map((exercise: any, i: number) => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg">{exercise.name}</h4>
                  <div className="flex gap-4 mt-2 text-sm font-semibold text-muted-foreground">
                    {exercise.sets && <span>Sets: <span className="text-foreground">{exercise.sets}</span></span>}
                    {exercise.reps && <span>Reps: <span className="text-foreground">{exercise.reps}</span></span>}
                    {exercise.duration && <span>Duration: <span className="text-foreground">{exercise.duration}</span></span>}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {exercise.instructions}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function GeneratePlanForm({ onSuccess }: { onSuccess: () => void }) {
  const generateMutation = useGenerateWorkoutPlan();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    goal: "general_fitness" as WorkoutGenerateRequestGoal,
    workoutType: "home" as WorkoutGenerateRequestWorkoutType,
    fitnessLevel: "beginner" as WorkoutGenerateRequestFitnessLevel,
    minutesPerDay: 30,
    daysPerWeek: 4,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await generateMutation.mutateAsync({ data: formData });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/current'] });
      toast({ title: "Success!", description: "New workout plan generated." });
      onSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Generation failed" });
    }
  };

  if (generateMutation.isPending) {
    return (
      <div className="bg-card p-12 rounded-3xl border border-border text-center space-y-6">
        <div className="w-24 h-24 mx-auto relative">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <h3 className="text-2xl font-display font-bold">AROMI is designing your plan...</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Analyzing your parameters and generating a personalized 7-day routine using advanced AI.
        </p>
      </div>
    );
  }

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit} 
      className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm space-y-8"
    >
      <div>
        <h2 className="text-2xl font-display font-bold mb-2">Create New Plan</h2>
        <p className="text-muted-foreground text-sm">Tell us what you want to achieve, and AROMI will generate a custom 7-day routine.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-sm font-bold">Primary Goal</label>
          <select 
            value={formData.goal}
            onChange={e => setFormData({...formData, goal: e.target.value as any})}
            className="w-full p-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background outline-none transition-all font-medium"
          >
            <option value="weight_loss">Weight Loss</option>
            <option value="muscle_gain">Muscle Gain</option>
            <option value="endurance">Endurance</option>
            <option value="flexibility">Flexibility</option>
            <option value="general_fitness">General Fitness</option>
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold">Workout Environment</label>
          <select 
            value={formData.workoutType}
            onChange={e => setFormData({...formData, workoutType: e.target.value as any})}
            className="w-full p-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background outline-none transition-all font-medium"
          >
            <option value="home">Home (No Equipment)</option>
            <option value="gym">Gym</option>
            <option value="outdoor">Outdoor</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold">Fitness Level</label>
          <select 
            value={formData.fitnessLevel}
            onChange={e => setFormData({...formData, fitnessLevel: e.target.value as any})}
            className="w-full p-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background outline-none transition-all font-medium"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold">Minutes per Day ({formData.minutesPerDay}m)</label>
          <input 
            type="range" min="15" max="120" step="15"
            value={formData.minutesPerDay}
            onChange={e => setFormData({...formData, minutesPerDay: parseInt(e.target.value)})}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs font-bold text-muted-foreground">
            <span>15m</span>
            <span>60m</span>
            <span>120m</span>
          </div>
        </div>
      </div>

      <button 
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-primary text-white rounded-xl font-bold text-lg shadow-xl shadow-primary/25 hover:-translate-y-0.5 transition-all"
      >
        <Dumbbell className="w-5 h-5" />
        Generate AI Plan
      </button>
    </motion.form>
  );
}
