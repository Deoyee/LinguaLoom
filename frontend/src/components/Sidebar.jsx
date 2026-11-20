import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import {
  BellIcon,
  HomeIcon,
  UsersIcon,
  UserIcon,
  MessageSquare,
  BookOpen,
  Sparkles,
  ArrowRightLeft,
} from "lucide-react";
import Avatar from "./Avatar.jsx";
import { getLanguageFlag } from "../lib/languageUtils.jsx";
import { useQuery } from "@tanstack/react-query";
import { getFriendRequests } from "../lib/api";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;

  // fetch notifications count
  const { data: friendRequestsData } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    retry: false,
  });

  const friendRequestsCount = friendRequestsData?.incomingReqs?.length || 0;

  const navItems = [
    { name: "Home", path: "/", icon: HomeIcon },
    { name: "Practice", path: "/practice", icon: BookOpen },
    {
      name: "Friends",
      path: "/friends",
      icon: UsersIcon,
      badge: null,
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: BellIcon,
      badge: friendRequestsCount,
    },
    { name: "Profile", path: "/profile", icon: UserIcon },
  ];

  return (
    <aside className="w-64 bg-base-200/90 backdrop-blur-xl border-r border-base-content/10 hidden lg:flex flex-col h-screen sticky top-0 z-20 select-none justify-between transition-all">
      <div className="flex flex-col">
        {/* Brand Logo Header */}
        <div className="p-5 border-b border-base-content/10">
          <Link
            to="/"
            className="flex items-center gap-3 group transition-transform duration-200 hover:scale-[1.02]"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-primary-content shadow-lg shadow-primary/25">
              <img
                src="/lingualoom-mark.svg"
                alt="LinguaLoom"
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <span className="text-xl font-extrabold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider block leading-tight">
                LinguaLoom
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-base-content/60">
                Language Hub
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-content font-bold shadow-md shadow-primary/25 scale-[1.01]"
                    : "text-base-content/80 hover:text-base-content hover:bg-base-300/70 font-semibold"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={`size-5 ${
                      isActive ? "text-primary-content" : "text-base-content/75"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold shadow-sm ${
                      isActive
                        ? "bg-primary-content text-primary"
                        : "bg-primary text-primary-content"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Language Passport Footer */}
      <div className="p-4 border-t border-base-content/10">
        <Link
          to="/profile"
          className="flex items-center gap-3 p-3 rounded-2xl bg-base-100/90 hover:bg-base-100 border border-base-content/10 hover:border-primary/40 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          title="Edit Profile"
        >
          <div className="relative flex-shrink-0">
            <Avatar
              src={authUser?.profilePic}
              name={authUser?.fullName}
              size="md"
              ring={true}
              showOnline={true}
              isOnline={true}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs sm:text-sm text-base-content group-hover:text-primary transition-colors truncate">
              {authUser?.fullName}
            </p>
            {authUser?.nativeLanguage && authUser?.learningLanguage ? (
              <p className="text-[11px] font-semibold text-primary flex items-center gap-1 mt-0.5 truncate">
                <span>{getLanguageFlag(authUser.nativeLanguage)}</span>
                <span className="truncate">{authUser.nativeLanguage}</span>
                <span className="text-base-content/40">⇄</span>
                <span>{getLanguageFlag(authUser.learningLanguage)}</span>
              </p>
            ) : (
              <p className="text-xs text-primary font-medium mt-0.5">
                Set up languages
              </p>
            )}
          </div>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
