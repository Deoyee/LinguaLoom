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
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Search,
  Check,
} from "lucide-react";
import Avatar from "../Avatar.jsx";
import { getLanguageFlag } from "../../lib/languageUtils.jsx";
import { formatDate } from "../../lib/utils";
import GroupVocabVault from "./GroupVocabVault.jsx";
import toast from "react-hot-toast";
import { addGroupMembers } from "../../lib/api.js";

export const ChatRightDrawer = ({
  isOpen = false,
  onClose = () => {},
  isGroup = false,
  groupData = null,
  groupMembers = [],
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
}) => {
  const [activeTab, setActiveTab] = useState("members"); // 'members' | 'vocab' | 'media' | 'files'
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [selectedFriendIdsToAdd, setSelectedFriendIdsToAdd] = useState([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);

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
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(true)}
                  className="btn btn-sm btn-outline border-base-content/20 hover:border-primary hover:text-primary text-xs font-medium gap-1.5 rounded-xl flex-1"
                  title="Add friends to group"
                >
                  <UserPlus className="size-3.5 text-primary" />
                  <span>Add</span>
                </button>
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
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(true)}
                  className="btn btn-xs rounded-xl bg-primary/15 hover:bg-primary/25 text-primary font-bold gap-1"
                >
                  <UserPlus className="size-3" />
                  <span>Add</span>
                </button>
              </div>

              {/* Member List Cards */}
              <div className="space-y-2">
                {groupMembers.map((member) => (
                  <div
                    key={member._id || member.id}
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

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewMemberProfile(member);
                      }}
                      className="btn btn-ghost btn-circle btn-xs text-base-content/60 group-hover:text-primary group-hover:bg-primary/20"
                      title="View Profile"
                    >
                      <User className="size-3.5" />
                    </button>
                  </div>
                ))}
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
                  <a
                    key={v.id}
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-2xl bg-base-100 border border-base-content/10 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between aspect-square group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                        <Video className="size-3.5" />
                      </div>
                      <ArrowUpRight className="size-3.5 text-base-content/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-base-content truncate group-hover:text-primary transition-colors">
                        {v.name}
                      </p>
                      <p className="text-[10px] text-base-content/50 font-mono mt-0.5">
                        {v.size}
                      </p>
                    </div>
                  </a>
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
                  <a
                    key={img.id}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative rounded-2xl overflow-hidden aspect-square bg-black/40 block shadow-sm border border-base-content/10"
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </a>
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
                    <div className="flex items-center gap-2.5 min-w-0">
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
                    </div>
                    {f.url && (
                      <a
                        href={f.url}
                        download={f.name}
                        target="_blank"
                        rel="noopener noreferrer"
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
    </>
  );
};

export default ChatRightDrawer;
