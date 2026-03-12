import { Router } from "express";
import { db, mealPlansTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

async function generateMealPlanAI(params: {
  targetCalories: number;
  dietaryPreference: string;
  cuisinePreference?: string | null;
  allergies?: string | null;
  specificRequests?: string | null;
}) {
  const systemPrompt = `You are AROMI, an expert AI nutritionist for ArogyaMitra. 
Generate a detailed 7-day meal plan in valid JSON format only. No explanation text, just JSON.`;

  const userPrompt = `Generate a 7-day meal plan with these requirements:
- Target Calories: ${params.targetCalories} per day
- Dietary Preference: ${params.dietaryPreference}
${params.cuisinePreference ? `- Cuisine Preference: ${params.cuisinePreference}` : ""}
${params.allergies ? `- Allergies/Restrictions: ${params.allergies}` : ""}
${params.specificRequests ? `- Special Requests: ${params.specificRequests}` : ""}

Return a JSON object with this exact structure:
{
  "title": "Plan title",
  "days": [
    {
      "day": "Monday",
      "dayNumber": 1,
      "totalCalories": 1800,
      "totalProtein": 90,
      "totalCarbs": 220,
      "totalFat": 60,
      "meals": [
        {
          "name": "Masala Oats",
          "type": "breakfast",
          "ingredients": ["oats", "vegetables", "spices"],
          "recipe": "Cook oats with vegetables and spices",
          "calories": 350,
          "protein": 12,
          "carbs": 55,
          "fat": 8,
          "prepTime": "15 min"
        }
      ],
      "tip": "Start your day with warm lemon water"
    }
  ]
}
Include all 7 days. Each day must have breakfast, lunch, dinner, and one snack meal.
Make recipes culturally appropriate for ${params.cuisinePreference || "Indian"} cuisine.`;

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
    const { targetCalories, dietaryPreference, cuisinePreference, allergies, specificRequests } = req.body;
    if (!targetCalories || !dietaryPreference) {
      res.status(400).json({ error: "Bad Request", message: "Missing required fields" });
      return;
    }

    const planData = await generateMealPlanAI({ targetCalories, dietaryPreference, cuisinePreference, allergies, specificRequests });

    await db.update(mealPlansTable).set({ isActive: false }).where(eq(mealPlansTable.userId, req.userId!));

    const [plan] = await db.insert(mealPlansTable).values({
      userId: req.userId!,
      title: planData.title || `${dietaryPreference} ${targetCalories} cal Plan`,
      targetCalories,
      dietaryPreference,
      cuisinePreference,
      allergies,
      days: planData.days,
      isActive: true,
    }).returning();

    res.json(plan);
  } catch (err) {
    console.error("Generate meal plan error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to generate meal plan" });
  }
});

router.get("/current", requireAuth, async (req: AuthRequest, res) => {
  try {
    const plans = await db.select().from(mealPlansTable)
      .where(eq(mealPlansTable.userId, req.userId!))
      .orderBy(desc(mealPlansTable.createdAt))
      .limit(1);

    const plan = plans.find(p => p.isActive) || plans[0];
    if (!plan) {
      res.status(404).json({ error: "Not Found", message: "No meal plan found" });
      return;
    }
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
