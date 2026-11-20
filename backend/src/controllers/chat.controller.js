import { generateStreamToken } from "../lib/stream.js";
import { StreamChat } from "stream-chat";
import User from "../models/User.js";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;
const streamClient = StreamChat.getInstance(apiKey, apiSecret);

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
        role: m.role || 'member',
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

    // Send welcome system message
    await channel.sendMessage({
      text: `🎉 Welcome to ${name.trim()}! Start practicing together.`,
      system: true,
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
    const channel = streamClient.channel("messaging", channelId);
    await channel.query({ state: true, messages: { limit: 0 } });

    const memberIds = Object.keys(channel.state.members || {});
    const users = await User.find({ _id: { $in: memberIds } }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching group members:", error);
    res.status(500).json({ message: "Failed to fetch members" });
  }
}

export async function addGroupMembers(req, res) {
  try {
    const { channelId } = req.params;
    const { memberIds = [] } = req.body;

    if (!memberIds.length) {
      return res.status(400).json({ message: "No members specified to add" });
    }

    const channel = streamClient.channel("messaging", channelId);
    await channel.addMembers(memberIds.map(String));

    // Send a system message to notify the channel
    const addedUsers = await User.find({ _id: { $in: memberIds } }).select("fullName");
    const names = addedUsers.map((u) => u.fullName).join(", ") || "new members";
    await channel.sendMessage({
      text: `👋 ${names} joined the group!`,
      system: true,
    });

    const updatedMemberIds = Object.keys(channel.state.members || {});
    const users = await User.find({ _id: { $in: updatedMemberIds } }).select("-password");

    res.status(200).json({ success: true, members: users });
  } catch (error) {
    console.error("Error adding group members:", error);
    res.status(500).json({ message: error.message || "Failed to add members" });
  }
}
