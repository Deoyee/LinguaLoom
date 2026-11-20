import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
  cancelFriendRequest,
  getChatHistory,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../lib/api";
import { Link, useNavigate } from "react-router";
import {
  CheckCircleIcon,
  MapPinIcon,
  UserPlusIcon,
  UsersIcon,
  MessageCircleIcon,
  ClockIcon,
  Search,
  Filter,
  Sparkles,
  X,
  Languages,
  Globe2,
  Phone,
  Video,
  Flame,
  ArrowRightLeft,
  Compass,
  IdCard,
  Radio,
  ArrowRight,
  Clock,
  Globe,
  BookOpen,
} from "lucide-react";
import { capitialize } from "../lib/utils";
import NoFriendsFound from "../components/NoFriendsFound";
import Avatar from "../components/Avatar.jsx";
import { getLanguageFlag } from "../lib/languageUtils.jsx";
import useOnlineUsers from "../hooks/useOnlineUsers";
import useAuthUser from "../hooks/useAuthUser";
import UserProfileModal from "../components/UserProfileModal";
import LanguageDropdown from "../components/LanguageDropdown.jsx";
import { LANGUAGES } from "../constants";
import toast from "react-hot-toast";

const HomePage = () => {
  const { authUser } = useAuthUser();
  const { isUserOnline } = useOnlineUsers();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());
  const [submittingId, setSubmittingId] = useState(null);

  // Search & Language Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterNative, setFilterNative] = useState("");
  const [filterLearning, setFilterLearning] = useState("");
  const [perfectMatchOnly, setPerfectMatchOnly] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);

  // Selected user for full profile inspection modal
  const [selectedUser, setSelectedUser] = useState(null);

  // Queries
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: chatHistory = [], isLoading: loadingChats } = useQuery({
    queryKey: ["chatHistory"],
    queryFn: getChatHistory,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  // Mutations
  const { mutateAsync: sendRequestMutationAsync } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: (data) => {
      if (data?.isMutualAccept) {
        toast.success(data?.message || "You are now friends!");
        queryClient.invalidateQueries({ queryKey: ["friends"] });
        queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
        queryClient.invalidateQueries({ queryKey: ["users"] });
      } else {
        toast.success("Friend request sent!");
      }
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to send friend request"
      );
    },
  });

  const { mutateAsync: cancelRequestMutationAsync } = useMutation({
    mutationFn: cancelFriendRequest,
    onSuccess: () => {
      toast.success("Friend request cancelled");
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to cancel request");
    },
  });

  const { mutateAsync: acceptRequestMutationAsync } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      toast.success("Friend request accepted!");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to accept request");
    },
  });

  const { mutateAsync: rejectRequestMutationAsync } = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => {
      toast.success("Friend request declined");
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to decline request"
      );
    },
  });

  useEffect(() => {
    if (!outgoingFriendReqs) return;
    const setIds = new Set(
      outgoingFriendReqs.map((r) => r.recipient?._id).filter(Boolean)
    );
    setOutgoingRequestsIds(setIds);
  }, [outgoingFriendReqs]);

  const handleSendRequest = async (userId) => {
    setSubmittingId(userId);
    setOutgoingRequestsIds((prev) => new Set(prev).add(userId));
    try {
      await sendRequestMutationAsync(userId);
    } catch {
      setOutgoingRequestsIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCancelRequest = async (userId) => {
    setSubmittingId(userId);
    try {
      await cancelRequestMutationAsync(userId);
      setOutgoingRequestsIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleAcceptRequest = async (requestId, userId) => {
    setSubmittingId(userId);
    try {
      await acceptRequestMutationAsync(requestId);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRejectRequest = async (requestId, userId) => {
    setSubmittingId(userId);
    try {
      await rejectRequestMutationAsync(requestId);
    } finally {
      setSubmittingId(null);
    }
  };

  const incomingRequestsMap = useMemo(() => {
    const map = new Map();
    (friendRequests?.incomingReqs || []).forEach((req) => {
      const senderId = req.sender?._id || req.sender;
      if (senderId) {
        map.set(String(senderId), req._id);
      }
    });
    return map;
  }, [friendRequests]);

  const isRequested = (id) => outgoingRequestsIds.has(id);

  // Collect available languages
  const availableLanguages = useMemo(() => {
    const langMap = new Map();
    LANGUAGES.forEach((lang) => {
      langMap.set(lang.toLowerCase(), capitialize(lang));
    });
    recommendedUsers.forEach((user) => {
      if (user.nativeLanguage?.trim()) {
        const clean = user.nativeLanguage.trim();
        langMap.set(clean.toLowerCase(), capitialize(clean));
      }
      if (user.learningLanguage?.trim()) {
        const clean = user.learningLanguage.trim();
        langMap.set(clean.toLowerCase(), capitialize(clean));
      }
    });
    return Array.from(langMap.values()).sort((a, b) => a.localeCompare(b));
  }, [recommendedUsers]);

  // World timezone clock helper
  const worldClocks = useMemo(() => {
    const timezones = [
      { city: "Madrid", country: "Spain", flag: "🇪🇸", tz: "Europe/Madrid" },
      { city: "Mexico City", country: "Mexico", flag: "🇲🇽", tz: "America/Mexico_City" },
      { city: "Tokyo", country: "Japan", flag: "🇯🇵", tz: "Asia/Tokyo" },
      { city: "London", country: "UK", flag: "🇬🇧", tz: "Europe/London" },
    ];
    return timezones.map((item) => {
      try {
        const timeStr = new Intl.DateTimeFormat("en-US", {
          timeZone: item.tz,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date());
        return { ...item, time: timeStr };
      } catch {
        return { ...item, time: "--:--" };
      }
    });
  }, []);

  // Filter recommended users
  const filteredUsers = recommendedUsers.filter((user) => {
    if (searchQuery.trim()) {
      const tokens = searchQuery
        .trim()
        .toLowerCase()
        .split(/[\s,]+/)
        .filter(Boolean);

      const name = (user.fullName || "").toLowerCase();
      const location = (user.location || "").toLowerCase();
      const city = (user.city || "").toLowerCase();
      const searchable = `${name} ${location} ${city}`;

      const matchesAllTokens = tokens.every((token) =>
        searchable.includes(token)
      );
      if (!matchesAllTokens) return false;
    }

    const normalizeLang = (lang) => (lang ? lang.trim().toLowerCase() : "");

    if (
      filterNative &&
      normalizeLang(user.nativeLanguage) !== normalizeLang(filterNative)
    ) {
      return false;
    }

    if (
      filterLearning &&
      normalizeLang(user.learningLanguage) !== normalizeLang(filterLearning)
    ) {
      return false;
    }

    if (onlineOnly && !isUserOnline(user._id)) {
      return false;
    }

    if (perfectMatchOnly && authUser) {
      const isPerfect =
        normalizeLang(user.nativeLanguage) ===
          normalizeLang(authUser.learningLanguage) &&
        normalizeLang(user.learningLanguage) ===
          normalizeLang(authUser.nativeLanguage);
      if (!isPerfect) return false;
    }

    return true;
  });

  const hasActiveFilters =
    searchQuery || filterNative || filterLearning || perfectMatchOnly || onlineOnly;

  const resetFilters = () => {
    setSearchQuery("");
    setFilterNative("");
    setFilterLearning("");
    setPerfectMatchOnly(false);
    setOnlineOnly(false);
  };

  // First conversation ID for quick jump button
  const firstChatUserId = useMemo(() => {
    if (chatHistory.length > 0 && chatHistory[0]?.otherUser?.id) {
      return chatHistory[0].otherUser.id;
    }
    if (friends.length > 0 && friends[0]?._id) {
      return friends[0]._id;
    }
    return null;
  }, [chatHistory, friends]);

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-5 select-none w-full mx-auto">
      <div className="space-y-5 w-full">
        {/* ======================================================== */}
        {/* BENTO HERO 1: PASSPORT SPOTLIGHT & GLOBAL PARTNERS CLOCK  */}
        {/* ======================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Passport Spotlight Card */}
          <div className="lg:col-span-8 p-4 sm:p-5 xl:p-6 rounded-3xl bg-gradient-to-br from-primary/15 via-base-200 to-secondary/15 border border-primary/25 shadow-md relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between gap-4 z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-content shadow-sm">
                    <Flame className="size-3.5 text-amber-300 fill-amber-300" />
                    <span>5 Day Language Streak!</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-base-100/80 border border-base-content/10 text-base-content/80">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Exchange Active</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-content">
                  Welcome back, {authUser?.fullName?.split(" ")[0] || "Learner"}!
                </h1>

                <p className="text-xs sm:text-sm text-base-content/85 max-w-lg leading-relaxed">
                  You are actively exchanging{" "}
                  <strong className="text-base-content font-bold">
                    {authUser?.nativeLanguage || "English"}{" "}
                    {getLanguageFlag(authUser?.nativeLanguage || "English")}
                  </strong>{" "}
                  for{" "}
                  <strong className="text-base-content font-bold">
                    {authUser?.learningLanguage || "Spanish"}{" "}
                    {getLanguageFlag(authUser?.learningLanguage || "Spanish")}
                  </strong>
                  . Connect with native speakers online right now!
                </p>
              </div>

              {/* Active Pair Visual Capsule */}
              {authUser?.nativeLanguage && authUser?.learningLanguage && (
                <div className="hidden sm:flex flex-col items-center justify-center p-3.5 rounded-2xl bg-base-100/90 border border-base-content/15 shadow-sm text-center flex-shrink-0">
                  <div className="flex items-center gap-2 text-2xl font-bold">
                    <span>{getLanguageFlag(authUser.nativeLanguage)}</span>
                    <ArrowRightLeft className="size-4 text-primary" />
                    <span>{getLanguageFlag(authUser.learningLanguage)}</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary mt-1">
                    Your Pair
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Action Strip */}
            <div className="flex items-center gap-3 pt-5 mt-4 border-t border-base-content/10 z-10 flex-wrap">
              {firstChatUserId ? (
                <button
                  type="button"
                  onClick={() => navigate(`/chat/${firstChatUserId}`)}
                  className="btn btn-primary btn-sm rounded-2xl font-bold shadow-md shadow-primary/25 gap-2 transition-transform active:scale-95"
                >
                  <MessageCircleIcon className="size-4" />
                  <span>Jump into Practice Chat</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("discovery-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="btn btn-primary btn-sm rounded-2xl font-bold shadow-md shadow-primary/25 gap-2 transition-transform active:scale-95"
                >
                  <Compass className="size-4" />
                  <span>Find First Language Partner</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate("/practice")}
                className="btn btn-secondary btn-sm rounded-2xl font-bold shadow-sm gap-2 transition-transform active:scale-95"
              >
                <BookOpen className="size-4" />
                <span>Practice Room</span>
              </button>

              <button
                type="button"
                onClick={() => setPerfectMatchOnly(!perfectMatchOnly)}
                className={`btn btn-sm rounded-2xl font-semibold gap-1.5 transition-all ${
                  perfectMatchOnly
                    ? "btn-primary shadow-md shadow-primary/20"
                    : "btn-outline border-base-content/20 hover:border-primary text-base-content"
                }`}
              >
                <Sparkles className="size-4 text-warning fill-warning" />
                <span>100% Mutual Match</span>
              </button>
            </div>

            {/* Subtle Aesthetic Watermark */}
            <Globe className="absolute -right-8 -bottom-10 size-44 text-base-content/5 pointer-events-none select-none" />
          </div>

          {/* World Partner Timezones Ticker */}
          <div className="lg:col-span-4 p-4 sm:p-5 rounded-3xl bg-base-200/90 border border-base-content/10 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-base-content/10">
              <span className="text-xs font-extrabold uppercase tracking-wider text-base-content/80 flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <span>Global Partner Clocks</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-bold">
                Live
              </span>
            </div>

            <div className="space-y-2.5 my-3">
              {worldClocks.map((c) => (
                <div
                  key={c.city}
                  className="flex items-center justify-between text-xs p-2.5 rounded-2xl bg-base-100 border border-base-content/5 shadow-xs"
                >
                  <span className="font-bold flex items-center gap-2 text-base-content">
                    <span className="text-base">{c.flag}</span>
                    <span>{c.city}</span>
                  </span>
                  <span className="font-mono font-bold text-primary text-xs">
                    {c.time}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-base-content/75 text-center font-medium">
              💡 Prime time to practice with partners worldwide!
            </p>
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION 2: YOUR LANGUAGE CIRCLE (ACTIVE PARTNERS)        */}
        {/* ======================================================== */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-base-content flex items-center gap-2.5">
                <span>Your Language Circle</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                  {chatHistory.length || friends.length} Active
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-base-content/75 mt-0.5 font-medium">
                Chat, call, and continue practicing with your connected partners
              </p>
            </div>

            <Link
              to="/notifications"
              className="btn btn-outline btn-sm rounded-2xl font-semibold border-base-content/20 hover:border-primary text-xs self-start sm:self-auto gap-2"
            >
              <UsersIcon className="size-4" />
              <span>Friend Requests</span>
              {friendRequests?.incomingReqs?.length > 0 && (
                <span className="badge badge-xs badge-primary">
                  {friendRequests.incomingReqs.length}
                </span>
              )}
            </Link>
          </div>

          {/* Cards Grid */}
          {loadingFriends || loadingChats ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : friends.length === 0 && chatHistory.length === 0 ? (
            <NoFriendsFound />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {chatHistory.slice(0, 7).map((chat) => {
                const otherUser = chat.otherUser;
                if (!otherUser) return null;
                const isOnline = isUserOnline(otherUser.id);

                return (
                  <div
                    key={chat.channelId || otherUser.id}
                    className="p-4 rounded-3xl bg-base-200/80 hover:bg-base-200 border border-base-content/10 hover:border-primary/40 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Avatar & Call Action Buttons */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="relative">
                          <Avatar
                            src={otherUser.image}
                            name={otherUser.name}
                            size="md"
                            showOnline={isOnline}
                            isOnline={isOnline}
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/chat/${otherUser.id}`}
                            className="w-8 h-8 rounded-xl bg-base-100 hover:bg-primary hover:text-primary-content text-base-content/75 flex items-center justify-center transition-all shadow-sm"
                            title="Start Call"
                          >
                            <Phone className="size-3.5" />
                          </Link>
                          <Link
                            to={`/chat/${otherUser.id}`}
                            className="w-8 h-8 rounded-xl bg-base-100 hover:bg-primary hover:text-primary-content text-base-content/75 flex items-center justify-center transition-all shadow-sm"
                            title="Start Video"
                          >
                            <Video className="size-3.5" />
                          </Link>
                        </div>
                      </div>

                      {/* Partner Name */}
                      <h3 className="font-bold text-sm sm:text-base text-base-content group-hover:text-primary transition-colors truncate">
                        {otherUser.name}
                      </h3>

                      {/* Language Exchange Badge */}
                      <p className="text-xs font-semibold text-primary mt-0.5 flex items-center gap-1.5 truncate">
                        <span>{getLanguageFlag(otherUser.nativeLanguage || "English")}</span>
                        <span className="truncate">{otherUser.nativeLanguage || "English"}</span>
                        <span className="text-base-content/40">⇄</span>
                        <span>{getLanguageFlag(otherUser.learningLanguage || "Spanish")}</span>
                        <span className="truncate">{otherUser.learningLanguage || "Spanish"}</span>
                      </p>

                      {/* Recent Snippet */}
                      <div className="mt-3 p-2.5 rounded-xl bg-base-100 border border-base-content/5 text-xs text-base-content/85 truncate font-medium">
                        {chat.lastMessage?.text ? (
                          <span>"{chat.lastMessage.text}"</span>
                        ) : (
                          <span className="text-base-content/60 italic">
                            Practice together today!
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Open Chat Button */}
                    <Link
                      to={`/chat/${otherUser.id}`}
                      className="mt-4 w-full py-2.5 rounded-xl bg-primary text-primary-content font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                    >
                      <MessageCircleIcon className="size-4" />
                      <span>Open Chat</span>
                    </Link>
                  </div>
                );
              })}

              {/* Add New Partner Capsule */}
              <div
                onClick={() => {
                  const el = document.getElementById("discovery-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="p-6 rounded-3xl bg-base-200/50 border-2 border-dashed border-base-content/20 hover:border-primary flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-primary/5 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-lg mb-2 group-hover:scale-110 transition-transform">
                  <UserPlusIcon className="size-5" />
                </div>
                <h4 className="font-bold text-sm text-base-content">
                  Discover Partners
                </h4>
                <p className="text-xs text-base-content/70 mt-1 max-w-[150px] font-medium">
                  Find new native speakers across the globe
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* SECTION 3: GLOBAL PASSPORT EXPLORER (UNIQUE DISCOVERY)    */}
        {/* ======================================================== */}
        <section id="discovery-section" className="space-y-5 pt-6 border-t border-base-content/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-base-content flex items-center gap-2.5">
                <span>Global Passport Explorer</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-bold">
                  {filteredUsers.length} Available
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-base-content/75 mt-0.5 font-medium">
                Connect with language learners whose native fluency matches your target language
              </p>
            </div>
          </div>

          {/* Floating Smart Filter Island */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-base-200/90 border border-base-content/10 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
              {/* Search Bar */}
              <div className="lg:col-span-4">
                <label className="input input-bordered h-11 flex items-center gap-2.5 rounded-2xl bg-base-100 border-base-content/20 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25 shadow-sm transition-all">
                  <Search className="size-4 text-base-content/60 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, city..."
                    className="grow text-xs sm:text-sm bg-transparent border-none outline-none focus:outline-none text-base-content placeholder:text-base-content/60 min-w-0 font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-base-content"
                      title="Clear search"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </label>
              </div>

              {/* Native Language Custom Dropdown */}
              <div className="lg:col-span-3">
                <LanguageDropdown
                  prefix="Native"
                  icon={Languages}
                  value={filterNative}
                  onChange={setFilterNative}
                  languages={availableLanguages}
                  placeholder="All"
                />
              </div>

              {/* Learning Language Custom Dropdown */}
              <div className="lg:col-span-3">
                <LanguageDropdown
                  prefix="Learning"
                  icon={Globe2}
                  value={filterLearning}
                  onChange={setFilterLearning}
                  languages={availableLanguages}
                  placeholder="All"
                />
              </div>

              {/* Reset Filters / Online Toggle */}
              <div className="lg:col-span-2 flex items-center gap-2">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="btn btn-error btn-outline h-11 min-h-[44px] w-full rounded-2xl gap-2 text-xs font-bold px-3 transition-all hover:shadow-md active:scale-95"
                    title="Clear all filters"
                  >
                    <X className="size-4" />
                    <span>Clear All</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOnlineOnly(!onlineOnly)}
                    className={`btn btn-sm h-11 min-h-[44px] w-full rounded-2xl text-xs font-bold gap-1.5 transition-all ${
                      onlineOnly
                        ? "btn-success text-white shadow-sm"
                        : "btn-outline border-base-content/20 text-base-content"
                    }`}
                  >
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Online Only</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Preset Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-base-content/10 text-xs">
              <span className="text-base-content/60 text-[11px] uppercase tracking-wider font-extrabold mr-1">
                Quick Filters:
              </span>

              <button
                type="button"
                onClick={() => setPerfectMatchOnly(!perfectMatchOnly)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  perfectMatchOnly
                    ? "bg-primary text-primary-content shadow-sm"
                    : "bg-base-100 hover:bg-base-300 text-base-content/85"
                }`}
              >
                <Sparkles className="size-3 text-warning fill-warning" />
                <span>100% Mutual Match</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlineOnly(!onlineOnly)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  onlineOnly
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-base-100 hover:bg-base-300 text-base-content/85"
                }`}
              >
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Online Now</span>
              </button>

              {["Spanish", "French", "Japanese", "German"].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    if (filterNative === lang) {
                      setFilterNative("");
                    } else {
                      setFilterNative(lang);
                    }
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    filterNative === lang
                      ? "bg-primary text-primary-content shadow-sm"
                      : "bg-base-100 hover:bg-base-300 text-base-content/80"
                  }`}
                >
                  {getLanguageFlag(lang)} {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Users Passport Grid */}
          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="card bg-base-200/70 p-10 text-center border border-base-content/10 rounded-3xl space-y-3">
              <Compass className="size-10 text-primary opacity-60" />
              <h3 className="font-bold text-lg text-base-content">
                No learners match your current filter
              </h3>
              <p className="text-base-content/75 text-xs sm:text-sm max-w-md mx-auto">
                Try clearing search terms or language filters to view more native speakers.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn btn-sm btn-primary rounded-2xl font-bold"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => {
                const sent = isRequested(user._id);
                const incomingReqId = incomingRequestsMap.get(user._id);
                const isIncoming = Boolean(incomingReqId);
                const isOnline = isUserOnline(user._id);
                const isSubmitting = submittingId === user._id;

                const isMutualMatch =
                  authUser &&
                  user.nativeLanguage &&
                  user.learningLanguage &&
                  user.nativeLanguage.toLowerCase() ===
                    authUser.learningLanguage?.toLowerCase() &&
                  user.learningLanguage.toLowerCase() ===
                    authUser.nativeLanguage?.toLowerCase();

                return (
                  <div
                    key={user._id}
                    className="p-5 rounded-3xl bg-base-200/90 hover:bg-base-200 border border-base-content/10 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Passport Ribbon */}
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className="flex items-center gap-3.5 cursor-pointer"
                          onClick={() => setSelectedUser(user)}
                          title="View Full Profile"
                        >
                          <div className="relative">
                            <Avatar
                              src={user.profilePic}
                              name={user.fullName}
                              size="lg"
                              showOnline={isOnline}
                              isOnline={isOnline}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-extrabold text-base sm:text-lg text-base-content group-hover:text-primary transition-colors truncate">
                                {user.fullName}
                              </h3>
                              <span className="text-base">
                                {getLanguageFlag(user.nativeLanguage)}
                              </span>
                            </div>
                            {user.location && (
                              <p className="text-xs font-medium text-base-content/75 flex items-center gap-1 mt-0.5 truncate">
                                <MapPinIcon className="size-3 text-primary flex-shrink-0" />
                                <span className="truncate">{user.location}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Match or Incoming Badge */}
                        {isIncoming ? (
                          <span className="badge badge-success badge-sm font-bold flex-shrink-0 gap-1 text-xs py-2 px-2.5 text-white shadow-sm">
                            <CheckCircleIcon className="size-3" /> Requested
                          </span>
                        ) : isMutualMatch ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-600 border border-amber-500/25 flex items-center gap-1 flex-shrink-0">
                            <Sparkles className="size-3 fill-amber-500 text-amber-500" />
                            <span>100% Match</span>
                          </span>
                        ) : isOnline ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 flex items-center gap-1 flex-shrink-0">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Online</span>
                          </span>
                        ) : null}
                      </div>

                      {/* Language Exchange Matrix Bridge */}
                      <div className="my-4 p-3 rounded-2xl bg-base-100 border border-base-content/10 flex items-center justify-between text-xs font-bold shadow-xs">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <span className="text-xl">
                            {getLanguageFlag(user.nativeLanguage)}
                          </span>
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-base-content/60 font-extrabold">
                              Native
                            </span>
                            <span className="font-bold">
                              {capitialize(user.nativeLanguage || "English")}
                            </span>
                          </div>
                        </div>

                        <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs">
                          <ArrowRightLeft className="size-3.5" />
                        </div>

                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-right">
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-base-content/60 font-extrabold">
                              Learning
                            </span>
                            <span className="font-bold">
                              {capitialize(user.learningLanguage || "Spanish")}
                            </span>
                          </div>
                          <span className="text-xl">
                            {getLanguageFlag(user.learningLanguage)}
                          </span>
                        </div>
                      </div>

                      {/* Bio */}
                      {user.bio && (
                        <p className="text-xs text-base-content/80 font-medium italic line-clamp-2 px-1 mb-3">
                          "{user.bio}"
                        </p>
                      )}
                    </div>

                    {/* Bottom Action Suite */}
                    <div className="pt-3 border-t border-base-content/10 flex items-center gap-2">
                      {isIncoming ? (
                        <div className="flex items-center gap-2 w-full">
                          <button
                            type="button"
                            onClick={() =>
                              handleAcceptRequest(incomingReqId, user._id)
                            }
                            disabled={isSubmitting}
                            className="btn btn-success flex-1 rounded-2xl font-bold gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-white text-xs"
                            title="Accept friend request"
                          >
                            <CheckCircleIcon className="size-4" />
                            <span>Accept</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleRejectRequest(incomingReqId, user._id)
                            }
                            disabled={isSubmitting}
                            className="btn btn-ghost btn-outline btn-error btn-square rounded-2xl transition-all"
                            title="Decline request"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ) : sent ? (
                        <button
                          type="button"
                          onClick={() => handleCancelRequest(user._id)}
                          disabled={isSubmitting}
                          className="btn btn-outline btn-error w-full rounded-2xl font-bold gap-2 transition-all active:scale-[0.98] text-xs"
                          title="Cancel friend request"
                        >
                          <X className="size-4" />
                          <span>Cancel Request</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendRequest(user._id)}
                          disabled={isSubmitting}
                          className="btn btn-primary flex-1 rounded-2xl font-bold gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-xs"
                        >
                          <UserPlusIcon className="size-4" />
                          <span>Connect</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedUser(user)}
                        className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-primary transition-colors"
                        title="View Full Passport Profile"
                      >
                        <IdCard className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* User Full Profile Modal */}
      {selectedUser && (
        <UserProfileModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
          isFriend={friends.some((f) => f._id === selectedUser._id)}
          isRequested={isRequested(selectedUser._id)}
          isIncoming={incomingRequestsMap.has(selectedUser._id)}
          onSendRequest={(id) => handleSendRequest(id)}
          onCancelRequest={(id) => handleCancelRequest(id)}
          onAcceptRequest={() => {
            const reqId = incomingRequestsMap.get(selectedUser._id);
            if (reqId) handleAcceptRequest(reqId, selectedUser._id);
          }}
          onRejectRequest={() => {
            const reqId = incomingRequestsMap.get(selectedUser._id);
            if (reqId) handleRejectRequest(reqId, selectedUser._id);
          }}
        />
      )}
    </div>
  );
};

export default HomePage;
