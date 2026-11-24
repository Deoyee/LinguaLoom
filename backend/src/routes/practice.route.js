import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { generatePracticeLesson } from "../controllers/practice.controller.js";

const router = express.Router();

router.use(protectRoute);

router.post("/generate", generatePracticeLesson);

export default router;
