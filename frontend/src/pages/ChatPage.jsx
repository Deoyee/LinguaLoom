import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import useOnlineUsers from "../hooks/useOnlineUsers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  MessageSimple,
  Thread,
  Window,
} from "stream-chat-react";
import {
  getStreamToken,
  getUserById,
  getUserFriends,
  getChatHistory,
  getGroupMembers,
  unfriendUser,
} from "../lib/api.js";
import ChatLoader from "../components/ChatLoader.jsx";
import CallMessage from "../components/CallMessage.jsx";
import StickerMessage from "../components/StickerMessage.jsx";
import CustomAttachmentSelector from "../components/CustomAttachmentSelector.jsx";
import UserProfileModal from "../components/UserProfileModal.jsx";
import { useCallStore } from "../store/useCallStore";
import { useThemeStore } from "../store/useThemeStore";

// Merged Chat Components
import ChatSidebar from "../components/chat/ChatSidebar.jsx";
import ChatHeader from "../components/chat/ChatHeader.jsx";
import ChatRightDrawer from "../components/chat/ChatRightDrawer.jsx";
import CustomAttachment from "../components/chat/CustomAttachment.jsx";
import { connectUser } from "../lib/stream.js";

const ACTIVE_CHAT_STORAGE_KEY = "hime-active-chat-id";

const readStoredChatId = () => {
  try {
    return window.sessionStorage.getItem(ACTIVE_CHAT_STORAGE_KEY);
  } catch {
    return null;
  }
};

const storeChatId = (chatId) => {
  try {
    window.sessionStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, chatId);
  } catch {
    // Keep chat navigation working when browser storage is unavailable.
  }
};

