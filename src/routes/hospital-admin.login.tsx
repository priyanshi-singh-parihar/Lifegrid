import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HOSPITALS } from "@/lib/lifegrid-data";
import { useStore, type AppUser } from "@/lib/lifegrid-store";

export const Route = createFileRoute("/hospital-admin/login")({
  head: () => ({
    meta: [
      { title: "Hospital Login â€” LifeGrid" },
      {
        name: "description",
        content: "Sign in as a hospital to manage bed inventory and patient booking requests.",
      },
    ],
  }),
  component: HospitalAdminLoginPage,
});

function parseHospitalId(raw: string): number | null {
  const m = raw.trim().toUpperCase().match(/^HSP-?(\d+)$/);
  if (!m) return null;
  const num = parseInt(m[1], 10);
  if (num >= 1 && num <= 18) {
    return num + 100;
  }
  return num;
}

function HospitalAdminLoginPage() {
  const { user, setUser } = useStore();
  const navigate = useNavigate();
  const [hospitalIdInput, setHospitalIdInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === "hospital" && user.hospitalId) {
      navigate({ to: "/hospital-admin", replace: true });
    }
  }, [user, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalIdInput || !password) {
      toast.error("Enter Hospital ID and password");
      return;
    }
    const hid = parseHospitalId(hospitalIdInput);
    if (!hid) {
      toast.error("Hospital ID must be in the form HSP-101 or HSP-1");
      return;
    }
    const hospital = HOSPITALS.find((h) => h.id === hid);
    if (!hospital) {
      toast.error("No hospital found for that ID");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const u: AppUser = {
        id: `hsp_${hospital.id}`,
        name: hospital.name,
        email: `HSP-${hospital.id}`,
        role: "hospital",
        hospitalId: hospital.id,
      };
      setUser(u);
      toast.success(`Signed in as ${hospital.name}`);
      setLoading(false);
      navigate({ to: "/hospital-admin", replace: true });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-card border border-border rounded-2xl shadow-lg p-6 slide-up">
          <div className="flex flex-col items-center text-center mb-6">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white heartbeat">
              <i className="fa-solid fa-hospital text-2xl" />
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold">Hospital Login</h1>
            <p className="text-sm text-text-secondary">
              Manage bed inventory and patient booking requests for your hospital.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4 fade-in">
            <label className="block text-sm">
              <span className="text-text-secondary">Hospital ID</span>
              <input
                value={hospitalIdInput}
                onChange={(e) => setHospitalIdInput(e.target.value)}
                placeholder="HSP-1"
                autoComplete="username"
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
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  autoComplete="current-password"
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
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-[30px] bg-primary text-white font-semibold lift-hover disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <i className="fa-solid fa-spinner fa-spin" />}
              {loading ? "Signing inâ€¦" : "Sign in to dashboard"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-text-secondary space-y-1">
            <p>Patient trying to book a bed? Use the main login instead.</p>
            <Link to="/login" className="text-primary font-semibold">
              â† User login
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-text-light">
          Demo tip: use any ID from HSP-101 to HSP-118 (or HSP-1 to HSP-18) with any password.
        </p>
      </div>
    </div>
  );
}

