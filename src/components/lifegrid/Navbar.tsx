import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore, useTheme } from "@/lib/lifegrid-store";
import { LoginModal, NotificationsModal, EmergencyModal, UserProfileModal } from "./Modals";

export function Navbar({ onEmergency }: { onEmergency?: () => void }) {
  const { theme, toggle } = useTheme();
  const { user, logout, notifications } = useStore();
  const unread = notifications.filter((n) => !n.read).length;
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 80 && y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openEmergency = () => (onEmergency ? onEmergency() : setEmergencyOpen(true));

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 border-b border-border backdrop-blur bg-background/85 transition-transform duration-300 ${
          hidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white heartbeat">
              <i className="fa-solid fa-heart-pulse text-lg" />
            </span>
            <span className="font-display text-xl font-bold text-foreground">LifeGrid</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <a href="/#hospitals" className="hover:text-primary transition-colors">Hospitals</a>
            <a href="/#reviews" className="hover:text-primary transition-colors">Reviews</a>
            <a href="/#contact" className="hover:text-primary transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="h-9 w-9 grid place-items-center rounded-full text-text-secondary hover:bg-bg-secondary transition"
            >
              <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`} />
            </button>
            <button
              onClick={() => setNotifOpen(true)}
              aria-label="Notifications"
              className="relative h-9 w-9 grid place-items-center rounded-full text-text-secondary hover:bg-bg-secondary transition"
            >
              <i className="fa-solid fa-bell" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-emergency text-white text-[10px] font-bold grid place-items-center">
                  {unread}
                </span>
              )}
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menu"
                className="h-9 w-9 grid place-items-center rounded-full text-text-secondary hover:bg-bg-secondary transition"
              >
                <i className="fa-solid fa-ellipsis-vertical" />
              </button>
              {menuOpen && (
                <div
                  onMouseLeave={() => setMenuOpen(false)}
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg p-2 slide-up"
                >
                  <button
                    onClick={() => {
                      toggle();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-bg-secondary text-foreground"
                  >
                    <i className="fa-solid fa-gear w-4" />
                    Settings
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-bg-secondary text-foreground">
                    <i className="fa-solid fa-language w-4" />
                    Language: English
                  </button>
                  {user && (
                    <>
                      <button
                        onClick={() => {
                          setProfileOpen(true);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-bg-secondary text-foreground"
                      >
                        <i className="fa-solid fa-user w-4" />
                        My Profile
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setMenuOpen(false);
                          navigate({ to: "/" });
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-bg-secondary text-danger"
                      >
                        <i className="fa-solid fa-right-from-bracket w-4" />
                        Logout
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {user ? (
              <div className="hidden sm:flex items-center gap-2 pl-2">
                <button
                  onClick={() => setProfileOpen(true)}
                  className="h-9 w-9 rounded-full bg-primary text-white grid place-items-center font-bold text-sm lift-hover"
                  aria-label="User profile"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-[30px] bg-primary text-white font-semibold text-sm lift-hover"
              >
                Login / Signup
              </button>
            )}

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden h-9 w-9 grid place-items-center rounded-full text-text-secondary hover:bg-bg-secondary"
              aria-label="Menu"
            >
              <i className="fa-solid fa-bars" />
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background slide-up">
            <div className="px-4 py-3 flex flex-col gap-1">
              <Link to="/" onClick={() => setMobileOpen(false)} className="py-2 text-foreground">Home</Link>
              <a href="/#hospitals" onClick={() => setMobileOpen(false)} className="py-2 text-foreground">Hospitals</a>
              <a href="/#reviews" onClick={() => setMobileOpen(false)} className="py-2 text-foreground">Reviews</a>
              <a href="/#contact" onClick={() => setMobileOpen(false)} className="py-2 text-foreground">Contact</a>
              <button
                onClick={openEmergency}
                className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[30px] bg-emergency text-white font-semibold text-sm"
              >
                <i className="fa-solid fa-truck-medical" /> Emergency
              </button>
              {!user && (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setLoginOpen(true);
                  }}
                  className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[30px] bg-primary text-white font-semibold text-sm"
                >
                  Login / Signup
                </button>
              )}
            </div>
          </div>
        )}
      </header>
      <div className="h-16" />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <NotificationsModal open={notifOpen} onClose={() => setNotifOpen(false)} />
      <EmergencyModal open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
      <UserProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
