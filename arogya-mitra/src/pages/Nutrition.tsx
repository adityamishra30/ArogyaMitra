import React, { useState } from "react";
import { 
  useGetCurrentMealPlan, 
  useGenerateMealPlan,
  type MealPlanGenerateRequestDietaryPreference
} from "@workspace/api-client-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { motion } from "framer-motion";
import { Utensils, ChefHat, Info } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Nutrition() {
  const { data: currentPlan, isLoading } = useGetCurrentMealPlan();
  const [activeTab, setActiveTab] = useState<"current" | "generate">("current");

  if (isLoading) return <LoadingState message="Loading nutrition data..." />;

  if (!currentPlan && activeTab === "current") {
    setActiveTab("generate");
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-extrabold text-foreground">Meal Planner</h1>
          <p className="text-muted-foreground mt-1">Smart recipes tailored to your macros.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab("current")}
            disabled={!currentPlan}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === "current" ? "bg-card shadow-sm text-secondary" : "text-muted-foreground disabled:opacity-50"
            }`}
          >
            Current Plan
          </button>
          <button 
            onClick={() => setActiveTab("generate")}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === "generate" ? "bg-card shadow-sm text-secondary" : "text-muted-foreground"
            }`}
          >
            Generate New
          </button>
        </div>
      </header>

      {activeTab === "current" && currentPlan && (
        <CurrentMealPlanView plan={currentPlan} />
      )}

      {activeTab === "generate" && (
        <GenerateMealForm onSuccess={() => setActiveTab("current")} />
      )}
    </div>
  );
}

function CurrentMealPlanView({ plan }: { plan: any }) {
  const [activeDay, setActiveDay] = useState(0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Plan Summary Card */}
      <div className="bg-gradient-secondary rounded-3xl p-8 text-white shadow-xl shadow-secondary/20">
        <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-4">
          {plan.targetCalories} kcal / day
        </div>
        <h2 className="text-3xl font-display font-bold">{plan.title}</h2>
        <div className="flex gap-4 mt-6">
          <div className="flex items-center gap-2 bg-black/10 px-4 py-2 rounded-xl text-sm font-semibold capitalize">
            {plan.dietaryPreference.replace('_', ' ')}
          </div>
          {plan.cuisinePreference && (
            <div className="flex items-center gap-2 bg-black/10 px-4 py-2 rounded-xl text-sm font-semibold capitalize">
              {plan.cuisinePreference}
            </div>
          )}
        </div>
      </div>

      {/* Days Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {plan.days.map((day: any, idx: number) => (
          <button
            key={idx}
            onClick={() => setActiveDay(idx)}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-20 h-24 rounded-2xl border-2 transition-all ${
              activeDay === idx 
                ? "border-secondary bg-secondary/5 text-secondary" 
                : "border-border bg-card hover:border-secondary/30"
            }`}
          >
            <span className="text-xs font-bold uppercase mb-1">Day</span>
            <span className="text-2xl font-display font-bold">{day.dayNumber}</span>
          </button>
        ))}
      </div>

      {/* Daily Overview */}
      <div className="bg-card rounded-3xl border border-border shadow-sm p-6 md:p-8">
        <h3 className="text-2xl font-display font-bold mb-6 border-b border-border pb-4">{plan.days[activeDay].day} Menu</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {(plan.days[activeDay].meals || []).map((meal: any, i: number) => (
            <div key={i} className="flex flex-col bg-muted/30 border border-border/50 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 bg-muted/80 border-b border-border/50 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-secondary">{meal.type}</span>
                <span className="text-sm font-bold bg-background px-2 py-1 rounded-md">{meal.calories} cal</span>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h4 className="font-bold text-lg mb-3">{meal.name}</h4>
                <div className="flex gap-3 text-xs font-semibold text-muted-foreground mb-4">
                  <span className="bg-background px-2 py-1 rounded">P: {meal.protein}g</span>
                  <span className="bg-background px-2 py-1 rounded">C: {meal.carbs}g</span>
                  <span className="bg-background px-2 py-1 rounded">F: {meal.fat}g</span>
                </div>
                {meal.recipe && (
                  <p className="text-sm text-muted-foreground mt-auto leading-relaxed border-t border-border/50 pt-3">
                    {meal.recipe}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function GenerateMealForm({ onSuccess }: { onSuccess: () => void }) {
  const generateMutation = useGenerateMealPlan();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    targetCalories: 2000,
    dietaryPreference: "non_vegetarian" as MealPlanGenerateRequestDietaryPreference,
    cuisinePreference: "",
    allergies: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await generateMutation.mutateAsync({ data: formData });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/current'] });
      toast({ title: "Success!", description: "New meal plan generated." });
      onSuccess();
    } catch (error) {
      toast({ variant: "destructive", title: "Generation failed" });
    }
  };

  if (generateMutation.isPending) {
    return (
      <div className="bg-card p-12 rounded-3xl border border-border text-center space-y-6">
        <div className="w-24 h-24 mx-auto relative text-secondary">
          <div className="absolute inset-0 rounded-full border-4 border-secondary/20 border-t-secondary animate-spin" />
          <ChefHat className="absolute inset-0 m-auto w-10 h-10 animate-pulse" />
        </div>
        <h3 className="text-2xl font-display font-bold">Crafting your menu...</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          AROMI is calculating macros and sourcing recipes to fit your dietary needs.
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
        <h2 className="text-2xl font-display font-bold mb-2">Create Nutrition Plan</h2>
        <p className="text-muted-foreground text-sm">Get a week of meals optimized for your body.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-sm font-bold flex justify-between">
            Target Calories <span>{formData.targetCalories} kcal</span>
          </label>
          <input 
            type="range" min="1200" max="4000" step="50"
            value={formData.targetCalories}
            onChange={e => setFormData({...formData, targetCalories: parseInt(e.target.value)})}
            className="w-full accent-secondary"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold">Dietary Preference</label>
          <select 
            value={formData.dietaryPreference}
            onChange={e => setFormData({...formData, dietaryPreference: e.target.value as any})}
            className="w-full p-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-secondary focus:bg-background outline-none transition-all font-medium"
          >
            <option value="non_vegetarian">Standard (No Restrictions)</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="pescatarian">Pescatarian</option>
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold">Preferred Cuisine (Optional)</label>
          <input 
            type="text" placeholder="e.g. Mediterranean, Indian, Mexican"
            value={formData.cuisinePreference}
            onChange={e => setFormData({...formData, cuisinePreference: e.target.value})}
            className="w-full p-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-secondary focus:bg-background outline-none transition-all font-medium"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold">Allergies (Optional)</label>
          <input 
            type="text" placeholder="e.g. Peanuts, Gluten, Dairy"
            value={formData.allergies}
            onChange={e => setFormData({...formData, allergies: e.target.value})}
            className="w-full p-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-secondary focus:bg-background outline-none transition-all font-medium"
          />
        </div>
      </div>

      <button 
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-secondary text-white rounded-xl font-bold text-lg shadow-xl shadow-secondary/25 hover:-translate-y-0.5 transition-all"
      >
        <Utensils className="w-5 h-5" />
        Generate Meal Plan
      </button>
    </motion.form>
  );
}
