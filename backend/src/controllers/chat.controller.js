import { generateStreamToken } from "../lib/stream.js";
import { StreamChat } from "stream-chat";
import User from "../models/User.js";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;
const streamClient = StreamChat.getInstance(apiKey, apiSecret);

const getUserId = (req) => String(req.user?._id || req.user?.id || "");

const findChannelMember = (channel, userId) =>
  Object.values(channel.state.members || {}).find(
    (member) => String(member.user_id) === String(userId)
  );

const isGroupAdmin = (channel, userId, member) =>
  String(channel.data.created_by_id || "") === String(userId) ||
  member?.channel_role === "channel_moderator" ||
  member?.role === "admin" ||
  member?.is_moderator === true;

const getGroupContext = async (channelId, userId) => {
  if (!channelId?.startsWith("group-")) {
    throw Object.assign(new Error("Group not found"), { statusCode: 404 });
  }

  const channel = streamClient.channel("messaging", channelId);
  await channel.query({ state: true, messages: { limit: 0 } });
  const member = findChannelMember(channel, userId);
  if (!member) {
    throw Object.assign(new Error("You are not a member of this group"), { statusCode: 403 });
  }

  return { channel, member, isAdmin: isGroupAdmin(channel, userId, member) };
};

const getAdminIds = (channel) =>
  Object.values(channel.state.members || {})
    .filter((member) => isGroupAdmin(channel, member.user_id, member))
    .map((member) => String(member.user_id));

