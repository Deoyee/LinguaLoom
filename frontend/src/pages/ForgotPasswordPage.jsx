import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, EyeIcon, EyeOffIcon, KeyRound, Mail, CheckCircle2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { forgotPassword, resetPassword } from "../lib/api";
import AuthLayout from "../components/AuthLayout.jsx";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Enter OTP & New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    try {
      setIsLoading(true);
      await forgotPassword(email.trim());
      toast.success("Verification code sent to your email!");
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send verification code";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp.trim()) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      const res = await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      toast.success(res.message || "Password reset successfully!");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to reset password";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    try {
      setIsLoading(true);
      await forgotPassword(email.trim());
      toast.success("A new verification code has been sent to your email!");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to resend verification code";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      storyTitle="Your next conversation is still waiting."
      storyDescription="Reset your password securely and get back to learning with language partners around the world."
    >
      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleRequestOtp} className="space-y-6">
          <div>
            <h1 className="font-serif text-4xl font-semibold">Reset your password.</h1>
            <p className="mt-2 text-sm text-base-content/60">
              Enter the email linked to your account and we’ll send a verification code.
            </p>
          </div>

          <div className="form-control w-full">
            <label htmlFor="recovery-email" className="mb-2 text-xs font-semibold text-base-content/75">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-base-content/45" />
              <input
                id="recovery-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="input input-bordered h-12 w-full rounded-xl border-base-content/15 bg-base-200/30 pl-11 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
            {isLoading ? <><span className="loading loading-spinner loading-xs" />Sending code...</> : "Send verification code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="mb-5">
            <span className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
              <CheckCircle2 className="size-4 shrink-0" />
              <span className="truncate">Code sent to {email}</span>
            </span>
            <h1 className="font-serif text-4xl font-semibold">Choose a new password.</h1>
            <p className="mt-2 text-sm text-base-content/60">
              Enter the six-digit code and choose a password with at least six characters.
            </p>
          </div>

          <div className="form-control w-full">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label htmlFor="recovery-code" className="text-xs font-semibold text-base-content/75">
                Verification code
              </label>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
              >
                <RefreshCw className="size-3.5" /> Resend code
              </button>
            </div>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-base-content/45" />
              <input
                id="recovery-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                className="input input-bordered h-12 w-full rounded-xl border-base-content/15 bg-base-200/30 pl-11 font-mono tracking-[0.3em] focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-control w-full">
            <label htmlFor="new-password" className="mb-2 text-xs font-semibold text-base-content/75">
              New password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="input input-bordered h-12 w-full rounded-xl border-base-content/15 bg-base-200/30 pr-12 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm absolute right-1 top-1/2 -translate-y-1/2 text-base-content/55"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </div>

          <div className="form-control w-full">
            <label htmlFor="confirm-password" className="mb-2 text-xs font-semibold text-base-content/75">
              Confirm new password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className="input input-bordered h-12 w-full rounded-xl border-base-content/15 bg-base-200/30 pr-12 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm absolute right-1 top-1/2 -translate-y-1/2 text-base-content/55"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
            {isLoading ? <><span className="loading loading-spinner loading-xs" />Resetting password...</> : "Reset password"}
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full py-1 text-center text-xs font-semibold text-base-content/60 hover:text-primary"
          >
            Use a different email address
          </button>
        </form>
      )}

      <div className="mt-8 border-t border-base-content/10 pt-5">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-base-content/60 hover:text-primary">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
