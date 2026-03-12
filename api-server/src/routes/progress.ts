import { Router } from "express";
import { db, progressEntriesTable, workoutLogsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const logs = await db.select().from(workoutLogsTable)
      .where(eq(workoutLogsTable.userId, req.userId!))
      .orderBy(desc(workoutLogsTable.loggedAt));

    const progressEntries = await db.select().from(progressEntriesTable)
      .where(eq(progressEntriesTable.userId, req.userId!))
      .orderBy(desc(progressEntriesTable.date));

    const totalWorkouts = logs.length;
    const totalMinutesExercised = logs.reduce((sum, l) => sum + l.durationMinutes, 0);
    const totalCaloriesBurned = logs.reduce((sum, l) => sum + (l.caloriesBurned || 0), 0);

    let currentStreak = 0;
    let longestStreak = 0;
    if (logs.length > 0) {
      const dates = new Set(logs.map(l => new Date(l.loggedAt).toDateString()));
      const sortedDates = Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      let streak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const diff = (new Date(sortedDates[i - 1]).getTime() - new Date(sortedDates[i]).getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) streak++;
        else {
          longestStreak = Math.max(longestStreak, streak);
          streak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, streak);
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (dates.has(today) || dates.has(yesterday)) {
        currentStreak = 1;
        let checkDate = dates.has(today) ? new Date(Date.now() - 86400000) : new Date(Date.now() - 2 * 86400000);
        while (dates.has(checkDate.toDateString())) {
          currentStreak++;
          checkDate = new Date(checkDate.getTime() - 86400000);
        }
      }
    }

    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const weeklyWorkouts = logs.filter(l => new Date(l.loggedAt) >= weekAgo).length;

    const startWeight = progressEntries.length > 0 ? progressEntries[progressEntries.length - 1].weight : null;
    const currentWeight = progressEntries.length > 0 ? progressEntries[0].weight : null;
    const weightChange = startWeight && currentWeight ? currentWeight - startWeight : null;

    const charityPoints = totalWorkouts * 10 + Math.floor(totalMinutesExercised / 10);

    const achievements: string[] = [];
    if (totalWorkouts >= 1) achievements.push("First Workout Completed!");
    if (totalWorkouts >= 7) achievements.push("One Week Warrior");
    if (totalWorkouts >= 30) achievements.push("Monthly Champion");
    if (currentStreak >= 7) achievements.push("7-Day Streak Master");
    if (totalCaloriesBurned >= 1000) achievements.push("Calorie Crusher");
    if (charityPoints >= 100) achievements.push("Charity Champion");

    res.json({
      totalWorkouts,
      totalMinutesExercised,
      totalCaloriesBurned,
      currentStreak,
      longestStreak,
      weeklyWorkouts,
      weightChange,
      startWeight,
      currentWeight,
      charityPoints,
      achievements,
    });
  } catch (err) {
    console.error("Progress error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/stats", requireAuth, async (req: AuthRequest, res) => {
  try {
    const workoutLogs = await db.select().from(workoutLogsTable)
      .where(eq(workoutLogsTable.userId, req.userId!))
      .orderBy(desc(workoutLogsTable.loggedAt));

    const progressEntries = await db.select().from(progressEntriesTable)
      .where(eq(progressEntriesTable.userId, req.userId!))
      .orderBy(desc(progressEntriesTable.date));

    const weeklyMap = new Map<string, { workouts: number; minutes: number; calories: number }>();
    workoutLogs.forEach(log => {
      const date = new Date(log.loggedAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const week = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!weeklyMap.has(week)) weeklyMap.set(week, { workouts: 0, minutes: 0, calories: 0 });
      const entry = weeklyMap.get(week)!;
      entry.workouts++;
      entry.minutes += log.durationMinutes;
      entry.calories += log.caloriesBurned || 0;
    });

    const weeklyData = Array.from(weeklyMap.entries())
      .map(([week, data]) => ({ week, ...data }))
      .slice(0, 8)
      .reverse();

    res.json({ weeklyData, progressEntries, workoutLogs });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/log", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { weight, energyLevel, sleepHours, waterIntake, mood, notes } = req.body;
    const [entry] = await db.insert(progressEntriesTable).values({
      userId: req.userId!,
      weight,
      bmi: weight ? weight / Math.pow(1.7, 2) : undefined,
      energyLevel,
      sleepHours,
      waterIntake,
      mood,
      notes,
    }).returning();
    res.status(201).json(entry);
  } catch (err) {
    console.error("Log progress error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
