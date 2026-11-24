import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  Search,
  Plus,
  Users,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Sparkles,
  X,
  Globe,
} from "lucide-react";
import Avatar from "../Avatar.jsx";
import { getLanguageFlag } from "../../lib/languageUtils.jsx";
import useOnlineUsers from "../../hooks/useOnlineUsers";
import { formatDate } from "../../lib/utils";
import CreateGroupModal from "./CreateGroupModal.jsx";

export const ChatSidebar = ({
  currentUserId,
  targetUserId,
  friends = [],
  chatHistory = [],
  activeGroupData = null,
  isOpenOnMobile = false,
  onCloseMobile = () => {},
  onOpenCreateGroup = null,
}) => {
  const navigate = useNavigate();
  const { isUserOnline } = useOnlineUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'groups' | 'direct' | 'online'
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(true);
  const [isDirectExpanded, setIsDirectExpanded] = useState(true);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  // Map of friend data by ID for quick profile lookups
  const friendsMap = useMemo(() => {
    const map = new Map();
    friends.forEach((f) => {
      map.set(f._id, f);
    });
    return map;
  }, [friends]);

  // Online partners for the story strip
  const onlineFriends = useMemo(() => {
    return friends.filter((f) => isUserOnline(f._id));
  }, [friends, isUserOnline]);

  // Separate Groups and Direct Chats
  const { groupChats, directChats } = useMemo(() => {
    const groups = [];
    const directs = [];
    const seenDirectIds = new Set();
    const seenGroupIds = new Set();

    chatHistory.forEach((chat) => {
      const isGroup = Boolean(
        chat.isGroup ||
        chat.channelId?.startsWith("group-") ||
        chat.groupName ||
        (chat.members && chat.members.length > 2)
      );

      if (isGroup) {
        if (!seenGroupIds.has(chat.channelId)) {
          seenGroupIds.add(chat.channelId);
          groups.push({
            id: chat.channelId,
            channelId: chat.channelId,
            isGroup: true,
            name: chat.groupName || "Language Group",
            image: chat.groupImage,
            memberCount: chat.memberCount || chat.members?.length || 2,
            topic: chat.topic || "",
            targetLanguage: chat.targetLanguage || "",
            nativeLanguage: chat.nativeLanguage || "",
            isPracticeGroup: Boolean(chat.targetLanguage),
            lastMessage:
              chat.lastMessage?.text ||
              (chat.lastMessage?.call_id
                ? "📞 Voice lounge activity"
                : Boolean(chat.targetLanguage)
                ? "Start practicing together!"
                : "Start chatting!"),
            lastMessageAt: chat.lastMessageAt || chat.lastMessage?.created_at,
            unreadCount: chat.unread_count || 0,
          });
        }
      } else {
        const otherUser = chat.otherUser;
        if (!otherUser || !otherUser.id) return;
        if (seenDirectIds.has(otherUser.id)) return;

        seenDirectIds.add(otherUser.id);
        const fullProfile = friendsMap.get(otherUser.id);

        directs.push({
          id: otherUser.id,
          channelId: chat.channelId,
          isGroup: false,
          name: otherUser.name || fullProfile?.fullName || "Language Partner",
          image: otherUser.image || fullProfile?.profilePic,
          nativeLanguage: fullProfile?.nativeLanguage || "",
          learningLanguage: fullProfile?.learningLanguage || "",
          lastMessage:
            chat.lastMessage?.text ||
            (chat.lastMessage?.call_id ? "📞 Call activity" : ""),
          lastMessageAt: chat.lastMessageAt || chat.lastMessage?.created_at,
          unreadCount: chat.unread_count || 0,
        });
      }
    });

    // Add remaining friends who haven't chatted yet
    friends.forEach((f) => {
      if (!seenDirectIds.has(f._id)) {
        directs.push({
          id: f._id,
          channelId: null,
          isGroup: false,
          name: f.fullName,
          image: f.profilePic,
          nativeLanguage: f.nativeLanguage,
          learningLanguage: f.learningLanguage,
          lastMessage: "Start a conversation!",
          lastMessageAt: null,
          unreadCount: 0,
        });
      }
    });

    // If current target is an active group channel not yet indexed in chatHistory, unshift it so it always shows
    if (
      targetUserId &&
      targetUserId.startsWith("group-") &&
      !seenGroupIds.has(targetUserId)
    ) {
      seenGroupIds.add(targetUserId);
      groups.unshift({
        id: targetUserId,
        channelId: targetUserId,
        isGroup: true,
        name: activeGroupData?.name || "Group Chat",
        image: activeGroupData?.image || null,
        memberCount: activeGroupData?.memberCount || 2,
        topic: activeGroupData?.topic || "",
        targetLanguage: activeGroupData?.targetLanguage || "",
        nativeLanguage: activeGroupData?.nativeLanguage || "",
        isPracticeGroup: Boolean(activeGroupData?.targetLanguage),
        lastMessage: "Start chatting!",
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
      });
    }

    return { groupChats: groups, directChats: directs };
  }, [chatHistory, friends, friendsMap, targetUserId, activeGroupData]);

  // Filtered lists
  const filteredGroups = useMemo(() => {
    if (activeFilter === "direct") return [];
    if (!searchQuery.trim()) return groupChats;
    const q = searchQuery.toLowerCase().trim();
    return groupChats.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.topic.toLowerCase().includes(q) ||
        g.targetLanguage.toLowerCase().includes(q) ||
        g.lastMessage.toLowerCase().includes(q)
    );
  }, [groupChats, searchQuery, activeFilter]);

  const filteredDirects = useMemo(() => {
    if (activeFilter === "groups") return [];
    return directChats.filter((c) => {
      if (activeFilter === "online" && !isUserOnline(c.id)) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.nativeLanguage || "").toLowerCase().includes(q) ||
        (c.learningLanguage || "").toLowerCase().includes(q) ||
        (c.lastMessage || "").toLowerCase().includes(q)
      );
    });
  }, [directChats, searchQuery, activeFilter, isUserOnline]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenOnMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 lg:z-auto w-80 md:w-84 bg-base-200/95 backdrop-blur-md border-r border-base-content/10 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out ${
          isOpenOnMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Header & Search Bar (Exact Template Layout) */}
        <div className="p-4 border-b border-base-content/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-lg tracking-tight text-base-content">
                Chats
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* + Create Group Button */}
              <button
                type="button"
                onClick={() => setIsCreateGroupModalOpen(true)}
                title="Create Language Group"
                className="btn btn-circle btn-sm btn-primary text-primary-content border-none shadow-md shadow-primary/25 transition-transform active:scale-95"
              >
                <Plus className="size-4" />
              </button>

              {/* Close Mobile Button */}
              <button
                type="button"
                onClick={onCloseMobile}
                className="btn btn-ghost btn-circle btn-sm lg:hidden"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats, groups, languages..."
              className="w-full pl-9 pr-8 py-2 rounded-2xl text-xs sm:text-sm font-medium bg-base-100 border border-base-content/20 focus:outline-none focus:border-primary text-base-content placeholder:text-base-content/65 shadow-inner transition-colors"
            />
            <Search className="size-4 absolute left-3 top-2.5 text-base-content/60 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-base-content/60 hover:text-base-content"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filter Categories Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1 rounded-xl font-bold transition-colors flex-shrink-0 ${
                activeFilter === "all"
                  ? "bg-primary text-primary-content shadow-sm"
                  : "bg-base-100 hover:bg-base-300 text-base-content/85"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("groups")}
              className={`px-3 py-1 rounded-xl font-bold transition-colors flex-shrink-0 ${
                activeFilter === "groups"
                  ? "bg-primary text-primary-content shadow-sm"
                  : "bg-base-100 hover:bg-base-300 text-base-content/85"
              }`}
            >
              Groups ({groupChats.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("direct")}
              className={`px-3 py-1 rounded-xl font-bold transition-colors flex-shrink-0 ${
                activeFilter === "direct"
                  ? "bg-primary text-primary-content shadow-sm"
                  : "bg-base-100 hover:bg-base-300 text-base-content/85"
              }`}
            >
              Direct ({directChats.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("online")}
              className={`px-3 py-1 rounded-xl font-bold transition-colors flex-shrink-0 ${
                activeFilter === "online"
                  ? "bg-primary text-primary-content shadow-sm"
                  : "bg-base-100 hover:bg-base-300 text-base-content/85"
              }`}
            >
              Online ({onlineFriends.length})
            </button>
          </div>
        </div>

        {/* Partners Online Horizontal Stories Strip */}
        {onlineFriends.length > 0 && activeFilter !== "groups" && (
          <div className="px-4 py-2.5 border-b border-base-content/10 bg-base-100/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/80">
                Partners Online
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                {onlineFriends.length} Active
              </span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
              {onlineFriends.map((friend) => (
                <div
                  key={friend._id}
                  onClick={() => {
                    navigate(`/chat/${friend._id}`);
                    onCloseMobile();
                  }}
                  className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group"
                >
                  <div className="relative">
                    <Avatar
                      src={friend.profilePic}
                      name={friend.fullName}
                      size="md"
                      showOnline={true}
                      isOnline={true}
                    />
                    {friend.nativeLanguage && (
                      <span className="absolute -top-1 -right-1 text-[11px] drop-shadow-sm select-none">
                        {getLanguageFlag(friend.nativeLanguage)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-base-content group-hover:text-primary truncate w-16 text-center transition-colors">
                    {friend.fullName?.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories & Scrollable Channels List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* ======================================================== */}
          {/* CATEGORY 1: GROUPS & LANGUAGE CLUBS (From Template)      */}
          {/* ======================================================== */}
          {activeFilter !== "direct" && (
            <div className="space-y-1">
              <div
                className="flex items-center justify-between px-2 py-1 select-none cursor-pointer group"
                onClick={() => setIsGroupsExpanded(!isGroupsExpanded)}
              >
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-base-content/80 group-hover:text-base-content">
                  {isGroupsExpanded ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                  <span>Language Clubs & Groups ({filteredGroups.length})</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreateGroupModalOpen(true);
                  }}
                  title="Create New Group"
                  className="p-1 rounded-lg hover:bg-base-300 text-primary font-bold text-xs"
                >
                  +
                </button>
              </div>

              {isGroupsExpanded && (
                <div className="space-y-1.5 pl-1">
                  {filteredGroups.length === 0 ? (
                    <div className="p-3 text-center text-xs text-base-content/75 bg-base-100 rounded-2xl border border-dashed border-base-content/20 font-medium">
                      <p>No groups created yet</p>
                      <button
                        type="button"
                        onClick={() => setIsCreateGroupModalOpen(true)}
                        className="mt-1.5 text-primary hover:underline font-bold text-xs flex items-center justify-center gap-1 mx-auto"
                      >
                        <Plus className="size-3.5" />
                        <span>Create your first group</span>
                      </button>
                    </div>
                  ) : (
                    filteredGroups.map((group) => {
                      const isActive = targetUserId === group.id;

                      return (
                        <div
                          key={group.id}
                          onClick={() => {
                            navigate(`/chat/${group.id}`);
                            onCloseMobile();
                          }}
                          className={`p-2.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all duration-200 select-none ${
                            isActive
                              ? "bg-primary text-primary-content shadow-lg shadow-primary/25 scale-[1.01]"
                              : "hover:bg-base-300/70 bg-base-100/60 border border-base-content/10"
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm ${
                                isActive
                                  ? "bg-primary-content/20 text-primary-content ring-2 ring-primary-content/40"
                                  : "bg-primary/15 text-primary"
                              }`}
                            >
                              {group.image ? (
                                <img
                                  src={group.image}
                                  alt={group.name}
                                  className="w-full h-full rounded-2xl object-cover"
                                />
                              ) : (
                                <Users className="size-5" />
                              )}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success ring-2 ring-base-200"></span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4
                                className={`text-sm font-bold truncate ${
                                  isActive ? "text-primary-content font-extrabold" : "text-base-content"
                                }`}
                              >
                                {group.name}
                              </h4>
                              {group.unreadCount > 0 && (
                                <span className={`w-4 h-4 rounded-full font-extrabold text-[10px] flex items-center justify-center flex-shrink-0 shadow-sm ${
                                  isActive ? "bg-primary-content text-primary" : "bg-primary text-primary-content"
                                }`}>
                                  {group.unreadCount}
                                </span>
                              )}
                            </div>

                            <p
                              className={`text-xs truncate mt-0.5 leading-snug ${
                                isActive ? "text-primary-content/95 font-medium" : "text-base-content/80 font-normal"
                              }`}
                            >
                              {group.lastMessage}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* CATEGORY 2: DIRECT CHATS (From Template)                 */}
          {/* ======================================================== */}
          {activeFilter !== "groups" && (
            <div className="space-y-1 pt-2 border-t border-base-content/10">
              <div
                className="flex items-center justify-between px-2 py-1 select-none cursor-pointer group"
                onClick={() => setIsDirectExpanded(!isDirectExpanded)}
              >
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-base-content/80 group-hover:text-base-content">
                  {isDirectExpanded ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                  <span>Direct Chats ({filteredDirects.length})</span>
                </div>
              </div>

              {isDirectExpanded && (
                <div className="space-y-1.5 pl-1">
                  {filteredDirects.map((chat) => {
                    const isActive = targetUserId === chat.id;
                    const isOnline = isUserOnline(chat.id);

                    return (
                      <div
                        key={chat.id}
                        onClick={() => {
                          navigate(`/chat/${chat.id}`);
                          onCloseMobile();
                        }}
                        className={`p-2.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all duration-200 select-none ${
                          isActive
                            ? "bg-primary text-primary-content shadow-lg shadow-primary/25 scale-[1.01]"
                            : "hover:bg-base-300/70 bg-base-100/60 border border-base-content/10"
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar
                            src={chat.image}
                            name={chat.name}
                            size="md"
                            showOnline={isOnline}
                            isOnline={isOnline}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4
                              className={`text-sm font-bold truncate flex items-center gap-1.5 ${
                                isActive ? "text-primary-content font-extrabold" : "text-base-content"
                              }`}
                            >
                              <span>{chat.name}</span>
                              {chat.nativeLanguage && !isActive && (
                                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-base-300/80 text-base-content/85">
                                  {getLanguageFlag(chat.nativeLanguage)}
                                </span>
                              )}
                            </h4>
                            {chat.lastMessageAt && (
                              <span
                                className={`text-xs flex-shrink-0 font-mono font-medium ${
                                  isActive ? "text-primary-content/90 font-bold" : "text-base-content/75"
                                }`}
                              >
                                {formatDate(chat.lastMessageAt)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <p
                              className={`text-xs truncate leading-snug ${
                                isActive ? "text-primary-content/95 font-medium" : "text-base-content/80 font-normal"
                              }`}
                            >
                              {chat.lastMessage}
                            </p>
                            {chat.unreadCount > 0 && !isActive && (
                              <span className="w-4 h-4 rounded-full bg-primary text-primary-content text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        friends={friends}
        onGroupCreated={(newChannelId) => {
          navigate(`/chat/${newChannelId}`);
          onCloseMobile();
        }}
      />
    </>
  );
};

export default ChatSidebar;
