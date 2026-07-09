import { useMemo, useState } from "react";
import { toast } from "sonner";
import { HOSPITALS } from "@/lib/lifegrid-data";
import { useStore, type AppUser } from "@/lib/lifegrid-store";

type Role = "patient";

function passwordScore(pw: string): { score: number; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const colors = [
    "bg-[color:var(--danger-color)]",
    "bg-[color:var(--warning-color)]",
    "bg-[color:var(--warning-color)]",
    "bg-[color:var(--success-color)]",
    "bg-[color:var(--success-color)]",
  ];
  const idx = Math.max(0, Math.min(4, s - 1));
  return { score: s, label: labels[idx], color: colors[idx] };
}



export function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const { setUser } = useStore();
  const [role, setRole] = useState<Role>("patient");
  const [otpMode, setOtpMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const pwStrength = useMemo(() => passwordScore(password), [password]);

  const login = (name: string, identifier: string, extra?: Partial<AppUser>) => {
    setLoading(true);
    setTimeout(() => {
      const u: AppUser = {
        id: `u_${Date.now()}`,
        name,
        email: identifier,
        role,
        ...extra,
      };
      setUser(u);
      toast.success(`Welcome back, ${name}!`);
      setLoading(false);
      onSuccess?.();
    }, 700);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpMode) {
      const code = otp.join("");
      if (code.length < 4) return toast.error("Enter the 4-digit OTP");
      login(phone || "Patient", phone);
    } else {
      if (!email || !password) return toast.error("Enter both fields");

      const name = email.split("@")[0] || "Patient";
      login(name, email);
    }
  };

  const setOtpDigit = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 3) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const onOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (text.length === 4) {
      setOtp(text.split(""));
      e.preventDefault();
    }
  };

  const forgot = () => {
    const em = window.prompt("Enter your email");
    if (em) toast.success(`Reset link sent to ${em}`);
  };

  return (
    <div className="w-full">


      <form onSubmit={submit} className="space-y-4 fade-in" key={`${role}-${otpMode}`}>
        {role === "patient" && otpMode ? (
          <>
            <label className="block text-sm">
              <span className="text-text-secondary">Phone number</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="mt-1 w-full h-11 px-3 rounded-lg border border-border bg-background outline-none focus:border-primary"
              />
            </label>
            <div>
              <span className="text-text-secondary text-sm">Enter OTP</span>
              <div className="flex gap-2 mt-1" onPaste={onOtpPaste}>
                {otp.map((d, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    value={d}
                    onChange={(e) => setOtpDigit(i, e.target.value)}
                    maxLength={1}
                    inputMode="numeric"
                    className="h-12 w-12 text-center text-lg font-bold rounded-lg border border-border bg-background outline-none focus:border-primary"
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <label className="block text-sm">
              <span className="text-text-secondary">
                Email
              </span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className="mt-1 w-full h-11 px-3 rounded-lg border border-border bg-background outline-none focus:border-primary"
              />
            </label>
            <label className="block text-sm">
              <span className="text-text-secondary">Password</span>
              <div className="relative mt-1">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full h-11 px-3 pr-10 rounded-lg border border-border bg-background outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                  aria-label="Toggle visibility"
                >
                  <i className={`fa-solid ${showPw ? "fa-eye-slash" : "fa-eye"}`} />
                </button>
              </div>
              {role === "patient" && password && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                    <div
                      className={`h-full transition-all ${pwStrength.color}`}
                      style={{ width: `${(pwStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs mt-1 text-text-secondary">Strength: {pwStrength.label}</div>
                </div>
              )}
            </label>
            {role === "patient" && (
              <button
                type="button"
                onClick={forgot}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Forgot password?
              </button>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-[30px] bg-primary text-white font-semibold lift-hover disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <i className="fa-solid fa-spinner fa-spin" />}
          {loading ? "Signing in…" : "Sign In"}
        </button>

        {role === "patient" && (
          <button
            type="button"
            onClick={() => setOtpMode((v) => !v)}
            className="w-full text-sm text-primary font-semibold"
          >
            {otpMode ? "Sign in with password" : "Sign in with OTP"}
          </button>
        )}

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-light">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          type="button"
          onClick={() => login("Google User", "google@lifegrid.dev")}
          className="w-full h-11 rounded-[30px] border border-border font-semibold flex items-center justify-center gap-2 hover:bg-bg-secondary"
        >
          <i className="fa-brands fa-google text-[color:var(--secondary-color)]" />
          Continue with Google
        </button>
      </form>
    </div>
  );
}
