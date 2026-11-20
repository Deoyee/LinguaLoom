import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getStreamToken,
  getChatHistory,
  createGroupChannel,
  getGroupMembers,
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
  updateGroupMemberRole,
  deleteGroup,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/token", protectRoute, getStreamToken);
router.get("/history", protectRoute, getChatHistory);
router.post("/group", protectRoute, createGroupChannel);
router.delete("/group/:channelId/members/me", protectRoute, leaveGroup);
router.delete("/group/:channelId/members/:memberId", protectRoute, removeGroupMember);
router.patch("/group/:channelId/members/:memberId/role", protectRoute, updateGroupMemberRole);
router.delete("/group/:channelId", protectRoute, deleteGroup);
router.get("/group/:channelId/members", protectRoute, getGroupMembers);
router.post("/group/:channelId/members", protectRoute, addGroupMembers);

export default router;