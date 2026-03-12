import { Router } from "express";
import { db, workoutPlansTable, workoutLogsTable, healthProfilesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

async function generateWorkoutPlanAI(params: {
  goal: string;
  workoutType: string;
  fitnessLevel: string;
  minutesPerDay: number;
  daysPerWeek?: number;
  specificRequests?: string;
  profile?: { age?: number | null; medicalConditions?: string | null };
}) {
  const systemPrompt = `You are AROMI, an expert AI fitness coach for ArogyaMitra, a wellness platform. 
Generate a detailed, personalized 7-day workout plan in valid JSON format only. No explanation text, just JSON.`;

  const userPrompt = `Generate a 7-day workout plan with these details:
- Goal: ${params.goal}
- Workout Type: ${params.workoutType}
- Fitness Level: ${params.fitnessLevel}
- Time Available: ${params.minutesPerDay} minutes/day
- Days per Week: ${params.daysPerWeek || 5}
${params.specificRequests ? `- Special Requests: ${params.specificRequests}` : ""}
${params.profile?.age ? `- Age: ${params.profile.age}` : ""}
${params.profile?.medicalConditions ? `- Medical Conditions: ${params.profile.medicalConditions}` : ""}

Return a JSON object with this exact structure:
{
  "title": "Plan title",
  "days": [
    {
      "day": "Monday",
      "dayNumber": 1,
      "isRestDay": false,
      "focus": "Upper Body Strength",
      "warmup": [{"name": "Jumping Jacks", "duration": "5 min", "instructions": "Jump with arms overhead", "caloriesBurned": 30}],
      "exercises": [{"name": "Push-ups", "sets": 3, "reps": "10-12", "restPeriod": "60 sec", "instructions": "Keep core tight", "videoLink": "https://www.youtube.com/results?search_query=push+ups+tutorial", "caloriesBurned": 50}],
      "cooldown": [{"name": "Child's Pose", "duration": "2 min", "instructions": "Stretch arms forward"}],
      "tip": "Stay hydrated!",
      "estimatedCalories": 250
    }
  ]
}
Include all 7 days. Rest days should have isRestDay: true and empty exercise arrays.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}

router.post("/generate", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { goal, workoutType, fitnessLevel, minutesPerDay, daysPerWeek, specificRequests } = req.body;
    if (!goal || !workoutType || !fitnessLevel || !minutesPerDay) {
      res.status(400).json({ error: "Bad Request", message: "Missing required fields" });
      return;
    }

    const [profile] = await db.select().from(healthProfilesTable).where(eq(healthProfilesTable.userId, req.userId!)).limit(1);

    const planData = await generateWorkoutPlanAI({ goal, workoutType, fitnessLevel, minutesPerDay, daysPerWeek, specificRequests, profile });

    await db.update(workoutPlansTable).set({ isActive: false }).where(eq(workoutPlansTable.userId, req.userId!));

    const [plan] = await db.insert(workoutPlansTable).values({
      userId: req.userId!,
      title: planData.title || `${goal} Workout Plan`,
      goal,
      workoutType,
      fitnessLevel,
      daysPerWeek: daysPerWeek || 5,
      minutesPerDay,
      days: planData.days,
      isActive: true,
    }).returning();

    res.json(plan);
  } catch (err) {
    console.error("Generate workout error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to generate workout plan" });
  }
});

router.get("/current", requireAuth, async (req: AuthRequest, res) => {
  try {
    const plans = await db.select().from(workoutPlansTable)
      .where(eq(workoutPlansTable.userId, req.userId!))
      .orderBy(desc(workoutPlansTable.createdAt))
      .limit(1);

    const plan = plans.find(p => p.isActive) || plans[0];
    if (!plan) {
      res.status(404).json({ error: "Not Found", message: "No workout plan found" });
      return;
    }
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/plans", requireAuth, async (req: AuthRequest, res) => {
  try {
    const plans = await db.select().from(workoutPlansTable)
      .where(eq(workoutPlansTable.userId, req.userId!))
      .orderBy(desc(workoutPlansTable.createdAt));
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/log", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { planId, dayNumber, completedExercises, durationMinutes, caloriesBurned, mood, notes } = req.body;
    const [log] = await db.insert(workoutLogsTable).values({
      userId: req.userId!,
      planId,
      dayNumber,
      completedExercises: completedExercises || [],
      durationMinutes,
      caloriesBurned,
      mood,
      notes,
    }).returning();
    res.status(201).json(log);
  } catch (err) {
    console.error("Log workout error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/logs", requireAuth, async (req: AuthRequest, res) => {
  try {
    const logs = await db.select().from(workoutLogsTable)
      .where(eq(workoutLogsTable.userId, req.userId!))
      .orderBy(desc(workoutLogsTable.loggedAt));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
