import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getStreamToken,
  getChatHistory,
  createGroupChannel,
  getGroupMembers,
  addGroupMembers,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/token", protectRoute, getStreamToken);
router.get("/history", protectRoute, getChatHistory);
router.post("/group", protectRoute, createGroupChannel);
router.get("/group/:channelId/members", protectRoute, getGroupMembers);
router.post("/group/:channelId/members", protectRoute, addGroupMembers);

export default router;