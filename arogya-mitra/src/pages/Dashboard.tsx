import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  useGetProgress, 
  useGetCurrentWorkoutPlan, 
  useGetCurrentMealPlan 
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { LoadingState } from "@/components/ui/LoadingState";
import { Flame, Trophy, Activity, Target, ArrowRight, HeartPulse, BotMessageSquare, Dumbbell, Utensils } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: progress, isLoading: loadingProgress } = useGetProgress();
  const { data: workout } = useGetCurrentWorkoutPlan();
  const { data: meal } = useGetCurrentMealPlan();

  if (loadingProgress) return <LoadingState message="Loading your dashboard..." />;

  const stats = [
    { label: "Active Streak", value: `${progress?.currentStreak || 0} Days`, icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Total Workouts", value: progress?.totalWorkouts || 0, icon: Activity, color: "text-primary", bg: "bg-primary/10" },
    { label: "Calories Burned", value: progress?.totalCaloriesBurned || 0, icon: Target, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Charity Points", value: progress?.charityPoints || 0, icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Hello, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">Ready to crush your goals today?</p>
        </div>
        <Link 
          href="/coach"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-secondary text-white rounded-2xl font-bold shadow-lg shadow-secondary/30 hover:shadow-xl hover:-translate-y-0.5 transition-all w-fit"
        >
          <BotMessageSquareIcon />
          Ask AROMI Coach
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={stat.label}
            className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Today's Workout */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <DumbbellIcon className="text-primary" /> Today's Workout
            </h2>
            <Link href="/workouts" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              View Plan <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {workout ? (
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
              <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                {workout.goal.replace('_', ' ')}
              </div>
              <h3 className="text-xl font-bold">{workout.title}</h3>
              <p className="text-muted-foreground mt-2 mb-6">
                Level: <span className="capitalize">{workout.fitnessLevel}</span> • {workout.minutesPerDay} mins/day
              </p>
              
              <Link 
                href="/workouts"
                className="w-full block text-center px-6 py-3 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-colors"
              >
                Start Workout
              </Link>
            </div>
          ) : (
            <div className="bg-muted/30 border border-dashed border-border p-8 rounded-3xl text-center">
              <HeartPulse className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold mb-2">No Active Plan</h3>
              <p className="text-muted-foreground mb-6 text-sm max-w-xs mx-auto">Generate a personalized 7-day plan tailored to your specific goals.</p>
              <Link 
                href="/workouts"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition-all"
              >
                Generate Plan
              </Link>
            </div>
          )}
        </div>

        {/* Today's Nutrition */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <UtensilsIcon className="text-secondary" /> Today's Meals
            </h2>
            <Link href="/nutrition" className="text-sm font-bold text-secondary hover:underline flex items-center gap-1">
              View Menu <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {meal ? (
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{meal.title}</h3>
                <div className="text-right">
                  <p className="text-2xl font-display font-bold text-secondary">{meal.targetCalories}</p>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Kcal Target</p>
                </div>
              </div>
              <div className="space-y-3 mt-6">
                {meal.days[0]?.meals.slice(0,3).map((m: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <div>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{m.type}</p>
                      <p className="font-semibold text-sm line-clamp-1">{m.name}</p>
                    </div>
                    <span className="font-bold text-sm bg-background px-2 py-1 rounded-md shadow-sm">{m.calories} cal</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-muted/30 border border-dashed border-border p-8 rounded-3xl text-center">
              <UtensilsIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold mb-2">No Meal Plan</h3>
              <p className="text-muted-foreground mb-6 text-sm max-w-xs mx-auto">Get AI-generated recipes that match your caloric needs and dietary preferences.</p>
              <Link 
                href="/nutrition"
                className="inline-flex items-center justify-center px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-bold shadow-lg shadow-secondary/25 hover:opacity-90 transition-all"
              >
                Create Meal Plan
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mini Icon wrappers to fix imports
function BotMessageSquareIcon() { return <BotMessageSquare className="w-5 h-5" />; }
function DumbbellIcon(props: any) { return <Dumbbell className="w-6 h-6" {...props} />; }
function UtensilsIcon(props: any) { return <Utensils className="w-6 h-6" {...props} />; }
