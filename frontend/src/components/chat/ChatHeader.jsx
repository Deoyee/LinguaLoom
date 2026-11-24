import React from "react";
import {
  Phone,
  Video,
  Info,
  Menu,
  Users,
  Plus,
  Sparkles,
  BookOpen,
} from "lucide-react";
import Avatar from "../Avatar.jsx";
import { getLanguageFlag } from "../../lib/languageUtils.jsx";

export const ChatHeader = ({
  isGroup = false,
  groupData = null,
  partnerUser,
  channelMember,
  channelMembers = [],
  isOnline = false,
  onOpenMobileSidebar = () => {},
  onToggleRightDrawer = () => {},
  isRightDrawerOpen = false,
  onVoiceCall = () => {},
  onVideoCall = () => {},
  onViewMemberProfile = () => {},
}) => {
  // If it's a Group Chat
  if (isGroup) {
    const groupName =
      groupData?.name ||
      groupData?.groupName ||
      "Language Practice Club";
    const groupImage = groupData?.image || groupData?.groupImage;
    const topic = groupData?.topic || "Language Exchange & Conversation";
    const targetLang = groupData?.targetLanguage;
    const nativeLang = groupData?.nativeLanguage;
    const members = channelMembers?.length ? channelMembers : groupData?.members || [];
    const memberCount = members.length || groupData?.memberCount || 2;

    return (
      <header className="h-16 px-3 sm:px-5 border-b border-base-content/10 flex items-center justify-between bg-base-200/90 backdrop-blur-md z-20 flex-shrink-0 select-none shadow-sm transition-all">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          {/* Mobile Sidebar Toggle Button */}
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="btn btn-ghost btn-circle btn-sm lg:hidden -ml-1 text-base-content"
            aria-label="Open chats list"
            title="All Chats"
          >
            <Menu className="size-5" />
          </button>

          {/* Group Icon / Avatar */}
          <div
            className="relative cursor-pointer transition-transform hover:scale-105 flex-shrink-0"
            onClick={onToggleRightDrawer}
            title="View group members & details"
          >
            {groupImage ? (
              <img
                src={groupImage}
                alt={groupName}
                className="w-10 h-10 rounded-2xl object-cover shadow-sm ring-2 ring-primary/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary font-bold flex items-center justify-center text-lg shadow-sm border border-primary/25">
                <Users className="size-5" />
              </div>
            )}
          </div>

          {/* Group Info & Avatar Stack */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3
                onClick={onToggleRightDrawer}
                className="font-bold text-base sm:text-lg text-base-content truncate hover:text-primary cursor-pointer transition-colors"
                title={groupName}
              >
                {groupName}
              </h3>

              {targetLang ? (
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/25 flex-shrink-0">
                  <span>{getLanguageFlag(targetLang)}</span>
                  <span>{targetLang}</span>
                  {nativeLang && (
                    <>
                      <span className="opacity-60">⇄</span>
                      <span>{getLanguageFlag(nativeLang)}</span>
                      <span>{nativeLang}</span>
                    </>
                  )}
                </span>
              ) : (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-base-300 text-base-content/75 border border-base-content/15 flex-shrink-0">
                  <Users className="size-3 text-secondary" />
                  <span>General Group</span>
                </span>
              )}
            </div>

            {/* Overlapping Avatar Stack & Member Count */}
            <div className="flex items-center gap-2 mt-0.5">
              <div
                className="flex items-center -space-x-1.5 cursor-pointer hover:opacity-90"
                onClick={onToggleRightDrawer}
                title="Click to view all members"
              >
                {members.slice(0, 4).map((member, idx) => (
                  <div
                    key={member.id || member._id || idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewMemberProfile(member);
                    }}
                    className="relative group/avatar"
                    title={`View ${member.fullName || member.name || "Member"}'s profile`}
                  >
                    <img
                      src={
                        member.profilePic ||
                        member.image ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id || member._id || idx}`
                      }
                      alt={member.fullName || member.name}
                      className="w-5 h-5 rounded-full ring-2 ring-base-200 object-cover hover:scale-125 transition-transform z-10"
                    />
                    {member.online && (
                      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-success ring-1 ring-base-200"></span>
                    )}
                  </div>
                ))}
              </div>

              <span
                onClick={onToggleRightDrawer}
                className="text-xs font-semibold text-base-content/80 hover:text-primary cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <span>{memberCount} members</span>
                {topic && <span className="hidden sm:inline opacity-50">&bull;</span>}
                {topic && (
                  <span className="hidden sm:inline truncate max-w-[200px] font-medium text-base-content/75">
                    {topic}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Group Voice Lounge / Call */}
          <button
            type="button"
            onClick={onVoiceCall}
            className="btn btn-circle btn-sm bg-base-300 hover:bg-primary/20 text-base-content hover:text-primary border-none shadow-sm transition-transform active:scale-95"
            title="Start Group Voice Lounge"
            aria-label="Start Group Voice Lounge"
          >
            <Phone className="size-4" />
          </button>

          {/* Video Call */}
          <button
            type="button"
            onClick={onVideoCall}
            className="btn btn-circle btn-sm btn-primary text-primary-content border-none shadow-md shadow-primary/25 transition-transform active:scale-95"
            title="Start Group Video Call"
            aria-label="Start Group Video Call"
          >
            <Video className="size-4" />
          </button>

          {/* Group Members & Vault Right Drawer Toggle */}
          <button
            type="button"
            onClick={onToggleRightDrawer}
            className={`btn btn-circle btn-sm transition-all ${
              isRightDrawerOpen
                ? "bg-primary text-primary-content shadow-md shadow-primary/25"
                : "bg-base-300 hover:bg-base-100 text-base-content border-none"
            }`}
            title="Toggle Group Members & Shared Media"
            aria-label="Toggle Group Members & Shared Media"
          >
            <Users className="size-4" />
          </button>
        </div>
      </header>
    );
  }

  // 1-on-1 Direct Chat Header
  const name =
    partnerUser?.fullName ||
    channelMember?.user?.name ||
    "Language Partner";

  const image =
    partnerUser?.profilePic ||
    channelMember?.user?.image;

  const nativeLang = partnerUser?.nativeLanguage;
  const learningLang = partnerUser?.learningLanguage;
  const location = partnerUser?.city
    ? `${partnerUser.city}${partnerUser.location ? `, ${partnerUser.location}` : ""}`
    : partnerUser?.location || "";

  return (
    <header className="h-16 px-3 sm:px-5 border-b border-base-content/10 flex items-center justify-between bg-base-200/90 backdrop-blur-md z-20 flex-shrink-0 select-none shadow-sm transition-all">
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        {/* Mobile Sidebar Toggle Button */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="btn btn-ghost btn-circle btn-sm lg:hidden -ml-1 text-base-content"
          aria-label="Open conversations list"
          title="All Conversations"
        >
          <Menu className="size-5" />
        </button>

        {/* Partner Avatar with Click to Profile */}
        <div className="relative flex-shrink-0">
          <Avatar
            src={image}
            name={name}
            size="md"
            showOnline={isOnline}
            isOnline={isOnline}
          />
        </div>

        {/* Partner Info & Language Badges */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base sm:text-lg text-base-content truncate hover:text-primary transition-colors">
              {name}
            </h3>

            {nativeLang && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/25 flex-shrink-0">
                <span>{getLanguageFlag(nativeLang)}</span>
                <span>{nativeLang}</span>
                {learningLang && (
                  <>
                    <span className="opacity-60">⇄</span>
                    <span>{getLanguageFlag(learningLang)}</span>
                    <span>{learningLang}</span>
                  </>
                )}
              </span>
            )}
          </div>

          <p className="text-xs text-base-content/80 font-medium flex items-center gap-2 mt-0.5 truncate">
            {isOnline ? (
              <span className="text-success font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                <span>Online now</span>
              </span>
            ) : (
              <span>Offline</span>
            )}

            {location && (
              <>
                <span className="opacity-50">&bull;</span>
                <span className="truncate">{location}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right Header Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Voice Call Button */}
        <button
          type="button"
          onClick={onVoiceCall}
          className="btn btn-circle btn-sm bg-base-300 hover:bg-primary/20 text-base-content hover:text-primary border-none shadow-sm transition-transform active:scale-95"
          title="Start Voice Call"
          aria-label="Start Voice Call"
        >
          <Phone className="size-4" />
        </button>

        {/* Video Call Button */}
        <button
          type="button"
          onClick={onVideoCall}
          className="btn btn-circle btn-sm btn-primary text-primary-content border-none shadow-md shadow-primary/25 transition-transform active:scale-95"
          title="Start Video Call"
          aria-label="Start Video Call"
        >
          <Video className="size-4" />
        </button>

        {/* Right Drawer Toggle (Vault & Profile) */}
        <button
          type="button"
          onClick={onToggleRightDrawer}
          className={`btn btn-circle btn-sm transition-all ${
            isRightDrawerOpen
              ? "bg-primary text-primary-content shadow-md shadow-primary/25"
              : "bg-base-300 hover:bg-base-100 text-base-content border-none"
          }`}
          title="Toggle Partner Vault & Profile"
          aria-label="Toggle Partner Vault & Profile"
        >
          <Info className="size-4" />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
