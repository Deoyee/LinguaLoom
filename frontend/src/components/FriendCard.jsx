import { useState } from "react";
import { Link } from "react-router";
import {
  MessageSquare,
  MapPin,
  UserMinus,
  Loader2,
  IdCard,
  Phone,
  Video,
  ArrowRightLeft,
} from "lucide-react";
import { getLanguageFlag } from "../lib/languageUtils.jsx";
import Avatar from "./Avatar.jsx";
import useOnlineUsers from "../hooks/useOnlineUsers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unfriendUser } from "../lib/api";
import { capitialize } from "../lib/utils";
import toast from "react-hot-toast";

const FriendCard = ({ friend, onViewProfile, hasChatHistory = false }) => {
  const { isUserOnline } = useOnlineUsers();
  const isOnline = isUserOnline(friend?._id);
  const queryClient = useQueryClient();
  const [confirmingUnfriend, setConfirmingUnfriend] = useState(false);

  const { mutate: unfriendMutation, isPending: isUnfriending } = useMutation({
    mutationFn: () => unfriendUser(friend._id),
    onSuccess: () => {
      toast.success(`Removed ${friend.fullName} from friends`);
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["chatHistory"] });
    },
    onError: () => {
      toast.error("Failed to unfriend user");
    },
  });

  return (
    <div className="p-4 rounded-3xl bg-base-200/90 hover:bg-base-200 border border-base-content/10 hover:border-primary/40 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group select-none">
      <div>
        {/* Top Header Row: Avatar, Info, & Call Shortcuts */}
        <div className="flex items-start justify-between gap-2.5">
          <div
            className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
            onClick={() => onViewProfile && onViewProfile(friend)}
            title="View Profile"
          >
            <div className="relative flex-shrink-0">
              <Avatar
                src={friend.profilePic}
                name={friend.fullName}
                size="md"
                showOnline={isOnline}
                isOnline={isOnline}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-bold text-base-content group-hover:text-primary transition-colors truncate leading-tight">
                  {friend.fullName}
                </h3>
                <span className="text-base flex-shrink-0">
                  {getLanguageFlag(friend.nativeLanguage)}
                </span>
              </div>

              <div className="text-xs text-base-content/60 font-medium mt-0.5 truncate">
                Language Partner
              </div>
            </div>
          </div>

          {/* Quick Call Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Link
              to={`/chat/${friend._id}`}
              className="w-7 h-7 rounded-xl bg-base-100 hover:bg-primary hover:text-primary-content text-base-content/75 flex items-center justify-center transition-all shadow-xs border border-base-content/10"
              title="Voice Call"
            >
              <Phone className="size-3.5" />
            </Link>
            <Link
              to={`/chat/${friend._id}`}
              className="w-7 h-7 rounded-xl bg-base-100 hover:bg-primary hover:text-primary-content text-base-content/75 flex items-center justify-center transition-all shadow-xs border border-base-content/10"
              title="Video Call"
            >
              <Video className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Visual Language Matrix Bridge */}
        <div className="my-3 p-2.5 rounded-2xl bg-base-100 border border-base-content/10 flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base flex-shrink-0">
              {getLanguageFlag(friend.nativeLanguage)}
            </span>
            <div className="min-w-0">
              <span className="block text-[9px] uppercase tracking-wider text-base-content/50 font-bold leading-none">
                Native
              </span>
              <span className="font-semibold text-xs text-base-content truncate block mt-0.5">
                {capitialize(friend.nativeLanguage || "English")}
              </span>
            </div>
          </div>

          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mx-1">
            <ArrowRightLeft className="size-3" />
          </div>

          <div className="flex items-center gap-2 min-w-0 text-right justify-end">
            <div className="min-w-0">
              <span className="block text-[9px] uppercase tracking-wider text-base-content/50 font-bold leading-none">
                Learning
              </span>
              <span className="font-semibold text-xs text-base-content truncate block mt-0.5">
                {capitialize(friend.learningLanguage || "Spanish")}
              </span>
            </div>
            <span className="text-base flex-shrink-0">
              {getLanguageFlag(friend.learningLanguage)}
            </span>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      {confirmingUnfriend ? (
        <div className="pt-3 border-t border-base-content/10 animate-fadeIn">
          <div className="bg-error/10 border border-error/25 rounded-2xl p-2.5 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-error flex items-center gap-1 truncate">
              <UserMinus className="size-3.5 flex-shrink-0" />
              <span>Unfriend?</span>
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => unfriendMutation()}
                disabled={isUnfriending}
                className="btn btn-error btn-xs rounded-xl text-white font-bold shadow-xs"
              >
                {isUnfriending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  "Remove"
                )}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingUnfriend(false)}
                className="btn btn-ghost btn-xs rounded-xl text-base-content/80 hover:text-base-content font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-3 border-t border-base-content/10 flex items-center gap-2">
          <Link
            to={`/chat/${friend._id}`}
            className="btn btn-primary btn-sm flex-1 rounded-2xl gap-2 font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-xs"
          >
            <MessageSquare className="size-3.5" />
            <span>Open Chat</span>
          </Link>

          {onViewProfile && (
            <button
              type="button"
              onClick={() => onViewProfile(friend)}
              className="btn btn-ghost btn-sm btn-square rounded-2xl text-base-content/70 hover:text-primary hover:bg-base-100 transition-colors"
              title="View Language Passport"
            >
              <IdCard className="size-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setConfirmingUnfriend(true)}
            className="btn btn-ghost btn-sm btn-square rounded-2xl text-base-content/60 hover:text-error hover:bg-error/10 transition-colors"
            title="Unfriend partner"
          >
            <UserMinus className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FriendCard;