const ChatPage = () => {
  const { id: routeTargetUserId } = useParams();
  const navigate = useNavigate();
  const [targetUserId, setTargetUserId] = useState(
    () => routeTargetUserId || readStoredChatId()
  );

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  // Group vs Direct Detection
  const isGroup = Boolean(targetUserId?.startsWith("group-"));

  useEffect(() => {
    if (!routeTargetUserId) return;
    storeChatId(routeTargetUserId);
    setTargetUserId(routeTargetUserId);
    navigate("/chat", { replace: true });
  }, [routeTargetUserId, navigate]);

  // UI Panels state (Pane 1 mobile drawer, Pane 3 partner/group vault)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

  useEffect(() => {
    setIsRightDrawerOpen(false);
  }, [targetUserId]);

  // Profile modal state: holds the user object to display in UserProfileModal
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);

  // Set of message IDs whose timestamp/info is currently toggled on
  const [infoMessageIds, setInfoMessageIds] = useState(new Set());

  const toggleMessageInfo = useCallback((msgId) => {
    if (!msgId) return;
    setInfoMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
      } else {
        next.add(msgId);
      }
      return next;
    });
  }, []);

  const {
    startCall,
    startOutgoingCall,
    clearOutgoingCall,
    updateCallMessageId,
  } = useCallStore();
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();
  const { isUserOnline } = useOnlineUsers();
  const { theme } = useThemeStore();

  const isDarkTheme = useMemo(() => {
    const darkThemes = new Set([
      "dark",
      "forest",
      "synthwave",
      "halloween",
      "black",
      "luxury",
      "dracula",
      "business",
      "night",
      "coffee",
      "dim",
      "sunset",
    ]);
    return darkThemes.has(theme);
  }, [theme]);

  const streamTheme = isDarkTheme ? "str-chat__theme-dark" : "str-chat__theme-light";

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // Query partner user ONLY for 1-on-1 direct chats
  const { data: partnerUser } = useQuery({
    queryKey: ["user", targetUserId],
    queryFn: () => getUserById(targetUserId),
    enabled: !isGroup && Boolean(targetUserId && targetUserId.length === 24),
  });

  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: chatHistory = [], refetch: refetchChatHistory } = useQuery({
    queryKey: ["chatHistory"],
    queryFn: getChatHistory,
  });

  // Query group members if in a group chat
  const { data: groupMembers = [], refetch: refetchGroupMembers } = useQuery({
    queryKey: ["groupMembers", targetUserId],
    queryFn: () => getGroupMembers(targetUserId),
    enabled: isGroup && !!targetUserId,
  });

  // Select the first available chat without putting its ID in the URL.
  useEffect(() => {
    if (!targetUserId) {
      if (chatHistory.length > 0) {
        const firstChat = chatHistory[0];
        const nextId = firstChat.isGroup
          ? firstChat.channelId
          : firstChat.otherUser?.id;
        if (nextId) {
          storeChatId(nextId);
          setTargetUserId(nextId);
        }
      } else if (friends.length > 0) {
        storeChatId(friends[0]._id);
        setTargetUserId(friends[0]._id);
      }
    }
  }, [targetUserId, chatHistory, friends]);

  // Aggregate group metadata
  const groupData = useMemo(() => {
    if (!isGroup) return null;
    const historyItem = chatHistory.find((c) => c.channelId === targetUserId);

    return {
      id: targetUserId,
      name:
        channel?.data?.name ||
        historyItem?.groupName ||
        "Language Practice Group",
      image: channel?.data?.image || historyItem?.groupImage || null,
      topic:
        channel?.data?.topic ||
        historyItem?.topic ||
        "Language Exchange & Conversation Practice",
      targetLanguage:
        channel?.data?.targetLanguage ||
        historyItem?.targetLanguage ||
        "Spanish",
      nativeLanguage:
        channel?.data?.nativeLanguage ||
        historyItem?.nativeLanguage ||
        "English",
      memberCount:
        groupMembers.length ||
        historyItem?.memberCount ||
        Object.keys(channel?.state?.members || {}).length ||
        2,
      members: groupMembers,
    };
  }, [isGroup, targetUserId, chatHistory, channel, groupMembers]);

  const handleGroupExit = useCallback((exitedChannelId) => {
    queryClient.setQueryData(["chatHistory"], (history = []) =>
      history.filter((chat) => chat.channelId !== exitedChannelId)
    );
    try {
      window.sessionStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY);
    } catch {
      // The next chat is still selected from the in-memory chat history.
    }
    setTargetUserId(null);
    setIsRightDrawerOpen(false);
    navigate("/chat", { replace: true });
  }, [queryClient, navigate]);

  const isFriend =
    Array.isArray(friends) &&
    friends.some(
      (f) =>
        String(f._id) ===
        String(selectedProfileUser?._id || selectedProfileUser?.id)
    );

  const unfriendMutation = useMutation({
    mutationFn: unfriendUser,
    onSuccess: () => {
      toast.success("Unfriended successfully");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["user", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["chatHistory"] });
    },
    onError: () => {
      toast.error("Failed to unfriend user");
    },
  });

  // Intercept click on call links to open in modal
  useEffect(() => {
    const handleChatClick = (e) => {
      const anchor = e.target.closest("a");
      if (anchor && anchor.href) {
        try {
          const url = new URL(anchor.href);
          if (url.pathname.includes("/call/")) {
            e.preventDefault();
            e.stopPropagation();
            const callId = url.pathname.split("/call/")[1];
            const isAudio = url.searchParams.get("type") === "audio";
            if (callId) {
              startCall({
                callId,
                isAudioOnly: isAudio,
                channelId: channel?.id,
                channelType: channel?.type,
                callerName: isGroup
                  ? groupData?.name
                  : channel?.state?.members?.[targetUserId]?.user?.name,
                callerPic: isGroup
                  ? groupData?.image
                  : channel?.state?.members?.[targetUserId]?.user?.image,
              });
            }
          }
        } catch {
          // ignore
        }
      }
    };

    document.addEventListener("click", handleChatClick, true);
    return () => {
      document.removeEventListener("click", handleChatClick, true);
    };
  }, [channel, startCall, targetUserId, isGroup, groupData]);

  // Initialize Stream Chat Channel (handles both Direct and Groups)
  useEffect(() => {
    let isCancelled = false;

    const initChat = async () => {
      if (!tokenData?.token || !authUser || !targetUserId) return;

      try {
        setLoading(true);

        const client = await connectUser(authUser, tokenData.token);

        let currChannel;

        if (isGroup) {
          // Group Channel: query or watch directly by channel id
          currChannel = client.channel("messaging", targetUserId);
        } else {
          // Direct 1-on-1 Channel: deterministic channelId
          const channelId = [authUser._id, targetUserId].sort().join("-");
          currChannel = client.channel("messaging", channelId, {
            members: [authUser._id, targetUserId],
          });
        }

        await currChannel.watch();

        if (isCancelled) return;

        // Ensure fresh app settings with updated 100MB limit are loaded in browser
        client.appSettingsPromise = client.getAppSettings();

        // Client-side file selection watcher for instant feedback on file sizes
        const handleFileChange = (e) => {
          if (e.target && e.target.type === "file" && e.target.files) {
            const files = Array.from(e.target.files);
            for (const file of files) {
              const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
              if (file.size > 100 * 1024 * 1024) {
                toast.error(
                  `"${file.name}" (${sizeMB}MB) exceeds the 100MB allowed limit. Maximum allowed is 100MB.`,
                  { id: "file-size-limit", duration: 6000 }
                );
              } else if (
                file.type.startsWith("video/") &&
                file.size > 10 * 1024 * 1024
              ) {
                toast(
                  `"${file.name}" is ${sizeMB}MB. Allowed up to 100MB (keep videos under 10MB for fast sending).`,
                  {
                    icon: "ℹ️",
                    id: "video-size-hint",
                    duration: 5000,
                  }
                );
              }
            }
          }
        };

        document.addEventListener("change", handleFileChange, true);

        // Subscribe to upload/attachment notifications so user gets instant toast feedback
        let lastNotifId = null;
        const unsubscribeNotifications = client.notifications?.store?.subscribe?.(
          (state) => {
            const notifications = state?.notifications || [];
            if (notifications.length > 0) {
              const latest = notifications[notifications.length - 1];
              if (latest && latest.id !== lastNotifId) {
                lastNotifId = latest.id;
                if (latest.severity === "error") {
                  if (latest.type?.includes("upload:blocked")) {
                    const reason = latest.metadata?.reason;
                    if (reason === "size_limit") {
                      toast.error(
                        "File exceeds the allowed size limit. Maximum allowed is 100MB.",
                        { id: "upload-blocked" }
                      );
                    } else if (
                      reason?.includes("extension") ||
                      reason?.includes("mime")
                    ) {
                      toast.error("This file format is not supported.", {
                        id: "upload-blocked",
                      });
                    } else {
                      toast.error(`Upload blocked: ${reason || "Invalid file"}`, {
                        id: "upload-blocked",
                      });
                    }
                  } else if (latest.type?.includes("upload:failed")) {
                    const rawReason =
                      latest.metadata?.reason || latest.message || "";
                    if (rawReason.toLowerCase().includes("timeout")) {
                      toast.error(
                        "Upload timed out. Allowed limit is 100MB (keep videos under 10MB for fast sending).",
                        { id: "upload-failed", duration: 6000 }
                      );
                    } else {
                      toast.error(
                        `Upload failed: ${rawReason || "Failed to upload file"}`,
                        { id: "upload-failed" }
                      );
                    }
                  }
                }
              }
            }
          }
        );

        setChatClient(client);
        setChannel(currChannel);

        return () => {
          document.removeEventListener("change", handleFileChange, true);
          unsubscribeNotifications?.();
        };
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    initChat();

    return () => {
      isCancelled = true;
    };
  }, [tokenData, authUser, targetUserId, isGroup]);

  const beginOutgoingCall = useCallback(async (isAudioOnly) => {
    if (!channel) return;

    const callSessionId = `${channel.id}-${Date.now()}`;
    const recipient = channel?.state?.members?.[targetUserId]?.user;
    const callData = {
      callId: callSessionId,
      isAudioOnly,
      channelId: channel.id,
      channelType: channel.type,
      callerName: isGroup ? groupData?.name : recipient?.name || partnerUser?.fullName,
      callerPic: isGroup ? groupData?.image : recipient?.image || partnerUser?.profilePic,
      isCaller: true,
      messageId: null,
    };

    startOutgoingCall(callData);
    try {
      const { message } = await channel.sendMessage({
        text: isAudioOnly
          ? isGroup ? "📞 Group Voice Lounge invitation" : "📞 Voice call invitation"
          : isGroup ? "📹 Group Video Lounge invitation" : "📹 Video call invitation",
        call_id: callSessionId,
        call_type: isAudioOnly ? "audio" : "video",
        call_status: "started",
      });
      updateCallMessageId(callSessionId, message?.id);
    } catch (error) {
      clearOutgoingCall(callSessionId);
      console.error("Could not send call invitation:", error);
      toast.error("Could not send the call invitation. Please try again.");
    }
  }, [channel, targetUserId, isGroup, groupData, partnerUser, startOutgoingCall, clearOutgoingCall, updateCallMessageId]);

  const handleVideoCall = useCallback(
    () => beginOutgoingCall(false),
    [beginOutgoingCall]
  );

  const handleVoiceCall = useCallback(
    () => beginOutgoingCall(true),
    [beginOutgoingCall]
  );

  // Custom Message Renderer with Audio Waveform, Video Cards & File Chips
  const CustomMessage = useCallback(
    (props) => {
      const { message, isMyMessage } = props;
      if (message?.custom_type === "call_signal") return null;
      const text = message?.text || "";
      const lower = text.toLowerCase();
      const isCall =
        Boolean(message?.call_id) ||
        Boolean(message?.call_type) ||
        message?.call_status === "started" ||
        message?.call_status === "missed" ||
        message?.call_status === "ended" ||
        message?.custom_type === "call" ||
        text.includes("/call/") ||
        text.startsWith("📞") ||
        text.startsWith("📹") ||
        (lower.includes("call") &&
          (lower.includes("voice") ||
            lower.includes("video") ||
            lower.includes("started") ||
            lower.includes("missed") ||
            lower.includes("ended")));

      const isMine =
        typeof isMyMessage === "function"
          ? isMyMessage()
          : Boolean(
              isMyMessage ??
                (message?.user?.id === (authUser?._id || authUser?.id))
            );

      // Check if message is a sticker
      const isSticker =
        message?.custom_type === "sticker" ||
        message?.attachments?.some(
          (a) => a.custom_type === "sticker" || a.type === "sticker"
        );

      if (isSticker) {
        return <StickerMessage message={message} isMyMessage={isMine} />;
      }

      if (isCall) {
        return (
          <CallMessage
            message={message}
            isMyMessage={isMine}
            onCallBack={(isAudio) => {
              if (isAudio) {
                handleVoiceCall();
              } else {
                handleVideoCall();
              }
            }}
          />
        );
      }

      const isInfoVisible = infoMessageIds.has(message?.id);

      return (
        <div
          className={`custom-msg-wrapper ${
            isInfoVisible ? "show-time str-chat__message--show-info" : ""
          }`}
          onClick={(e) => {
            if (
              e.target.closest("a") ||
              e.target.closest("button") ||
              e.target.closest(".str-chat__message-options") ||
              e.target.closest(".str-chat__message-actions-box")
            ) {
              return;
            }
            if (
              e.target.closest(".str-chat__message-bubble") ||
              e.target.closest(".str-chat__message-text") ||
              e.target.closest(".str-chat__message-status")
            ) {
              toggleMessageInfo(message?.id);
            }
          }}
        >
          <MessageSimple
            {...props}
            Attachment={(attProps) => (
              <CustomAttachment {...attProps} isMyMessage={isMine} />
            )}
          />
        </div>
      );
    },
    [handleVoiceCall, handleVideoCall, authUser, infoMessageIds, toggleMessageInfo]
  );

  const customMessageActions = useMemo(
    () => ({
      "Message Info": (msg) => {
        toggleMessageInfo(msg.id);
        const time = msg.created_at
          ? new Date(msg.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Recently";
        const date = msg.created_at
          ? new Date(msg.created_at).toLocaleDateString([], {
              month: "short",
              day: "numeric",
            })
          : "Today";
        const status =
          msg.status === "received"
            ? "Delivered"
            : msg.status === "sending"
            ? "Sending..."
            : "Sent";
        toast(`Sent: ${date} at ${time} • ${status}`, {
          icon: "ℹ️",
          duration: 3500,
        });
      },
    }),
    [toggleMessageInfo]
  );

  const audioRecordingConfig = useMemo(
    () => ({
      mediaRecorderConfig: {
        audioBitsPerSecond: 128000,
      },
      transcoderConfig: {
        sampleRate: 48000,
        encoder: async (file) => file,
      },
    }),
    []
  );

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-full w-full flex flex-row flex-1 min-h-0 bg-base-100 overflow-hidden m-0 p-0 relative">
      {/* ======================================================== */}
      {/* PANE 1: CURVED SIDEBAR (CLUBS & DIRECT CHATS)             */}
      {/* ======================================================== */}
      <ChatSidebar
        currentUserId={authUser?._id}
        targetUserId={targetUserId}
        friends={friends}
        chatHistory={chatHistory}
        isOpenOnMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* ======================================================== */}
      {/* PANE 2: MAIN CONVERSATION CANVAS                         */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-base-100 relative overflow-hidden">
        <Chat client={chatClient} theme={streamTheme}>
          <Channel
            channel={channel}
            Message={CustomMessage}
            Attachment={CustomAttachment}
            AttachmentSelector={CustomAttachmentSelector}
            customMessageActions={customMessageActions}
          >
            <div className="w-full h-full relative flex flex-col flex-1 min-h-0">
              {/* Header with Group Avatar Stack, Calling, & Controls */}
              <ChatHeader
                isGroup={isGroup}
                groupData={groupData}
                partnerUser={partnerUser}
                channelMember={channel?.state?.members?.[targetUserId]}
                channelMembers={groupMembers}
                isOnline={isGroup ? false : isUserOnline(targetUserId)}
                onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
                onToggleRightDrawer={() => setIsRightDrawerOpen((prev) => !prev)}
                isRightDrawerOpen={isRightDrawerOpen}
                onVoiceCall={handleVoiceCall}
                onVideoCall={handleVideoCall}
                onViewMemberProfile={(member) => setSelectedProfileUser(member)}
              />

              <Window>
                <MessageList Message={CustomMessage} />

                {/* Floating Modern Message Input */}
                <div className="relative flex flex-col">
                  <MessageInput
                    focus
                    audioRecordingEnabled={true}
                    audioRecordingConfig={audioRecordingConfig}
                  />
                  <div className="px-4 py-1.5 flex items-center justify-between text-xs text-base-content/85 bg-base-200 border-t border-base-content/10 select-none font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>
                        Allowed size:{" "}
                        <strong className="text-base-content font-bold">
                          100 MB
                        </strong>{" "}
                        per file &bull; Videos under{" "}
                        <strong className="text-base-content font-bold">
                          10 MB
                        </strong>{" "}
                        recommended
                      </span>
                    </span>
                    <span className="hidden sm:inline-block text-xs text-base-content/70">
                      Supports: JPG, PNG, GIF, MP4, PDF, DOCX, ZIP & more
                    </span>
                  </div>
                </div>
              </Window>
            </div>
            <Thread />
          </Channel>
        </Chat>
      </div>

      {/* ======================================================== */}
      {/* PANE 3: ALL MEMBERS, VOCAB BANK & SHARED MEDIA (2x2)    */}
      {/* ======================================================== */}
      <ChatRightDrawer
        isOpen={isRightDrawerOpen}
        onClose={() => setIsRightDrawerOpen(false)}
        isGroup={isGroup}
        groupData={groupData}
        groupMembers={groupMembers}
        currentUserId={authUser?._id || authUser?.id}
        partnerUser={partnerUser}
        channelMember={channel?.state?.members?.[targetUserId]}
        isOnline={isGroup ? false : isUserOnline(targetUserId)}
        channel={channel}
        friends={friends}
        onVoiceCall={handleVoiceCall}
        onVideoCall={handleVideoCall}
        onViewProfile={() => setSelectedProfileUser(partnerUser)}
        onViewMemberProfile={(member) => setSelectedProfileUser(member)}
        onMembersUpdated={() => {
          refetchGroupMembers();
          refetchChatHistory();
        }}
        onGroupExit={handleGroupExit}
      />

      {/* ======================================================== */}
      {/* USER PROFILE MODAL (CLICK ANY GROUP MEMBER OR PARTNER)  */}
      {/* ======================================================== */}
      {selectedProfileUser && (
        <UserProfileModal
          isOpen={Boolean(selectedProfileUser)}
          onClose={() => setSelectedProfileUser(null)}
          user={{
            _id: selectedProfileUser._id || selectedProfileUser.id,
            fullName:
              selectedProfileUser.fullName ||
              selectedProfileUser.name ||
              "Language Partner",
            profilePic:
              selectedProfileUser.profilePic || selectedProfileUser.image,
            bio: selectedProfileUser.bio,
            nativeLanguage: selectedProfileUser.nativeLanguage,
            learningLanguage: selectedProfileUser.learningLanguage,
            location: selectedProfileUser.location,
            city: selectedProfileUser.city,
            createdAt: selectedProfileUser.createdAt,
          }}
          isFriend={isFriend}
          onUnfriend={(u) => unfriendMutation.mutate(u._id || u.id)}
        />
      )}
    </div>
  );
};

export default ChatPage;
