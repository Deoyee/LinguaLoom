import React, { useState, useMemo } from "react";
import { X, Search, Check, Users, Sparkles, Globe, MessageSquare } from "lucide-react";
import Avatar from "../Avatar.jsx";
import { getLanguageFlag } from "../../lib/languageUtils.jsx";
import { LANGUAGES } from "../../constants";
import { capitialize } from "../../lib/utils";
import { createGroup } from "../../lib/api.js";
import toast from "react-hot-toast";

const PRESET_ICONS = ["🌐", "🇪🇸", "🇫🇷", "🇯🇵", "🇩🇪", "🇮🇹", "🗣️", "☕", "📚", "🚀"];

export const CreateGroupModal = ({
  isOpen = false,
  onClose = () => {},
  friends = [],
  onGroupCreated = () => {},
}) => {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [nativeLanguage, setNativeLanguage] = useState("English");
  const [selectedEmoji, setSelectedEmoji] = useState("🗣️");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [friendSearch, setFriendSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter friends list
  const filteredFriends = useMemo(() => {
    if (!friendSearch.trim()) return friends;
    const q = friendSearch.toLowerCase().trim();
    return friends.filter(
      (f) =>
        f.fullName?.toLowerCase().includes(q) ||
        f.nativeLanguage?.toLowerCase().includes(q) ||
        f.learningLanguage?.toLowerCase().includes(q)
    );
  }, [friends, friendSearch]);

  const toggleMember = (id) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    if (selectedMemberIds.length === 0) {
      toast.error("Please select at least 1 friend to add to the group");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createGroup({
        name: `${selectedEmoji} ${name.trim()}`,
        topic: topic.trim() || `Language practice for ${targetLanguage} and ${nativeLanguage}`,
        targetLanguage,
        nativeLanguage,
        memberIds: selectedMemberIds,
      });

      toast.success("Group created successfully! 🎉");
      setName("");
      setTopic("");
      setSelectedMemberIds([]);
      onClose();
      if (res?.channelId) {
        onGroupCreated(res.channelId);
      }
    } catch (err) {
      console.error("Create group error:", err);
      toast.error(err?.response?.data?.message || "Failed to create group");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-base-200 border border-base-content/15 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-base-content/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-bold">
              <Users className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-base-content">
                Create Language Group
              </h3>
              <p className="text-xs text-base-content/60">
                Connect friends for collaborative practice
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-base-content"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Group Icon Picker & Name */}
          <div>
            <label className="block font-bold text-base-content mb-1.5">
              Group Name & Icon
            </label>
            <div className="flex items-center gap-2">
              <div className="dropdown">
                <button
                  type="button"
                  tabIndex={0}
                  className="btn btn-outline border-base-content/20 text-lg px-3 rounded-2xl h-11"
                  title="Pick icon"
                >
                  {selectedEmoji}
                </button>
                <div
                  tabIndex={0}
                  className="dropdown-content mt-1 p-2 shadow-xl bg-base-100 border border-base-content/15 rounded-2xl flex flex-wrap gap-1.5 w-48 z-50"
                >
                  {PRESET_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className="p-1.5 hover:bg-base-200 rounded-xl text-lg transition-transform active:scale-90"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Madrid Polyglots Club"
                className="flex-1 input input-bordered h-11 rounded-2xl bg-base-100 border-base-content/20 text-base-content focus:border-primary text-xs shadow-inner"
                maxLength={45}
                required
              />
            </div>
          </div>

          {/* Group Topic */}
          <div>
            <label className="block font-bold text-base-content mb-1.5">
              Group Topic / Description
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Daily travel stories, vocabulary exchange & coffee chats"
              className="w-full input input-bordered h-10 rounded-2xl bg-base-100 border-base-content/20 text-base-content focus:border-primary text-xs"
              maxLength={120}
            />
          </div>

          {/* Target & Practice Languages */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-base-content mb-1.5">
                Target Language
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full select select-bordered select-sm rounded-xl bg-base-100 border-base-content/20 text-xs"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {getLanguageFlag(lang)} {capitialize(lang)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-base-content mb-1.5">
                Practice Language
              </label>
              <select
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="w-full select select-bordered select-sm rounded-xl bg-base-100 border-base-content/20 text-xs"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {getLanguageFlag(lang)} {capitialize(lang)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Members Section */}
          <div className="space-y-2 pt-1 border-t border-base-content/10">
            <div className="flex items-center justify-between">
              <label className="font-bold text-base-content">
                Add Members from Friends ({selectedMemberIds.length} selected)
              </label>
              {friends.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedMemberIds.length === friends.length) {
                      setSelectedMemberIds([]);
                    } else {
                      setSelectedMemberIds(friends.map((f) => f._id));
                    }
                  }}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  {selectedMemberIds.length === friends.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}
            </div>

            {/* Friend Search Bar */}
            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-3 text-base-content/40" />
              <input
                type="text"
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                placeholder="Search friends by name or language..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-base-100 border border-base-content/15 text-xs text-base-content focus:outline-none focus:border-primary"
              />
            </div>

            {/* Friends Selection List */}
            <div className="max-h-44 overflow-y-auto divide-y divide-base-content/5 p-1 rounded-2xl bg-base-100 border border-base-content/15">
              {friends.length === 0 ? (
                <div className="p-4 text-center text-base-content/60">
                  <p>No friends available to add yet.</p>
                  <p className="text-[10px] mt-1 opacity-70">
                    Add friends first to invite them to groups!
                  </p>
                </div>
              ) : filteredFriends.length === 0 ? (
                <p className="p-4 text-center text-base-content/60">
                  No friends matching "{friendSearch}"
                </p>
              ) : (
                filteredFriends.map((friend) => {
                  const isSelected = selectedMemberIds.includes(friend._id);
                  return (
                    <div
                      key={friend._id}
                      onClick={() => toggleMember(friend._id)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/15 text-base-content"
                          : "hover:bg-base-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          src={friend.profilePic}
                          name={friend.fullName}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-xs truncate text-base-content">
                            {friend.fullName}
                          </p>
                          <p className="text-[10px] text-base-content/60 flex items-center gap-1">
                            {friend.nativeLanguage && (
                              <span>
                                {getLanguageFlag(friend.nativeLanguage)}{" "}
                                {friend.nativeLanguage}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                          isSelected
                            ? "bg-primary border-primary text-primary-content"
                            : "border-base-content/30 bg-base-100"
                        }`}
                      >
                        {isSelected && <Check className="size-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-base-content/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-sm btn-ghost rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || selectedMemberIds.length === 0}
              className="btn btn-sm btn-primary text-primary-content font-bold rounded-xl text-xs shadow-md shadow-primary/25 gap-1.5"
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  <span>Create Group</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
