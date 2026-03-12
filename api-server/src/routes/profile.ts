import { Router } from "express";
import { db, healthProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [profile] = await db.select().from(healthProfilesTable).where(eq(healthProfilesTable.userId, req.userId!)).limit(1);
    if (!profile) {
      res.status(404).json({ error: "Not Found", message: "Profile not found" });
      return;
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const updateData = { ...req.body, updatedAt: new Date() };
    const [existing] = await db.select().from(healthProfilesTable).where(eq(healthProfilesTable.userId, req.userId!)).limit(1);
    if (!existing) {
      const [profile] = await db.insert(healthProfilesTable).values({ userId: req.userId!, ...updateData }).returning();
      res.json(profile);
      return;
    }
    const [profile] = await db.update(healthProfilesTable)
      .set(updateData)
      .where(eq(healthProfilesTable.userId, req.userId!))
      .returning();
    res.json(profile);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
