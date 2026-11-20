import React, { useState, useMemo } from "react";
import {
  X,
  Phone,
  Video,
  User,
  Image as ImageIcon,
  FileText,
  Link2,
  CheckSquare,
  Square,
  Download,
  ExternalLink,
  MapPin,
  Calendar,
  Languages,
  Users,
  UserPlus,
  UserMinus,
  LogOut,
  Trash2,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Search,
  Check,
  Loader2,
} from "lucide-react";
import Avatar from "../Avatar.jsx";
import { getLanguageFlag } from "../../lib/languageUtils.jsx";
import { formatDate } from "../../lib/utils";
import GroupVocabVault from "./GroupVocabVault.jsx";
import FilePreviewModal from "./FilePreviewModal.jsx";
import toast from "react-hot-toast";
import {
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
  updateGroupMemberRole,
  deleteGroup,
} from "../../lib/api.js";

export const ChatRightDrawer = ({
  isOpen = false,
  onClose = () => {},
  isGroup = false,
  groupData = null,
  groupMembers = [],
  currentUserId,
  partnerUser,
  channelMember,
  isOnline = false,
  channel,
  friends = [],
  onVoiceCall = () => {},
  onVideoCall = () => {},
  onViewProfile = () => {},
  onViewMemberProfile = () => {},
  onMembersUpdated = () => {},
  onGroupExit = () => {},
}) => {
  const [activeTab, setActiveTab] = useState("members"); // 'members' | 'vocab' | 'media' | 'files'
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [selectedFriendIdsToAdd, setSelectedFriendIdsToAdd] = useState([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [groupActionId, setGroupActionId] = useState(null);
  const [groupConfirmation, setGroupConfirmation] = useState(null);

  // 1-on-1 Practice Goals
  const [goals, setGoals] = useState([
    { id: 1, text: "15 min pronunciation practice", completed: true },
    { id: 2, text: "Review irregular verb forms", completed: false },
    { id: 3, text: "Exchange 5 new slang phrases", completed: false },
  ]);

  const toggleGoal = (id) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    );
  };

  // Group metadata
  const groupName =
    groupData?.name || groupData?.groupName || "Language Practice Club";
  const groupImage = groupData?.image || groupData?.groupImage;
  const topic =
    groupData?.topic || "Collaborative Language Exchange & Practice";
  const targetLang = groupData?.targetLanguage;
  const nativeLang = groupData?.nativeLanguage;
  const isGroupAdmin = groupMembers.some(
    (member) =>
      String(member._id || member.id) === String(currentUserId) &&
      member.role === "admin"
  );

  // 1-on-1 Partner metadata
  const partnerName =
    partnerUser?.fullName || channelMember?.user?.name || "Language Partner";
  const partnerImage = partnerUser?.profilePic || channelMember?.user?.image;
  const partnerNativeLang = partnerUser?.nativeLanguage;
  const partnerLearningLang = partnerUser?.learningLanguage;
  const partnerBio =
    partnerUser?.bio || "Learning languages, connecting cultures.";
  const partnerLocation = partnerUser?.city
    ? `${partnerUser.city}${partnerUser.location ? `, ${partnerUser.location}` : ""}`
    : partnerUser?.location || "";

  // Available friends to add (friends not already in group)
  const existingMemberIds = useMemo(() => {
    return new Set(groupMembers.map((m) => String(m._id || m.id)));
  }, [groupMembers]);

  const availableFriendsToAdd = useMemo(() => {
    return friends.filter((f) => !existingMemberIds.has(String(f._id)));
  }, [friends, existingMemberIds]);

  const filteredFriendsToAdd = useMemo(() => {
    if (!memberSearchQuery.trim()) return availableFriendsToAdd;
    const q = memberSearchQuery.toLowerCase();
    return availableFriendsToAdd.filter(
      (f) =>
        f.fullName?.toLowerCase().includes(q) ||
        f.nativeLanguage?.toLowerCase().includes(q)
    );
  }, [availableFriendsToAdd, memberSearchQuery]);

  const toggleSelectFriendToAdd = (id) => {
    setSelectedFriendIdsToAdd((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleAddMembersSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFriendIdsToAdd.length) {
      toast.error("Please select at least 1 friend to add");
      return;
    }

    try {
      setIsAddingMembers(true);
      await addGroupMembers(channel.id, selectedFriendIdsToAdd);
      toast.success("Members added to group! 🎉");
      setSelectedFriendIdsToAdd([]);
      setIsAddMemberOpen(false);
      onMembersUpdated();
    } catch (err) {
      console.error("Error adding members:", err);
      toast.error(err?.response?.data?.message || "Failed to add members");
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleRemoveGroupMember = (member) => {
    const memberId = String(member._id || member.id);
    const memberName = member.fullName || member.name || "this member";
    setGroupConfirmation({
      title: `Remove ${memberName}?`,
      description: `They will lose access to ${groupName}. An admin can invite them again later.`,
      confirmLabel: "Remove member",
      actionId: memberId,
      destructive: true,
      onConfirm: async () => {
        try {
          setGroupActionId(memberId);
          await removeGroupMember(channel.id, memberId);
          toast.success(`${memberName} removed from the group`);
          setGroupConfirmation(null);
          await onMembersUpdated();
        } catch (error) {
          toast.error(error.response?.data?.message || "Could not remove this member");
        } finally {
          setGroupActionId(null);
        }
      },
    });
  };

  const handleSetMemberRole = async (member) => {
    const memberId = String(member._id || member.id);
    const nextRole = member.role === "admin" ? "member" : "admin";
    try {
      setGroupActionId(memberId);
      await updateGroupMemberRole(channel.id, memberId, nextRole);
      toast.success(nextRole === "admin" ? "Admin privileges granted" : "Admin privileges removed");
      await onMembersUpdated();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update this member's role");
    } finally {
      setGroupActionId(null);
    }
  };

  const handleLeaveGroup = () => {
    setGroupConfirmation({
      title: `Leave ${groupName}?`,
      description: "You will lose access to the group. You will need an invitation to rejoin.",
      confirmLabel: "Leave group",
      actionId: "leave",
      destructive: false,
      onConfirm: async () => {
        try {
          setGroupActionId("leave");
          await leaveGroup(channel.id);
          toast.success(`You left ${groupName}`);
          setGroupConfirmation(null);
          onGroupExit(channel.id);
        } catch (error) {
          toast.error(error.response?.data?.message || "Could not leave this group");
        } finally {
          setGroupActionId(null);
        }
      },
    });
  };

  const handleDeleteGroup = () => {
    setGroupConfirmation({
      title: `Delete ${groupName}?`,
      description: "This permanently removes the group and its messages for everyone. This action cannot be undone.",
      confirmLabel: "Delete group",
      actionId: "delete",
      destructive: true,
      onConfirm: async () => {
        try {
          setGroupActionId("delete");
          await deleteGroup(channel.id);
          toast.success(`${groupName} was deleted`);
          setGroupConfirmation(null);
          onGroupExit(channel.id);
        } catch (error) {
          toast.error(error.response?.data?.message || "Could not delete this group");
        } finally {
          setGroupActionId(null);
        }
      },
    });
  };

  // Dynamically extract attachments and links from Stream Channel messages
  const { videoList, imageList, filesList, linksList } = useMemo(() => {
    const videos = [];
    const images = [];
    const files = [];
    const links = [];

    const messages = channel?.state?.messages || [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    messages.forEach((msg) => {
      // 1. Text URLs
      if (msg.text) {
        const matches = msg.text.match(urlRegex);
        if (matches) {
          matches.forEach((u) => {
            try {
              const urlObj = new URL(u);
              links.push({
                id: `${msg.id}-${u}`,
                url: u,
                domain: urlObj.hostname.replace("www.", ""),
                date: msg.created_at,
              });
            } catch {
              // ignore invalid url
            }
          });
        }
      }

      // 2. Attachments
      if (msg.attachments && Array.isArray(msg.attachments)) {
        msg.attachments.forEach((att, idx) => {
          const type = att.type || "";
          const isImage = type === "image" || att.image_url;
          const isVideo =
            type === "video" ||
            att.video_url ||
            att.asset_url?.includes(".mp4") ||
            att.mime_type?.includes("video");
          const isAudio =
            type === "audio" ||
            att.asset_url?.includes(".mp3") ||
            att.asset_url?.includes(".webm");

          if (isVideo) {
            videos.push({
              id: `${msg.id}-${idx}`,
              url: att.asset_url || att.video_url,
              name: att.title || att.fallback || "Video clip",
              size: att.file_size
                ? `${(att.file_size / (1024 * 1024)).toFixed(1)} MB`
                : "2.4 MB",
              date: msg.created_at,
            });
          } else if (isImage) {
            images.push({
              id: `${msg.id}-${idx}`,
              url: att.asset_url || att.image_url,
              name: att.title || att.fallback || "Photo",
              date: msg.created_at,
            });
          } else if (!isAudio) {
            files.push({
              id: `${msg.id}-${idx}`,
              url: att.asset_url || att.url,
              name: att.title || att.fallback || "Document.pdf",
              size: att.file_size
                ? `${(att.file_size / (1024 * 1024)).toFixed(1)} MB`
                : "File",
              date: msg.created_at,
            });
          }
        });
      }
    });

    return {
      videoList: videos.reverse(),
      imageList: images.reverse(),
      filesList: files.reverse(),
      linksList: links.reverse(),
    };
  }, [channel]);

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile/Tablet Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm xl:hidden transition-opacity"
        onClick={onClose}
      />

      <aside className="fixed xl:static top-0 bottom-0 right-0 z-50 xl:z-auto w-80 md:w-88 bg-base-200/95 backdrop-blur-md border-l border-base-content/10 flex flex-col h-full flex-shrink-0 select-none shadow-2xl xl:shadow-none animate-fadeIn">
        {/* Drawer Header */}
        <div className="h-16 px-4 border-b border-base-content/10 flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-base-content flex items-center gap-1.5">
            {isGroup ? (
              <>
                <Users className="size-4 text-primary" />
                <span>Group Details</span>
              </>
            ) : (
              <>
                <User className="size-4 text-primary" />
                <span>Partner Details</span>
              </>
            )}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
            aria-label="Close details"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* ======================================================== */}
          {/* GROUP MODE TOP PROFILE CARD                              */}
          {/* ======================================================== */}
          {isGroup ? (
            <div className="flex flex-col items-center text-center pb-4 border-b border-base-content/10">
              <div className="relative mb-3">
                {groupImage ? (
                  <img
                    src={groupImage}
                    alt={groupName}
                    className="w-16 h-16 rounded-2xl object-cover ring-4 ring-primary/20 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary font-bold flex items-center justify-center text-2xl shadow-md border border-primary/25">
                    <Users className="size-8" />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-content text-[9px] font-bold shadow">
                  {groupMembers.length}
                </span>
              </div>

              <h3 className="font-bold text-lg text-base-content px-2">
                {groupName}
              </h3>

              {topic && (
                <p className="text-xs text-base-content/85 mt-1 font-medium px-2 max-w-xs">
                  "{topic}"
                </p>
              )}

              {/* Language Tags */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2.5">
                {targetLang && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/25">
                    {getLanguageFlag(targetLang)} {targetLang} Practice
                  </span>
                )}
                {nativeLang && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary/15 text-secondary border border-secondary/25">
                    {getLanguageFlag(nativeLang)} {nativeLang} Exchange
                  </span>
                )}
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2 mt-4 w-full justify-center">
                <button
                  type="button"
                  onClick={onVoiceCall}
                  className="btn btn-sm btn-ghost bg-base-300 hover:bg-primary/20 text-xs font-medium gap-1.5 rounded-xl flex-1 hover:text-primary"
                  title="Group Voice Lounge"
                >
                  <Phone className="size-3.5 text-primary" />
                  <span>Lounge</span>
                </button>
                <button
                  type="button"
                  onClick={onVideoCall}
                  className="btn btn-sm btn-primary text-primary-content text-xs font-medium gap-1.5 rounded-xl flex-1"
                  title="Group Video Call"
                >
                  <Video className="size-3.5" />
                  <span>Video</span>
                </button>
                {isGroupAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsAddMemberOpen(true)}
                    className="btn btn-sm btn-outline border-base-content/20 hover:border-primary hover:text-primary text-xs font-medium gap-1.5 rounded-xl flex-1"
                    title="Add friends to group"
                  >
                    <UserPlus className="size-3.5 text-primary" />
                    <span>Add</span>
                  </button>
                )}
              </div>

              <div className="mt-3 flex w-full gap-2">
                <button
                  type="button"
                  onClick={handleLeaveGroup}
                  disabled={Boolean(groupActionId)}
                  className="btn btn-xs flex-1 gap-1.5 rounded-lg border-base-content/15 bg-base-100/70 text-base-content/75"
                >
                  <LogOut className="size-3.5" /> Leave group
                </button>
                {isGroupAdmin && (
                  <button
                    type="button"
                    onClick={handleDeleteGroup}
                    disabled={Boolean(groupActionId)}
                    className="btn btn-xs flex-1 gap-1.5 rounded-lg border-error/25 bg-error/10 text-error hover:bg-error hover:text-error-content"
                  >
                    <Trash2 className="size-3.5" /> Delete group
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* 1-ON-1 DIRECT TOP PROFILE CARD                           */
            /* ======================================================== */
            <div className="flex flex-col items-center text-center pb-4 border-b border-base-content/10">
              <div className="relative mb-3">
                <Avatar
                  src={partnerImage}
                  name={partnerName}
                  size="lg"
                  showOnline={isOnline}
                  isOnline={isOnline}
                />
              </div>

              <h3 className="font-bold text-lg text-base-content">
                {partnerName}
              </h3>

              {partnerLocation && (
                <p className="text-xs font-medium text-base-content/80 flex items-center gap-1 mt-0.5">
                  <MapPin className="size-3 text-primary" />
                  <span>{partnerLocation}</span>
                </p>
              )}

              <p className="text-xs font-medium text-base-content/85 mt-2 px-2 max-w-xs">
                "{partnerBio}"
              </p>

              {/* Language Pairings */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                {partnerNativeLang && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/25">
                    {getLanguageFlag(partnerNativeLang)} {partnerNativeLang} (Native)
                  </span>
                )}
                {partnerLearningLang && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary/15 text-secondary border border-secondary/25">
                    {getLanguageFlag(partnerLearningLang)} {partnerLearningLang} (Learning)
                  </span>
                )}
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2 mt-4 w-full justify-center">
                <button
                  type="button"
                  onClick={onVoiceCall}
                  className="btn btn-sm btn-ghost bg-base-300 hover:bg-primary/20 hover:text-primary text-xs font-medium gap-1.5 rounded-xl flex-1"
                >
                  <Phone className="size-3.5" />
                  <span>Call</span>
                </button>
                <button
                  type="button"
                  onClick={onVideoCall}
                  className="btn btn-sm btn-primary text-primary-content text-xs font-medium gap-1.5 rounded-xl flex-1"
                >
                  <Video className="size-3.5" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={onViewProfile}
                  className="btn btn-sm btn-outline border-base-content/20 hover:border-primary hover:text-primary text-xs font-medium gap-1.5 rounded-xl flex-1"
                >
                  <User className="size-3.5" />
                  <span>Profile</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* GROUP MEMBERS SECTION (EXPLICIT USER REQUIREMENT)        */}
          {/* ======================================================== */}
          {isGroup && (
            <div className="space-y-3 pb-3 border-b border-base-content/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-base-content flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" />
                  <span>Group Members ({groupMembers.length})</span>
                </span>
                {isGroupAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsAddMemberOpen(true)}
                    className="btn btn-xs rounded-xl bg-primary/15 hover:bg-primary/25 text-primary font-bold gap-1"
                  >
                    <UserPlus className="size-3" />
                    <span>Add</span>
                  </button>
                )}
              </div>

              {/* Member List Cards */}
              <div className="space-y-2">
                {groupMembers.map((member) => {
                  const memberId = String(member._id || member.id);
                  const isCurrentMember = memberId === String(currentUserId);
                  return (
                    <div
                      key={memberId}
                      onClick={() => onViewMemberProfile(member)}
                      className="p-2.5 rounded-2xl bg-base-100 hover:bg-primary/10 border border-base-content/10 hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between gap-2.5 group shadow-sm"
                      title={`Click to view ${member.fullName || member.name}'s profile`}
                    >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        <Avatar
                          src={member.profilePic || member.image}
                          name={member.fullName || member.name}
                          size="sm"
                          showOnline={member.online}
                          isOnline={member.online}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-base-content truncate group-hover:text-primary transition-colors">
                          {member.fullName || member.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-base-content/60 truncate">
                          {member.nativeLanguage && (
                            <span>
                              {getLanguageFlag(member.nativeLanguage)} {member.nativeLanguage}
                            </span>
                          )}
                          {member.role === "admin" && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 font-bold text-[9px]">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                      <div className="flex shrink-0 items-center gap-0.5" onClick={(event) => event.stopPropagation()}>
                        {isGroupAdmin && !isCurrentMember && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSetMemberRole(member)}
                              disabled={groupActionId === memberId}
                              className="btn btn-ghost btn-circle btn-xs text-amber-500 hover:bg-amber-500/10"
                              title={member.role === "admin" ? "Remove admin privileges" : "Make group admin"}
                              aria-label={member.role === "admin" ? `Demote ${member.fullName || member.name}` : `Promote ${member.fullName || member.name}`}
                            >
                              <ShieldCheck className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveGroupMember(member)}
                              disabled={groupActionId === memberId}
                              className="btn btn-ghost btn-circle btn-xs text-error/70 hover:bg-error/10 hover:text-error"
                              title="Remove member"
                              aria-label={`Remove ${member.fullName || member.name} from group`}
                            >
                              <UserMinus className="size-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => onViewMemberProfile(member)}
                          className="btn btn-ghost btn-circle btn-xs text-base-content/60 group-hover:text-primary group-hover:bg-primary/20"
                          title="View Profile"
                        >
                          <User className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STANDOUT FEATURE: GROUP VOCABULARY BANK                  */}
          {/* ======================================================== */}
          {isGroup ? (
            <div className="pb-3 border-b border-base-content/10">
              <GroupVocabVault
                channelId={channel?.id}
                targetLanguage={targetLang || "Spanish"}
              />
            </div>
          ) : (
            /* 1-on-1 Practice Goals (Image 3) */
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-primary">
                <span className="flex items-center gap-1.5">
                  <span>🎯 Practice Goals</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                  {goals.filter((g) => g.completed).length}/{goals.length}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-base-content">
                {goals.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => toggleGoal(g.id)}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {g.completed ? (
                      <CheckSquare className="size-4 text-primary flex-shrink-0" />
                    ) : (
                      <Square className="size-4 opacity-40 flex-shrink-0" />
                    )}
                    <span
                      className={
                        g.completed ? "line-through opacity-50" : "font-medium"
                      }
                    >
                      {g.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TEMPLATE SECTION: VIDEOS (2x2 Grid with Sizes & Arrows)  */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content flex items-center gap-1.5">
                <Video className="size-3.5 text-primary" />
                <span>Videos ({videoList.length})</span>
              </span>
            </div>

            {videoList.length === 0 ? (
              <div className="p-4 rounded-2xl bg-base-100/60 border border-dashed border-base-content/10 text-center text-xs opacity-50">
                No videos shared yet
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {videoList.slice(0, 4).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setPreviewFile({ url: v.url, name: v.name, type: "video" })}
                    className="p-3 rounded-2xl bg-base-100 border border-base-content/10 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between aspect-square group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                        <Video className="size-3.5" />
                      </div>
                      <Video className="size-3.5 text-base-content/40 group-hover:text-primary transition-all" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-base-content truncate group-hover:text-primary transition-colors">
                        {v.name}
                      </p>
                      <p className="text-[10px] text-base-content/50 font-mono mt-0.5">
                        {v.size}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* TEMPLATE SECTION: IMAGES (2x2 Photo Collage)             */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content flex items-center gap-1.5">
                <ImageIcon className="size-3.5 text-primary" />
                <span>Images ({imageList.length})</span>
              </span>
            </div>

            {imageList.length === 0 ? (
              <div className="p-4 rounded-2xl bg-base-100/60 border border-dashed border-base-content/10 text-center text-xs opacity-50">
                No photos shared yet
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {imageList.slice(0, 4).map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setPreviewFile({ url: img.url, name: img.name, type: "image" })}
                    className="group relative rounded-2xl overflow-hidden aspect-square bg-black/40 block shadow-sm border border-base-content/10"
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* TEMPLATE SECTION: FILES (Document List with Sizes)       */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                <span>Files ({filesList.length})</span>
              </span>
            </div>

            {filesList.length === 0 ? (
              <div className="p-4 rounded-2xl bg-base-100/60 border border-dashed border-base-content/10 text-center text-xs opacity-50">
                No documents shared yet
              </div>
            ) : (
              <div className="space-y-2">
                {filesList.slice(0, 4).map((f) => (
                  <div
                    key={f.id}
                    className="p-2.5 rounded-2xl bg-base-100 border border-base-content/10 flex items-center justify-between gap-2.5 hover:border-primary/40 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewFile({ url: f.url, name: f.name })}
                      disabled={!f.url}
                      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg text-left disabled:cursor-default"
                      title={`Preview ${f.name}`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-base-content truncate">
                          {f.name}
                        </p>
                        <p className="text-[10px] opacity-60">
                          {f.size} &bull; {formatDate(f.date)}
                        </p>
                      </div>
                    </button>
                    {f.url && (
                      <a
                        href={f.url}
                        download={f.name}
                        className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-base-content"
                      >
                        <Download className="size-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* ADD MEMBER MODAL                                         */}
      {/* ======================================================== */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-base-200 border border-base-content/10 rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <UserPlus className="size-4" />
                </div>
                <h3 className="font-bold text-sm text-base-content">
                  Add Friends to Group
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(false)}
                className="btn btn-ghost btn-circle btn-xs"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Friend Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
              <input
                type="text"
                placeholder="Search friends..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="input input-sm w-full pl-9 rounded-2xl bg-base-100 border-base-content/10 text-xs focus:border-primary"
              />
            </div>

            {/* Friend List Selection */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {filteredFriendsToAdd.length === 0 ? (
                <p className="text-xs text-center py-6 opacity-50">
                  {availableFriendsToAdd.length === 0
                    ? "All your friends are already in this group!"
                    : "No friends match your search."}
                </p>
              ) : (
                filteredFriendsToAdd.map((friend) => {
                  const isSelected = selectedFriendIdsToAdd.includes(friend._id);
                  return (
                    <div
                      key={friend._id}
                      onClick={() => toggleSelectFriendToAdd(friend._id)}
                      className={`p-2 rounded-2xl flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-primary/15 border border-primary/40"
                          : "bg-base-100 hover:bg-base-300 border border-base-content/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          src={friend.profilePic}
                          name={friend.fullName}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-base-content truncate">
                            {friend.fullName}
                          </p>
                          <p className="text-[10px] text-base-content/60">
                            {getLanguageFlag(friend.nativeLanguage)}{" "}
                            {friend.nativeLanguage}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                          isSelected
                            ? "bg-primary text-primary-content border-primary"
                            : "border-base-content/20"
                        }`}
                      >
                        {isSelected && <Check className="size-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-content/10">
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(false)}
                className="btn btn-sm btn-ghost rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMembersSubmit}
                disabled={isAddingMembers || selectedFriendIdsToAdd.length === 0}
                className="btn btn-sm btn-primary rounded-xl text-xs font-bold text-primary-content px-4"
              >
                {isAddingMembers ? "Adding..." : `Add Selected (${selectedFriendIdsToAdd.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {groupConfirmation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !groupActionId) {
              setGroupConfirmation(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="group-confirmation-title"
            aria-describedby="group-confirmation-description"
            className="w-full max-w-sm rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-start gap-3">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${groupConfirmation.destructive ? "bg-error/10 text-error" : "bg-primary/10 text-primary"}`}>
                {groupConfirmation.destructive ? <Trash2 className="size-5" /> : <LogOut className="size-5" />}
              </span>
              <div className="min-w-0 pt-0.5">
                <h3 id="group-confirmation-title" className="font-bold text-base-content">
                  {groupConfirmation.title}
                </h3>
                <p id="group-confirmation-description" className="mt-1 text-sm leading-relaxed text-base-content/65">
                  {groupConfirmation.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGroupConfirmation(null)}
                disabled={Boolean(groupActionId)}
                className="btn btn-ghost btn-circle btn-xs -mr-2 -mt-2 shrink-0"
                aria-label="Close confirmation"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex justify-end gap-2 border-t border-base-content/10 pt-4">
              <button
                type="button"
                onClick={() => setGroupConfirmation(null)}
                disabled={Boolean(groupActionId)}
                className="btn btn-ghost btn-sm rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={groupConfirmation.onConfirm}
                disabled={Boolean(groupActionId)}
                className={`btn btn-sm min-w-32 rounded-xl font-semibold ${groupConfirmation.destructive ? "bg-error text-error-content hover:bg-error/90" : "btn-primary"}`}
              >
                {groupActionId ? <><Loader2 className="size-4 animate-spin" /> Working...</> : groupConfirmation.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      )}

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </>
  );
};

export default ChatRightDrawer;
