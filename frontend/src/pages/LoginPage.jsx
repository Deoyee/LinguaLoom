import { useState } from "react";
import { Link } from "react-router";
import useLogin from "../hooks/useLogin";
import { EyeIcon, EyeOffIcon, LockKeyhole, Mail } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const { loginMutation, isPending, error } = useLogin();

  const handleLogin = async (e) => {
    e.preventDefault();
    loginMutation(loginData);
  };


  return (
    <AuthLayout
      storyTitle="A new language opens a new world."
      storyDescription="Find conversation partners, share your culture, and make progress one real conversation at a time."
    >
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <h1 className="font-serif text-4xl font-semibold">Welcome back.</h1>
          <p className="mt-2 text-sm text-base-content/60">
            Pick up where your next conversation begins.
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error.response?.data?.message || "An error occurred"}
          </div>
        )}

        <div className="space-y-4">
          <div className="form-control w-full">
            <label htmlFor="login-email" className="mb-2 text-xs font-semibold text-base-content/75">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-base-content/45" />
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="input input-bordered h-12 w-full rounded-xl border-base-content/15 bg-base-200/30 pl-11 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-control w-full">
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="login-password" className="text-xs font-semibold text-base-content/75">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-base-content/45" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="input input-bordered h-12 w-full rounded-xl border-base-content/15 bg-base-200/30 pl-11 pr-12 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
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
          </div>
        </div>

        <button type="submit" className="btn btn-primary h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/20" disabled={isPending}>
          {isPending ? (
            <><span className="loading loading-spinner loading-xs" />Signing in...</>
          ) : "Sign in"}
        </button>

        <p className="text-center text-sm text-base-content/65">
          New to LinguaLoom?{" "}
          <Link to="/signup" className="font-bold text-primary hover:underline">Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default LoginPage
