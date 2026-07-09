import { useEffect, type ReactNode } from "react";
import { useStore } from "@/lib/lifegrid-store";
import { AuthForm } from "./AuthForm";

function Backdrop({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 fade-in"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg slide-up">
        {children}
      </div>
    </div>
  );
}

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <Backdrop onClose={onClose}>
      <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white heartbeat">
              <i className="fa-solid fa-heart-pulse" />
            </span>
            <h2 className="font-display text-xl font-bold">Welcome Back</h2>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-foreground" aria-label="Close">
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>
        <AuthForm onSuccess={onClose} />
      </div>
    </Backdrop>
  );
}

export function NotificationsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notifications, markAllRead } = useStore();
  useEffect(() => {
    if (open) markAllRead();
  }, [open, markAllRead]);
  if (!open) return null;
  return (
    <Backdrop onClose={onClose}>
      <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Notifications</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-foreground" aria-label="Close">
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>
        <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`p-3 rounded-xl flex gap-3 bg-bg-secondary ${
                !n.read ? "border-l-4 border-primary" : ""
              }`}
            >
              <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary grid place-items-center">
                <i className={n.icon ?? "fa-solid fa-bell"} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{n.title}</div>
                <div className="text-xs text-text-secondary">{n.message}</div>
                <div className="text-[10px] text-text-light mt-1">{n.timestamp}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Backdrop>
  );
}

export function EmergencyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <Backdrop onClose={onClose}>
      <div className="rounded-2xl shadow-lg overflow-hidden text-white bg-gradient-to-br from-[color:var(--emergency-color)] to-[#a01e1e] p-8 text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-white/20 grid place-items-center pulse-icon">
          <i className="fa-solid fa-truck-medical text-3xl" />
        </div>
        <h2 className="font-display text-2xl font-bold">Medical Emergency?</h2>
        <p className="text-sm text-white/90 mt-2 mb-6">
          Get help right now — call an ambulance or find the nearest hospital with an emergency bed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="tel:108"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[30px] bg-white text-[color:var(--emergency-color)] font-bold lift-hover"
          >
            <i className="fa-solid fa-phone" /> Call 108
          </a>
          <a
            href="/#hospitals"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[30px] border-2 border-white/70 font-bold hover:bg-white/10"
          >
            <i className="fa-solid fa-hospital" /> Find Nearby Hospitals
          </a>
        </div>
        <button onClick={onClose} className="mt-6 text-white/80 text-sm underline">
          Dismiss
        </button>
      </div>
    </Backdrop>
  );
}

export function UserProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useStore();
  if (!open || !user) return null;
  return (
    <Backdrop onClose={onClose}>
      <div className="bg-card rounded-2xl shadow-lg border border-border p-6 text-center">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">My Profile</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-foreground" aria-label="Close">
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="h-20 w-20 rounded-full bg-primary text-white grid place-items-center font-bold text-3xl shadow-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-display text-2xl font-bold text-foreground mt-2">{user.name}</h3>
          <p className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide">
            {user.role === "patient" ? "Verified Patient" : user.role}
          </p>
          <div className="w-full mt-6 space-y-4 text-left border-t border-border pt-4">
            <div>
              <span className="text-xs text-text-secondary uppercase font-semibold">Email Address</span>
              <p className="text-foreground font-medium mt-0.5">{user.email}</p>
            </div>
            <div>
              <span className="text-xs text-text-secondary uppercase font-semibold">Contact Number</span>
              <p className="text-foreground font-medium mt-0.5">{user.phone || "Not provided"}</p>
            </div>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}
