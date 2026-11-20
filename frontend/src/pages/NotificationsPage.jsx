import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
} from "../lib/api";
import {
  BellIcon,
  ClockIcon,
  MessageSquareIcon,
  UserCheckIcon,
  X,
  Check,
  Sparkles,
  ArrowRightLeft,
  Compass,
  MessageCircle,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import toast from "react-hot-toast";
import NoNotificationsFound from "../components/NoNotificationsFound";
import Avatar from "../components/Avatar.jsx";
import { getLanguageFlag } from "../lib/languageUtils.jsx";
import { capitialize } from "../lib/utils";

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [actioningId, setActioningId] = useState(null);
  const [actionType, setActionType] = useState(null); // 'accept' | 'reject'
  const [activeTab, setActiveTab] = useState("incoming"); // 'incoming' | 'accepted'

  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const { mutate: acceptRequestMutation } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      toast.success("Friend request accepted! 🎉");
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to accept request");
    },
    onSettled: () => {
      setActioningId(null);
      setActionType(null);
    },
  });

  const { mutate: rejectRequestMutation } = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => {
      toast.success("Friend request declined");
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to decline request");
    },
    onSettled: () => {
      setActioningId(null);
      setActionType(null);
    },
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];

  return (
    <div className="p-4 sm:p-6 lg:p-7 w-full space-y-5 select-none">
      {/* ======================================================== */}
      {/* BENTO HEADER: ACTIVITY & REQUESTS SPOTLIGHT              */}
      {/* ======================================================== */}
      <section className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-primary/15 via-base-200 to-secondary/15 border border-primary/25 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-content shadow-sm flex items-center gap-1.5">
              <BellIcon className="size-3.5" />
              <span>Activity Hub</span>
            </span>
            {incomingRequests.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 border border-amber-500/25">
                {incomingRequests.length} Pending
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-content">
            Notifications & Connection Requests
          </h1>
          <p className="text-xs sm:text-sm text-base-content/80 max-w-xl font-medium">
            Review incoming language partner requests and celebrate new mutual exchange connections.
          </p>
        </div>

        <Link
          to="/"
          className="btn btn-primary btn-sm rounded-2xl font-bold text-xs shadow-md shadow-primary/25 gap-1.5 self-start md:self-auto"
        >
          <Compass className="size-4" />
          <span>Discover Learners</span>
        </Link>
      </section>

      {/* ======================================================== */}
      {/* TAB CONTROLS                                             */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-base-200/90 border border-base-content/10 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("incoming")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "incoming"
              ? "bg-primary text-primary-content shadow-sm"
              : "text-base-content/75 hover:text-base-content hover:bg-base-300/50"
          }`}
        >
          <UserCheckIcon className="size-4" />
          <span>Incoming Requests</span>
          {incomingRequests.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === "incoming"
                  ? "bg-primary-content text-primary"
                  : "bg-primary text-primary-content"
              }`}
            >
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("accepted")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "accepted"
              ? "bg-primary text-primary-content shadow-sm"
              : "text-base-content/75 hover:text-base-content hover:bg-base-300/50"
          }`}
        >
          <Users className="size-4" />
          <span>New Connections</span>
          {acceptedRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-base-300 text-base-content/80">
              {acceptedRequests.length}
            </span>
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: INCOMING REQUESTS */}
          {activeTab === "incoming" && (
            <section className="space-y-4">
              {incomingRequests.length === 0 ? (
                <div className="p-12 rounded-3xl bg-base-200/70 border border-base-content/10 flex flex-col items-center text-center space-y-3">
                  <UserCheckIcon className="size-12 text-primary opacity-50" />
                  <h3 className="font-bold text-lg text-base-content">
                    No pending friend requests
                  </h3>
                  <p className="text-xs sm:text-sm text-base-content/75 max-w-sm mx-auto font-medium">
                    When language learners find your profile and ask to connect, their invitations will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {incomingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="p-5 rounded-3xl bg-base-200/90 border border-base-content/10 hover:border-primary/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={request.sender?.profilePic}
                              name={request.sender?.fullName || "User"}
                              size="lg"
                            />
                            <div>
                              <h3 className="font-extrabold text-base text-base-content">
                                {request.sender?.fullName}
                              </h3>
                              <p className="text-xs font-medium text-base-content/70">
                                {request.sender?.location || "Language Learner"}
                              </p>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-primary/15 text-primary border border-primary/20">
                            Wants to Connect
                          </span>
                        </div>

                        {/* Language Bridge */}
                        <div className="my-3 p-3 rounded-2xl bg-base-100 border border-base-content/10 flex items-center justify-between text-xs font-bold">
                          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <span className="text-lg">
                              {getLanguageFlag(request.sender?.nativeLanguage)}
                            </span>
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider text-base-content/60 font-extrabold">
                                Native
                              </span>
                              <span>
                                {capitialize(request.sender?.nativeLanguage || "English")}
                              </span>
                            </div>
                          </div>

                          <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px]">
                            <ArrowRightLeft className="size-3" />
                          </div>

                          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-right">
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider text-base-content/60 font-extrabold">
                                Learning
                              </span>
                              <span>
                                {capitialize(request.sender?.learningLanguage || "Spanish")}
                              </span>
                            </div>
                            <span className="text-lg">
                              {getLanguageFlag(request.sender?.learningLanguage)}
                            </span>
                          </div>
                        </div>

                        {request.sender?.bio && (
                          <p className="text-xs text-base-content/75 italic line-clamp-2 px-1 mb-2 font-medium">
                            "{request.sender.bio}"
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-3 border-t border-base-content/10 flex items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm flex-1 rounded-2xl font-bold shadow-sm active:scale-[0.98] transition-all text-xs gap-1.5"
                          onClick={() => {
                            setActioningId(request._id);
                            setActionType("accept");
                            acceptRequestMutation(request._id);
                          }}
                          disabled={actioningId === request._id}
                        >
                          {actioningId === request._id && actionType === "accept" ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <>
                              <Check className="size-4" />
                              <span>Accept Connection</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline btn-error btn-sm rounded-2xl font-bold px-4 text-xs active:scale-[0.98] transition-all"
                          onClick={() => {
                            setActioningId(request._id);
                            setActionType("reject");
                            rejectRequestMutation(request._id);
                          }}
                          disabled={actioningId === request._id}
                        >
                          {actioningId === request._id && actionType === "reject" ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            "Decline"
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB 2: ACCEPTED CONNECTIONS */}
          {activeTab === "accepted" && (
            <section className="space-y-4">
              {acceptedRequests.length === 0 ? (
                <div className="p-12 rounded-3xl bg-base-200/70 border border-base-content/10 flex flex-col items-center text-center space-y-3">
                  <Users className="size-12 text-primary opacity-50" />
                  <h3 className="font-bold text-lg text-base-content">
                    No new connections yet
                  </h3>
                  <p className="text-xs sm:text-sm text-base-content/75 max-w-sm mx-auto font-medium">
                    When mutual friend requests are accepted, your new partners will show up here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {acceptedRequests.map((notification) => (
                    <div
                      key={notification._id}
                      className="p-4 sm:p-5 rounded-3xl bg-base-200/90 border border-base-content/10 hover:border-primary/40 shadow-sm transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Avatar
                          src={notification.recipient.profilePic}
                          name={notification.recipient.fullName}
                          size="md"
                        />
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm sm:text-base text-base-content truncate">
                            {notification.recipient.fullName}
                          </h3>
                          <p className="text-xs text-base-content/70 mt-0.5 truncate font-medium">
                            Accepted your connection request
                          </p>
                          <span className="text-[11px] font-mono text-primary font-semibold flex items-center gap-1 mt-1">
                            <ClockIcon className="size-3" />
                            <span>Recently connected</span>
                          </span>
                        </div>
                      </div>

                      <Link
                        to={`/chat/${notification.recipient._id}`}
                        className="btn btn-primary btn-sm rounded-2xl font-bold text-xs gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-95 flex-shrink-0"
                      >
                        <MessageCircle className="size-3.5" />
                        <span>Say Hi 👋</span>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
