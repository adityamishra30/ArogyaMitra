import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import profileRouter from "./profile.js";
import workoutsRouter from "./workouts.js";
import nutritionRouter from "./nutrition.js";
import progressRouter from "./progress.js";
import coachRouter from "./coach.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/profile", profileRouter);
router.use("/workouts", workoutsRouter);
router.use("/nutrition", nutritionRouter);
router.use("/progress", progressRouter);
router.use("/coach", coachRouter);

export default router;
