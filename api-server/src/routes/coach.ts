import { Router } from "express";
import { db, coachMessagesTable, healthProfilesTable, workoutPlansTable, mealPlansTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const AROMI_SYSTEM_PROMPT = `You are AROMI, an empathetic and knowledgeable AI wellness coach for ArogyaMitra platform.
You provide personalized fitness, nutrition, and wellness guidance.
You are encouraging, warm, and evidence-based. You adapt your advice to each user's unique needs.
When users mention travel, injuries, mood issues, or time constraints, you proactively suggest plan adjustments.
Keep responses concise but comprehensive (under 300 words). Always end with an actionable tip or motivational statement.
Format your response naturally without excessive markdown.`;

router.post("/chat", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: "Bad Request", message: "Message is required" });
      return;
    }

    const history = await db.select().from(coachMessagesTable)
      .where(eq(coachMessagesTable.userId, req.userId!))
      .orderBy(desc(coachMessagesTable.createdAt))
      .limit(10);

    const [profile] = await db.select().from(healthProfilesTable)
      .where(eq(healthProfilesTable.userId, req.userId!)).limit(1);

    const profileContext = profile ? `User profile: Fitness goal: ${profile.fitnessGoal}, Level: ${profile.fitnessLevel}, Workout type: ${profile.workoutType}, Dietary preference: ${profile.dietaryPreference || "not specified"}` : "";

    const chatMessages = [
      { role: "system" as const, content: AROMI_SYSTEM_PROMPT + (profileContext ? `\n\n${profileContext}` : "") },
      ...history.reverse().map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: message },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1024,
      messages: chatMessages,
    });

    const assistantMessage = response.choices[0]?.message?.content || "I'm here to help! How can I support your wellness journey today?";

    await db.insert(coachMessagesTable).values([
      { userId: req.userId!, role: "user", content: message },
      { userId: req.userId!, role: "assistant", content: assistantMessage },
    ]);

    const planAdjusted = message.toLowerCase().includes("travel") || message.toLowerCase().includes("injur") || message.toLowerCase().includes("sick");

    const suggestions = [
      "Log today's workout",
      "View your meal plan",
      "Check your progress",
      "Adjust your plan",
    ];

    res.json({ message: assistantMessage, suggestions, planAdjusted });
  } catch (err) {
    console.error("Coach chat error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get coach response" });
  }
});

router.get("/history", requireAuth, async (req: AuthRequest, res) => {
  try {
    const messages = await db.select().from(coachMessagesTable)
      .where(eq(coachMessagesTable.userId, req.userId!))
      .orderBy(coachMessagesTable.createdAt);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/adjust", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { situation, details, daysAffected } = req.body;

    const [profile] = await db.select().from(healthProfilesTable)
      .where(eq(healthProfilesTable.userId, req.userId!)).limit(1);

    const [currentWorkout] = await db.select().from(workoutPlansTable)
      .where(eq(workoutPlansTable.userId, req.userId!))
      .orderBy(desc(workoutPlansTable.createdAt)).limit(1);

    const adjustmentPrompt = `A user on ArogyaMitra needs their wellness plan adjusted due to: ${situation}.
${details ? `Details: ${details}` : ""}
${daysAffected ? `Days affected: ${daysAffected}` : ""}
${profile ? `Profile: ${profile.fitnessGoal} goal, ${profile.fitnessLevel} level` : ""}

Provide:
1. An empathetic, personalized message acknowledging their situation (2-3 sentences)
2. 3-5 specific, actionable wellness tips for this situation

Be practical and encouraging.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1024,
      messages: [
        { role: "system", content: AROMI_SYSTEM_PROMPT },
        { role: "user", content: adjustmentPrompt },
      ],
    });

    const aiMessage = response.choices[0]?.message?.content || "";

    const situationTips: Record<string, string[]> = {
      traveling: ["Do bodyweight exercises in your hotel room", "Take the stairs instead of elevators", "Walk or cycle to explore the city", "Practice yoga or stretching in your room", "Stay hydrated and choose healthy local foods"],
      injured: ["Focus on gentle stretching and mobility work", "Try upper body exercises if legs are injured (or vice versa)", "Rest is essential for recovery — don't push through pain", "Apply ice and elevate the injured area", "Consult a healthcare provider if pain persists"],
      sick: ["Rest and sleep are your best medicine", "Stay well hydrated with water and herbal teas", "Light walking is fine if symptoms are mild", "Avoid intense workouts until fully recovered", "Focus on nutritious, easy-to-digest foods"],
      low_energy: ["Try a 15-minute gentle walk to boost energy", "Practice breathing exercises for 5 minutes", "Ensure you're eating enough protein and complex carbs", "Check your sleep quality and hydration levels", "A short nap (15-20 min) can restore energy"],
      time_constrained: ["Try HIIT workouts — 15-20 minutes of intense intervals", "Break your workout into 3x10-minute sessions", "Use lunch breaks for a quick walk", "Prep meals in batches on weekends", "Focus on compound exercises for maximum efficiency"],
      other: ["Listen to your body and adjust intensity accordingly", "Consistency matters more than perfection", "Even 10 minutes of movement counts", "Focus on nutrition when exercise is challenging", "Document how you're feeling to identify patterns"],
    };

    const tips = situationTips[situation] || situationTips.other;

    await db.insert(coachMessagesTable).values([
      { userId: req.userId!, role: "user", content: `Plan adjustment needed: ${situation}${details ? ` - ${details}` : ""}` },
      { userId: req.userId!, role: "assistant", content: aiMessage },
    ]);

    res.json({ message: aiMessage, tips, adjustedWorkout: null, adjustedMeals: null });
  } catch (err) {
    console.error("Adjust plan error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to adjust plan" });
  }
});

export default router;
