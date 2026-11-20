import { useState, useEffect } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { updateProfile } from "../lib/api";
import {
  UserIcon,
  MapPinIcon,
  ShuffleIcon,
  SaveIcon,
  Loader2,
  Globe2,
  Languages,
  CheckCircle2,
  Sparkles,
  ArrowRightLeft,
  IdCard,
  MapPin,
  Check,
  PhoneCall,
  Film,
  Coffee,
  BookOpen,
  Plane,
} from "lucide-react";
import { LANGUAGES } from "../constants";
import Avatar from "../components/Avatar.jsx";
import LanguageDropdown from "../components/LanguageDropdown.jsx";
import { getLanguageFlag } from "../lib/languageUtils.jsx";
import { capitialize } from "../lib/utils";

const ProfilePage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState({
    fullName: "",
    bio: "",
    nativeLanguage: "",
    learningLanguage: "",
    location: "",
    profilePic: "",
  });

  useEffect(() => {
    if (authUser) {
      setFormState({
        fullName: authUser.fullName || "",
        bio: authUser.bio || "",
        nativeLanguage: authUser.nativeLanguage || "",
        learningLanguage: authUser.learningLanguage || "",
        location: authUser.location || "",
        profilePic: authUser.profilePic || "",
      });
    }
  }, [authUser]);

  const { mutate: profileMutation, isPending } = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success("Language Passport updated successfully! 🎉");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update profile");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.fullName.trim()) {
      return toast.error("Full name is required");
    }
    profileMutation(formState);
  };

  const handleRandomAvatar = () => {
    const styles = [
      "avataaars",
      "bottts",
      "fun-emoji",
      "adventurer",
      "lorelei",
    ];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const randomSeed =
      Math.random().toString(36).substring(2, 9) + "_" + Date.now();
    const randomAvatar = `https://api.dicebear.com/9.x/${randomStyle}/svg?seed=${randomSeed}`;

    setFormState((prev) => ({ ...prev, profilePic: randomAvatar }));
    toast.success("New AI avatar generated!");
  };

  const addBioSnippet = (snippet) => {
    setFormState((prev) => {
      const current = prev.bio.trim();
      const next = current ? `${current} • ${snippet}` : snippet;
      return { ...prev, bio: next.slice(0, 250) };
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-7 w-full space-y-4 select-none">
      {/* ======================================================== */}
      {/* HEADER SPOTLIGHT                                         */}
      {/* ======================================================== */}
      <section className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-primary/15 via-base-200 to-secondary/15 border border-primary/25 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-content shadow-sm flex items-center gap-1.5">
              <IdCard className="size-3.5" />
              <span>Language Passport Studio</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/25 flex items-center gap-1">
              <Check className="size-3" />
              <span>Verified Learner</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-base-content">
            Your Global Language Passport
          </h1>
          <p className="text-xs text-base-content/80 max-w-xl font-medium">
            Customize how language partners see you across hiMEstream. Edit your native language, target goals, and bio.
          </p>
        </div>
      </section>

      {/* ======================================================== */}
      {/* MAIN BENTO FORM & LIVE PASSPORT PREVIEW                  */}
      {/* ======================================================== */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: LIVE PASSPORT PREVIEW CARD */}
        <div className="lg:col-span-5 space-y-3">
          <div className="sticky top-6">
            <div className="p-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                <span>Live Passport Preview (Seen by Others)</span>
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-base-200/90 border border-base-content/15 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-5">
              {/* Header with Avatar & Name */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <Avatar
                      key={formState.profilePic}
                      src={formState.profilePic}
                      name={formState.fullName || "User"}
                      size="lg"
                      showOnline={true}
                      isOnline={true}
                    />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-base-content leading-snug truncate">
                      {formState.fullName || "Your Name"}
                    </h3>
                    <p className="text-xs font-medium text-base-content/75 flex items-center gap-1 mt-0.5">
                      <MapPin className="size-3 text-primary flex-shrink-0" />
                      <span>{formState.location || "Earth (Set Location)"}</span>
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-primary/15 text-primary border border-primary/20 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Passport Live</span>
                </span>
              </div>

              {/* Live Language Exchange Matrix */}
              <div className="p-3 rounded-2xl bg-base-100 border border-base-content/10 flex items-center justify-between text-xs font-bold shadow-xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <span className="text-xl">
                    {getLanguageFlag(formState.nativeLanguage || "English")}
                  </span>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-base-content/60 font-extrabold">
                      Native
                    </span>
                    <span>
                      {capitialize(formState.nativeLanguage || "English")}
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
                      {capitialize(formState.learningLanguage || "Spanish")}
                    </span>
                  </div>
                  <span className="text-xl">
                    {getLanguageFlag(formState.learningLanguage || "Spanish")}
                  </span>
                </div>
              </div>

              {/* Bio quote preview */}
              <div className="p-3 rounded-2xl bg-base-100/70 border border-base-content/5 text-xs text-base-content/85 italic font-medium leading-relaxed">
                "{formState.bio || "No bio written yet. Share your interests and learning goals so partners can connect!"}"
              </div>

              {/* Avatar Randomizer Button */}
              <div className="pt-2 border-t border-base-content/10 flex items-center justify-between">
                <span className="text-xs text-base-content/60 font-medium">
                  Want a new look?
                </span>
                <button
                  type="button"
                  onClick={handleRandomAvatar}
                  className="btn btn-outline btn-primary btn-xs rounded-xl font-bold gap-1.5"
                >
                  <ShuffleIcon className="size-3" />
                  <span>Randomize Avatar</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: BENTO FORM FIELDS */}
        <div className="lg:col-span-7 space-y-5">
          {/* Bento Card 1: Identity & Location */}
          <div className="p-6 rounded-3xl bg-base-200/90 border border-base-content/10 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-base-content/80 flex items-center gap-2">
              <UserIcon className="size-4 text-primary" />
              <span>Identity & Location</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-base-content">
                    Full Name *
                  </span>
                </label>
                <input
                  type="text"
                  value={formState.fullName}
                  onChange={(e) =>
                    setFormState({ ...formState, fullName: e.target.value })
                  }
                  className="input input-bordered h-11 rounded-2xl w-full text-xs sm:text-sm font-medium bg-base-100 border-base-content/20 focus:border-primary"
                  placeholder="e.g. Adeoye Emmanuel"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-base-content">
                    Location / City
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formState.location}
                    onChange={(e) =>
                      setFormState({ ...formState, location: e.target.value })
                    }
                    className="input input-bordered h-11 rounded-2xl w-full text-xs sm:text-sm font-medium bg-base-100 border-base-content/20 focus:border-primary pl-9"
                    placeholder="e.g. Tokyo, Japan or London, UK"
                  />
                  <MapPinIcon className="size-4 absolute left-3 top-3.5 text-base-content/60" />
                </div>
              </div>

              <div className="form-control sm:col-span-2">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-base-content flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-success" />
                    <span>Email Address (Account Linked)</span>
                  </span>
                </label>
                <input
                  type="email"
                  value={authUser?.email || ""}
                  disabled
                  className="input input-bordered h-11 rounded-2xl w-full text-xs sm:text-sm font-medium opacity-65 cursor-not-allowed bg-base-300/40 border-base-content/10"
                />
              </div>
            </div>
          </div>

          {/* Bento Card 2: Language Exchange Matrix */}
          <div className="p-6 rounded-3xl bg-base-200/90 border border-base-content/10 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-base-content/80 flex items-center gap-2">
              <Languages className="size-4 text-primary" />
              <span>Language Exchange Pair</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-base-content flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>Native Language *</span>
                  </span>
                </label>
                <LanguageDropdown
                  icon={Languages}
                  value={formState.nativeLanguage}
                  onChange={(val) =>
                    setFormState({ ...formState, nativeLanguage: val })
                  }
                  languages={LANGUAGES}
                  placeholder="Select native language"
                  showAllOption={false}
                  allowClear={false}
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-base-content flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-indigo-500" />
                    <span>Target / Learning Language *</span>
                  </span>
                </label>
                <LanguageDropdown
                  icon={Globe2}
                  value={formState.learningLanguage}
                  onChange={(val) =>
                    setFormState({ ...formState, learningLanguage: val })
                  }
                  languages={LANGUAGES}
                  placeholder="Select learning language"
                  showAllOption={false}
                  allowClear={false}
                />
              </div>
            </div>
          </div>

          {/* Bento Card 3: About Your Journey (Bio) */}
          <div className="p-6 rounded-3xl bg-base-200/90 border border-base-content/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-base-content/80 flex items-center gap-2">
                <Globe2 className="size-4 text-primary" />
                <span>About Your Learning Journey</span>
              </h3>
              <span className="text-xs font-mono font-bold text-base-content/60">
                {formState.bio.length} / 250
              </span>
            </div>

            <textarea
              value={formState.bio}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  bio: e.target.value.slice(0, 250),
                })
              }
              className="textarea textarea-bordered rounded-2xl h-28 resize-none w-full text-xs sm:text-sm font-medium bg-base-100 border-base-content/20 focus:border-primary placeholder:text-base-content/50"
              placeholder="Tell partners about your goals, interests, favourite topics, or when you are available for voice chat..."
            />

            {/* Quick Helper Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-base-content/60 mr-1">
                Quick Tags:
              </span>
              {[
                { label: "Weekly voice calls", Icon: PhoneCall },
                { label: "Cinema & Culture", Icon: Film },
                { label: "Casual conversation", Icon: Coffee },
                { label: "Grammar & Exam prep", Icon: BookOpen },
                { label: "Travel & Food", Icon: Plane },
              ].map(({ label, Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => addBioSnippet(label)}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-base-100 hover:bg-base-300 border border-base-content/15 text-base-content/85 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Icon className="size-3 text-primary flex-shrink-0" />
                  <span>+ {label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary rounded-2xl px-8 font-bold shadow-lg shadow-primary/25 hover:shadow-xl transition-all active:scale-[0.98] text-xs sm:text-sm gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Saving Passport...</span>
                </>
              ) : (
                <>
                  <SaveIcon className="size-4" />
                  <span>Save Passport Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
