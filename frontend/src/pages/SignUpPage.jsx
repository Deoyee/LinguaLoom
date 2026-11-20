import { useState } from "react";
import { Link } from "react-router";
import useSignUp from "../hooks/useSignUp";
import { EyeIcon, EyeOffIcon, LockKeyhole, Mail, UserRound } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const { signupMutation, error, isPending } = useSignUp();

  const handleSignup = (e) => {
    e.preventDefault();
    signupMutation(signupData);
  };

  return (
    <AuthLayout
      storyTitle="A new language opens a new world."
      storyDescription="Find conversation partners, share your culture, and make progress one real conversation at a time."
    >
      <form onSubmit={handleSignup} className="space-y-5">
        <div>
          <h1 className="font-serif text-4xl font-semibold">Create your account.</h1>
          <p className="mt-2 text-sm text-base-content/60">
            Start building confidence in a new language.
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error.response?.data?.message || "An error occurred"}
          </div>
        )}

        <div className="space-y-3.5">
          <div className="form-control w-full">
            <label htmlFor="signup-name" className="mb-2 text-xs font-semibold text-base-content/75">
              Full name
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-base-content/45" />
              <input
                id="signup-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                className="input input-bordered h-11 w-full rounded-xl border-base-content/15 bg-base-200/30 pl-11 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                value={signupData.fullName}
                onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-control w-full">
            <label htmlFor="signup-email" className="mb-2 text-xs font-semibold text-base-content/75">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-base-content/45" />
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="input input-bordered h-11 w-full rounded-xl border-base-content/15 bg-base-200/30 pl-11 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-control w-full">
            <label htmlFor="signup-password" className="mb-2 text-xs font-semibold text-base-content/75">
              Password
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-base-content/45" />
              <input
                id="signup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="input input-bordered h-11 w-full rounded-xl border-base-content/15 bg-base-200/30 pl-11 pr-12 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm absolute right-1 top-1/2 -translate-y-1/2 text-base-content/55 hover:text-base-content"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-base-content/50">Use at least 6 characters.</p>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-base-content/65">
          <input type="checkbox" className="checkbox checkbox-primary checkbox-sm mt-0.5 shrink-0" required />
          <span>
            I agree to the <span className="font-semibold text-primary">terms of service</span> and{" "}
            <span className="font-semibold text-primary">privacy policy</span>.
          </span>
        </label>

        <button type="submit" className="btn btn-primary h-11 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/20" disabled={isPending}>
          {isPending ? (
            <><span className="loading loading-spinner loading-xs" />Creating account...</>
          ) : "Create account"}
        </button>

        <p className="text-center text-sm text-base-content/65">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-primary hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default SignUpPage;
