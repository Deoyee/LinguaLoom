import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { getUserFriends, getChatHistory } from "../lib/api";
import {
  MapPinIcon,
  MessageCircleIcon,
  UsersIcon,
  Search,
  Filter,
  X,
  Phone,
  Video,
  Sparkles,
  ArrowRightLeft,
  UserCheck,
  Compass,
} from "lucide-react";
import { formatDate } from "../lib/utils";
import FriendCard from "../components/FriendCard";
import Avatar from "../components/Avatar.jsx";
import { getLanguageFlag } from "../lib/languageUtils.jsx";
import useOnlineUsers from "../hooks/useOnlineUsers";
import UserProfileModal from "../components/UserProfileModal.jsx";

const FriendsPage = () => {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'online' | 'recent'
  const [filterLang, setFilterLang] = useState("");

  const { isUserOnline } = useOnlineUsers();
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: chatHistory = [], isLoading: loadingChats } = useQuery({
    queryKey: ["chatHistory"],
    queryFn: getChatHistory,
  });

  // Unique languages across friends
  const spokenLanguages = useMemo(() => {
    const set = new Set();
    friends.forEach((f) => {
      if (f.nativeLanguage) set.add(f.nativeLanguage);
      if (f.learningLanguage) set.add(f.learningLanguage);
    });
    return Array.from(set).slice(0, 6);
  }, [friends]);

  // Online count
  const onlineCount = useMemo(() => {
    return friends.filter((f) => isUserOnline(f._id)).length;
  }, [friends, isUserOnline]);

  // Build chatted IDs set
  const chattedUserIds = useMemo(() => {
    return new Set(chatHistory.map((c) => c.otherUser?.id).filter(Boolean));
  }, [chatHistory]);

  // Filtered friends
  const filteredFriends = useMemo(() => {
    return friends.filter((f) => {
      if (filterMode === "online" && !isUserOnline(f._id)) return false;
      if (filterMode === "recent" && !chattedUserIds.has(f._id)) return false;

      if (filterLang) {
        const langLower = filterLang.toLowerCase();
        const matchesNative = f.nativeLanguage?.toLowerCase() === langLower;
        const matchesLearning = f.learningLanguage?.toLowerCase() === langLower;
        if (!matchesNative && !matchesLearning) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (f.fullName || "").toLowerCase();
        const loc = (f.location || "").toLowerCase();
        const native = (f.nativeLanguage || "").toLowerCase();
        const learning = (f.learningLanguage || "").toLowerCase();
        const haystack = `${name} ${loc} ${native} ${learning}`;
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [friends, filterMode, filterLang, searchQuery, isUserOnline, chattedUserIds]);

  if (loadingFriends || loadingChats) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-7 w-full space-y-5 select-none">
      {/* ======================================================== */}
      {/* BENTO HEADER: LANGUAGE CIRCLE SPOTLIGHT                  */}
      {/* ======================================================== */}
      <section className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-primary/15 via-base-200 to-secondary/15 border border-primary/25 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-content shadow-sm flex items-center gap-1.5">
              <UsersIcon className="size-3.5" />
              <span>Language Circle</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
              {onlineCount} Online Right Now
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-content">
            Your Language Partners ({friends.length})
          </h1>
          <p className="text-xs sm:text-sm text-base-content/80 max-w-xl font-medium">
            Stay in touch, practice speaking, and jump into voice calls with partners across the globe.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          <Link
            to="/notifications"
            className="btn btn-outline border-base-content/20 hover:border-primary btn-sm rounded-2xl font-bold text-xs"
          >
            Friend Requests
          </Link>
          <Link
            to="/"
            className="btn btn-primary btn-sm rounded-2xl font-bold text-xs shadow-md shadow-primary/25 gap-1.5"
          >
            <Compass className="size-4" />
            <span>Discover Learners</span>
          </Link>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SMART FILTER ISLAND                                      */}
      {/* ======================================================== */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-base-200/90 border border-base-content/10 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <label className="input input-bordered h-11 flex items-center gap-2.5 rounded-2xl bg-base-100 border-base-content/20 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25 shadow-sm">
              <Search className="size-4 text-base-content/60 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search partners by name, city, or language..."
                className="grow text-xs sm:text-sm bg-transparent border-none outline-none focus:outline-none text-base-content placeholder:text-base-content/60 min-w-0 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-base-content"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </label>
          </div>

          {/* Preset Mode Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
                filterMode === "all"
                  ? "bg-primary text-primary-content shadow-sm"
                  : "bg-base-100 hover:bg-base-300 text-base-content/85"
              }`}
            >
              All ({friends.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("online")}
              className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterMode === "online"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-base-100 hover:bg-base-300 text-base-content/85"
              }`}
            >
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online ({onlineCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("recent")}
              className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
                filterMode === "recent"
                  ? "bg-primary text-primary-content shadow-sm"
                  : "bg-base-100 hover:bg-base-300 text-base-content/85"
              }`}
            >
              Active Chats ({chattedUserIds.size})
            </button>
          </div>
        </div>

        {/* Quick Language Filter Chips */}
        {spokenLanguages.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-base-content/10 text-xs">
            <span className="text-base-content/60 text-[11px] uppercase tracking-wider font-extrabold mr-1">
              Languages in Circle:
            </span>
            {spokenLanguages.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  setFilterLang(filterLang === lang ? "" : lang);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  filterLang === lang
                    ? "bg-primary text-primary-content shadow-sm"
                    : "bg-base-100 hover:bg-base-300 text-base-content/80"
                }`}
              >
                {getLanguageFlag(lang)} {lang}
              </button>
            ))}
            {(searchQuery || filterLang || filterMode !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilterLang("");
                  setFilterMode("all");
                }}
                className="text-xs font-bold text-error hover:underline ml-auto"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECTION: ALL PARTNERS CARDS GRID                         */}
      {/* ======================================================== */}
      <section className="space-y-4">
        {filteredFriends.length === 0 ? (
          <div className="p-12 rounded-3xl bg-base-200/70 border border-base-content/10 text-center space-y-3">
            <UsersIcon className="size-12 text-primary opacity-50" />
            <h3 className="font-bold text-lg text-base-content">
              No language partners match your criteria
            </h3>
            <p className="text-xs sm:text-sm text-base-content/75 max-w-sm font-medium">
              Try clearing filters or search terms to see your partners.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredFriends.map((friend) => (
              <FriendCard
                key={friend._id}
                friend={friend}
                onViewProfile={setSelectedFriend}
                hasChatHistory={chattedUserIds.has(friend._id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* User Profile Modal */}
      {selectedFriend && (
        <UserProfileModal
          isOpen={!!selectedFriend}
          onClose={() => setSelectedFriend(null)}
          user={selectedFriend}
          isFriend={true}
        />
      )}
    </div>
  );
};

export default FriendsPage;
