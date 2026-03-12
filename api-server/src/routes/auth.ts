import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, healthProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/jwt.js";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "Bad Request", message: "Email, password, and name are required" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Bad Request", message: "Email already registered" });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const [user] = await db.insert(usersTable).values({ email, password: hashedPassword, name }).returning();
    await db.insert(healthProfilesTable).values({
      userId: user.id,
      fitnessGoal: "general_fitness",
      fitnessLevel: "beginner",
      workoutType: "home",
    });
    const token = signToken({ userId: user.id, email: user.email });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt } });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Bad Request", message: "Email and password are required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }
    const token = signToken({ userId: user.id, email: user.email });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Login failed" });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }
    res.json({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