export async function getStreamToken(req, res) {
  try {
    const token = generateStreamToken(req.user.id);
    res.status(200).json({ token });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getChatHistory(req, res) {
  try {
    const userId = req.user._id.toString();
    
    // Get all channels where the current user is a member
    const filter = { members: { $in: [userId] }, type: 'messaging' };
    const sort = [{ last_message_at: -1 }];
    
    const channels = await streamClient.queryChannels(filter, sort, {
      limit: 50,
      messages_limit: 1,
      state: true,
    });

    // Extract relevant info from each channel (1-on-1 and Groups)
    const chatHistory = channels.map(channel => {
      const isGroup = Boolean(
        channel.data.is_group ||
        channel.data.name ||
        channel.id.startsWith("group-") ||
        Object.keys(channel.state.members || {}).length > 2
      );

      const otherMember = channel.state.members
        ? Object.values(channel.state.members).find(member => member.user_id !== userId)
        : null;

      const membersList = Object.values(channel.state.members || {}).map(m => ({
        id: m.user_id,
        name: m.user?.name || 'Unknown User',
        image: m.user?.image,
        online: Boolean(m.user?.online),
        role: isGroupAdmin(channel, m.user_id, m) ? "admin" : "member",
      }));

      return {
        channelId: channel.id,
        lastMessage: channel.state.messages[channel.state.messages.length - 1],
        lastMessageAt: channel.last_message_at,
        isGroup,
        groupName: channel.data.name || (isGroup ? "Group Chat" : null),
        groupImage: channel.data.image || null,
        topic: channel.data.topic || "",
        targetLanguage: channel.data.targetLanguage || "",
        nativeLanguage: channel.data.nativeLanguage || "",
        memberCount: membersList.length,
        members: membersList,
        otherUser: otherMember ? {
          id: otherMember.user_id,
          name: otherMember.user?.name || 'Unknown User',
          image: otherMember.user?.image,
          online: Boolean(otherMember.user?.online),
        } : null
      };
    });

    res.status(200).json(chatHistory);
  } catch (error) {
    console.log("Error in getChatHistory controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function createGroupChannel(req, res) {
  try {
    const currentUserId = req.user._id.toString();
    const { name, memberIds = [], image, topic, targetLanguage, nativeLanguage } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const allMembers = Array.from(new Set([currentUserId, ...memberIds.map(String)]));
    const channelId = `group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const channel = streamClient.channel("messaging", channelId, {
      name: name.trim(),
      image: image || "",
      created_by_id: currentUserId,
      members: allMembers,
      is_group: true,
      topic: topic?.trim() || "Language Exchange & Conversation Practice",
      targetLanguage: targetLanguage || "",
      nativeLanguage: nativeLanguage || "",
    });

    await channel.create();
    await channel.addModerators([currentUserId]);

    // Send welcome system message
    await channel.sendMessage({
      text: `🎉 Welcome to ${name.trim()}! Start practicing together.`,
      system: true,
      user_id: currentUserId,
    });

    res.status(201).json({
      success: true,
      channelId,
      channel: {
        id: channel.id,
        name: channel.data.name,
        image: channel.data.image,
        members: allMembers,
      },
    });
  } catch (error) {
    console.error("Error creating group channel:", error);
    res.status(500).json({ message: error.message || "Failed to create group" });
  }
}

export async function getGroupMembers(req, res) {
  try {
    const { channelId } = req.params;
    const userId = getUserId(req);
    const { channel } = await getGroupContext(channelId, userId);
    const streamMembers = Object.values(channel.state.members || {});
    const memberIds = streamMembers.map((member) => member.user_id);
    const memberById = new Map(streamMembers.map((member) => [String(member.user_id), member]));
    const users = await User.find({ _id: { $in: memberIds } }).select("-password");

    res.status(200).json(users.map((user) => {
      const profile = user.toObject();
      const member = memberById.get(String(user._id));
      return {
        ...profile,
        online: Boolean(member?.user?.online),
        role: isGroupAdmin(channel, user._id, member) ? "admin" : "member",
      };
    }));
  } catch (error) {
    console.error("Error fetching group members:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Failed to fetch members" });
  }
}

export async function addGroupMembers(req, res) {
  try {
    const { channelId } = req.params;
    const { memberIds = [] } = req.body;
    const userId = getUserId(req);

    const { channel, isAdmin } = await getGroupContext(channelId, userId);
    if (!isAdmin) {
      return res.status(403).json({ message: "Only group admins can add members" });
    }

    if (!memberIds.length) {
      return res.status(400).json({ message: "No members specified to add" });
    }

    await channel.addMembers(memberIds.map(String));

    // Send a system message to notify the channel
    const addedUsers = await User.find({ _id: { $in: memberIds } }).select("fullName");
    const names = addedUsers.map((u) => u.fullName).join(", ") || "new members";
    await channel.sendMessage({
      text: `👋 ${names} joined the group!`,
      system: true,
      user_id: userId,
    });

    const updatedMemberIds = Object.keys(channel.state.members || {});
    const users = await User.find({ _id: { $in: updatedMemberIds } }).select("-password");

    res.status(200).json({ success: true, members: users });
  } catch (error) {
    console.error("Error adding group members:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Failed to add members" });
  }
}

export async function removeGroupMember(req, res) {
  try {
    const { channelId, memberId } = req.params;
    const userId = getUserId(req);
    const { channel, isAdmin } = await getGroupContext(channelId, userId);

    if (!isAdmin) {
      return res.status(403).json({ message: "Only group admins can remove members" });
    }
    if (String(memberId) === userId) {
      return res.status(400).json({ message: "Use Leave Group to remove yourself" });
    }
    if (!findChannelMember(channel, memberId)) {
      return res.status(404).json({ message: "Member not found in this group" });
    }

    await channel.sendMessage({
      text: `A member was removed from ${channel.data.name || "the group"}.`,
      system: true,
      user_id: userId,
    });
    await channel.removeMembers([String(memberId)]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error removing group member:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Failed to remove member" });
  }
}

export async function leaveGroup(req, res) {
  try {
    const { channelId } = req.params;
    const userId = getUserId(req);
    const { channel, isAdmin } = await getGroupContext(channelId, userId);
    const adminIds = getAdminIds(channel);

    if (isAdmin && adminIds.length <= 1) {
      return res.status(409).json({ message: "Promote another admin or delete the group before leaving" });
    }

    await channel.sendMessage({
      text: "A member left the group.",
      system: true,
      user_id: userId,
    });
    await channel.removeMembers([userId]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error leaving group:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Failed to leave group" });
  }
}

export async function updateGroupMemberRole(req, res) {
  try {
    const { channelId, memberId } = req.params;
    const { role } = req.body;
    const userId = getUserId(req);
    const { channel, isAdmin } = await getGroupContext(channelId, userId);

    if (!isAdmin) {
      return res.status(403).json({ message: "Only group admins can change member roles" });
    }
    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({ message: "Role must be admin or member" });
    }
    const targetMember = findChannelMember(channel, memberId);
    if (!targetMember) {
      return res.status(404).json({ message: "Member not found in this group" });
    }

    if (role === "admin") {
      await channel.addModerators([String(memberId)]);
    } else {
      if (isGroupAdmin(channel, memberId, targetMember) && getAdminIds(channel).length <= 1) {
        return res.status(409).json({ message: "A group must have at least one admin" });
      }
      await channel.demoteModerators([String(memberId)]);
    }

    const user = await User.findById(memberId).select("fullName");
    await channel.sendMessage({
      text: `${user?.fullName || "A member"} is now a group ${role}.`,
      system: true,
      user_id: userId,
    });
    res.status(200).json({ success: true, role });
  } catch (error) {
    console.error("Error updating group member role:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Failed to update member role" });
  }
}

export async function deleteGroup(req, res) {
  try {
    const { channelId } = req.params;
    const userId = getUserId(req);
    const { isAdmin } = await getGroupContext(channelId, userId);
    if (!isAdmin) {
      return res.status(403).json({ message: "Only group admins can delete this group" });
    }

    await streamClient.deleteChannels([`messaging:${channelId}`], { hard_delete: true });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Failed to delete group" });
  }
}
