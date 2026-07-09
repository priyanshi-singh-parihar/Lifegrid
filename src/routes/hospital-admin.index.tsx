import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BED_TYPES,
  bedStatus,
  bedStatusLabel,
  formatBedType,
  type BedType,
} from "@/lib/lifegrid-data";
import { useStore, useTheme, type Booking } from "@/lib/lifegrid-store";

export const Route = createFileRoute("/hospital-admin/")({
  head: () => ({
    meta: [
      { title: "Hospital Admin Dashboard â€” LifeGrid" },
      {
        name: "description",
        content: "Manage bed inventory and accept or reject patient booking requests.",
      },
    ],
  }),
  component: HospitalAdminDashboard,
});

type StatusFilter = "all" | "pending" | "confirmed" | "rejected";

function StatusPill({ status }: { status: Booking["status"] }) {
  const map: Record<Booking["status"], string> = {
    pending: "bg-[color:var(--warning-color)]/20 text-[color:var(--accent-foreground)]",
    confirmed: "bg-[color:var(--success-color)]/15 text-[color:var(--success-color)]",
    rejected: "bg-[color:var(--danger-color)]/15 text-[color:var(--danger-color)]",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function HospitalAdminDashboard() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const {
    user,
    logout,
    hospitals,
    bookings,
    updateBookingStatus,
    setHospitalBedCount,
    markBookingsViewed,
  } = useStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [bedFilter, setBedFilter] = useState<BedType | "all">("all");
  const [rejecting, setRejecting] = useState<{ id: string; reason: string } | null>(null);

  const isHospitalAdmin = user?.role === "hospital" && typeof user.hospitalId === "number";
  const hospital = useMemo(
    () => (isHospitalAdmin ? hospitals.find((h) => h.id === user!.hospitalId) : undefined),
    [hospitals, user, isHospitalAdmin],
  );

  // Guard: redirect if not a hospital admin session
  useEffect(() => {
    if (!isHospitalAdmin || !hospital) {
      navigate({ to: "/hospital-admin/login", replace: true });
    }
  }, [isHospitalAdmin, hospital, navigate]);

  // Mark bookings viewed a few seconds after the dashboard opens so the
  // "New" highlight stays visible long enough to notice.
  useEffect(() => {
    if (!hospital) return;
    const t = setTimeout(() => markBookingsViewed(hospital.id), 4000);
    return () => clearTimeout(t);
  }, [hospital, markBookingsViewed]);

  if (!isHospitalAdmin || !hospital) return null;

  const myBookings = bookings.filter((b) => b.hospitalId === hospital.id);
  const pendingCount = myBookings.filter((b) => b.status === "pending").length;
  const confirmedTodayCount = myBookings.filter(
    (b) => b.status === "confirmed" && isToday(b.requestedAt),
  ).length;
  const bedsAvailable = Object.values(hospital.beds).reduce((a, b) => a + b, 0);
  // Beds "occupied" here means confirmed bookings currently held.
  const bedsOccupied = myBookings.filter((b) => b.status === "confirmed").length;

  const filtered = myBookings.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (bedFilter !== "all" && b.bedType !== bedFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (
        !b.patientName.toLowerCase().includes(q) &&
        !b.id.toLowerCase().includes(q) &&
        !b.patientContact.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const onAccept = (b: Booking) => {
    updateBookingStatus(b.id, "confirmed");
    toast.success(`Confirmed booking ${b.id} for ${b.patientName}`);
  };

  const onReject = (b: Booking, reason: string) => {
    updateBookingStatus(b.id, "rejected", reason.trim() || undefined);
    toast.success(
      `Rejected booking ${b.id} â€” bed released back to ${formatBedType(b.bedType)} inventory`,
    );
    setRejecting(null);
  };

  const onBedDelta = (bed: BedType, delta: number) => {
    const current = hospital.beds[bed];
    const next = Math.max(0, current + delta);
    if (next === current) return;
    setHospitalBedCount(hospital.id, bed, next);
    toast.success(`${formatBedType(bed)} beds updated â†’ ${next}`);
  };

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
    navigate({ to: "/hospital-admin/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white heartbeat shrink-0">
              <i className="fa-solid fa-heart-pulse" />
            </span>
            <div className="min-w-0">
              <div className="text-xs text-text-secondary leading-none">Hospital Admin</div>
              <div className="font-display text-base sm:text-lg font-bold truncate">
                {hospital.name}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="h-9 w-9 grid place-items-center rounded-lg border border-border text-text-secondary hover:text-primary"
            >
              <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`} />
            </button>
            <button
              onClick={handleLogout}
              className="h-9 px-3 rounded-lg border border-border text-sm font-semibold hover:text-primary flex items-center gap-2"
            >
              <i className="fa-solid fa-right-from-bracket" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stat cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon="fa-solid fa-clock"
            label="Pending Requests"
            value={pendingCount}
            tone="warning"
          />
          <StatCard
            icon="fa-solid fa-circle-check"
            label="Confirmed Today"
            value={confirmedTodayCount}
            tone="success"
          />
          <StatCard
            icon="fa-solid fa-bed"
            label="Beds Occupied"
            value={bedsOccupied}
            tone="danger"
          />
          <StatCard
            icon="fa-solid fa-hospital"
            label="Beds Available"
            value={bedsAvailable}
            tone="primary"
          />
        </section>

        {/* Bed inventory */}
        <section className="bg-card border border-border rounded-2xl shadow-sm p-6 slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-bold">Bed inventory</h2>
              <p className="text-xs text-text-secondary">
                Adjust counts as beds are freed or filled â€” patients see this instantly.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {BED_TYPES.map((b) => {
              const count = hospital.beds[b.key];
              const s = bedStatus(count);
              const colorText =
                s === "full"
                  ? "text-[color:var(--danger-color)]"
                  : s === "limited"
                    ? "text-[color:var(--warning-color)]"
                    : "text-[color:var(--success-color)]";
              return (
                <div
                  key={b.key}
                  className="p-4 rounded-2xl border-2 border-border bg-card flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <i className={`${b.icon} text-2xl text-primary`} />
                    <span className={`text-xs font-bold ${colorText}`}>
                      {bedStatusLabel(count)}
                    </span>
                  </div>
                  <div className="font-bold text-foreground">{b.label}</div>
                  <div className={`font-display text-3xl font-bold ${colorText}`}>{count}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      onClick={() => onBedDelta(b.key, -1)}
                      disabled={count === 0}
                      className="h-9 w-9 grid place-items-center rounded-lg border border-border text-text-secondary hover:text-primary disabled:opacity-50"
                      aria-label={`Decrease ${b.label} beds`}
                    >
                      <i className="fa-solid fa-minus" />
                    </button>
                    <button
                      onClick={() => onBedDelta(b.key, +1)}
                      className="h-9 w-9 grid place-items-center rounded-lg border border-border text-text-secondary hover:text-primary"
                      aria-label={`Increase ${b.label} beds`}
                    >
                      <i className="fa-solid fa-plus" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Booking requests */}
        <section className="bg-card border border-border rounded-2xl shadow-sm p-6 slide-up">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-lg font-bold">Booking requests</h2>
              <p className="text-xs text-text-secondary">
                Every patient request for a bed at {hospital.name}.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex text-sm font-semibold border border-border rounded-xl p-1 bg-bg-secondary">
              {(["all", "pending", "confirmed", "rejected"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition ${
                    statusFilter === s
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-secondary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[220px]">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient name, contact, or booking ID"
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-background outline-none focus:border-primary text-sm"
              />
            </div>
            <select
              value={bedFilter}
              onChange={(e) => setBedFilter(e.target.value as BedType | "all")}
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm font-semibold"
              aria-label="Filter by bed type"
            >
              <option value="all">All bed types</option>
              {BED_TYPES.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-14 border-2 border-dashed border-border rounded-2xl">
              <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 text-primary grid place-items-center">
                <i className="fa-solid fa-inbox text-2xl" />
              </div>
              <h3 className="mt-3 font-display font-bold text-lg">No booking requests</h3>
              <p className="text-sm text-text-secondary mt-1">
                {myBookings.length === 0
                  ? "When a patient requests a bed at your hospital, it'll appear here."
                  : "Try clearing the filters or search to see other requests."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm border-separate border-spacing-y-2 min-w-[820px]">
                <thead className="text-xs uppercase text-text-secondary">
                  <tr>
                    <th className="text-left px-3">Patient</th>
                    <th className="text-left px-3">Bed</th>
                    <th className="text-left px-3">Requested</th>
                    <th className="text-left px-3">Amount</th>
                    <th className="text-left px-3">Payment</th>
                    <th className="text-left px-3">Status</th>
                    <th className="text-right px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => {
                    const isNew = !b.viewedByHospital && b.status === "pending";
                    return (
                      <tr
                        key={b.id}
                        className={`bg-bg-secondary/60 ${
                          isNew ? "ring-2 ring-primary/60" : ""
                        }`}
                      >
                        <td className="px-3 py-3 rounded-l-xl">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-semibold text-foreground flex items-center gap-2">
                                {b.patientName}
                                {isNew && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-text-secondary">
                                {b.patientContact}
                              </div>
                              <div className="text-[10px] text-text-light font-mono mt-0.5">
                                {b.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-semibold">{formatBedType(b.bedType)}</span>
                        </td>
                        <td className="px-3 py-3 text-text-secondary">
                          {new Date(b.requestedAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-3 font-bold">
                          {b.hospitalType === "government" || b.amount === 0
                            ? "Free"
                            : `â‚¹${b.amount}`}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-semibold ${
                              b.paymentStatus === "paid"
                                ? "bg-[color:var(--success-color)]/15 text-[color:var(--success-color)]"
                                : "bg-bg-tertiary text-text-secondary"
                            }`}
                          >
                            {b.paymentStatus === "paid" ? "Paid" : "Not required"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1">
                            <StatusPill status={b.status} />
                            {b.status === "rejected" && b.rejectionReason && (
                              <span className="text-[10px] text-text-secondary italic">
                                {b.rejectionReason}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 rounded-r-xl">
                          {b.status === "pending" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => onAccept(b)}
                                className="px-3 h-9 rounded-lg bg-[color:var(--success-color)] text-white text-xs font-bold hover:opacity-90"
                              >
                                <i className="fa-solid fa-check mr-1" /> Accept
                              </button>
                              <button
                                onClick={() => setRejecting({ id: b.id, reason: "" })}
                                className="px-3 h-9 rounded-lg bg-[color:var(--danger-color)] text-white text-xs font-bold hover:opacity-90"
                              >
                                <i className="fa-solid fa-xmark mr-1" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-text-light">â€”</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="text-xs text-text-secondary text-center">
          Viewing data for <strong>{hospital.name}</strong> only â€” no other hospital's bookings
          or inventory are visible.{" "}
          <Link to="/" className="text-primary font-semibold">
            View patient site
          </Link>
        </div>
      </main>

      {/* Reject modal */}
      {rejecting &&
        (() => {
          const b = myBookings.find((x) => x.id === rejecting.id);
          if (!b) return null;
          return (
            <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 fade-in">
              <div className="bg-card w-full max-w-md rounded-2xl p-6 shadow-lg slide-up">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-[color:var(--danger-color)]/15 text-[color:var(--danger-color)] grid place-items-center">
                    <i className="fa-solid fa-triangle-exclamation text-lg" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">Reject booking</h3>
                    <p className="text-xs text-text-secondary">
                      {b.patientName} Â· {formatBedType(b.bedType)}
                    </p>
                  </div>
                </div>
                <label className="block text-sm mt-4">
                  <span className="text-text-secondary">Reason (optional)</span>
                  <textarea
                    value={rejecting.reason}
                    onChange={(e) =>
                      setRejecting({ id: rejecting.id, reason: e.target.value })
                    }
                    rows={3}
                    placeholder="e.g. Bed no longer available on requested date"
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary"
                  />
                </label>
                <p className="text-xs text-text-secondary mt-2">
                  The held bed will be released back into {formatBedType(b.bedType)} inventory.
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => setRejecting(null)}
                    className="flex-1 h-10 rounded-lg border border-border font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onReject(b, rejecting.reason)}
                    className="flex-1 h-10 rounded-lg bg-[color:var(--danger-color)] text-white font-semibold"
                  >
                    Reject booking
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: number;
  tone: "warning" | "success" | "danger" | "primary";
}) {
  const bg = {
    warning: "bg-[color:var(--warning-color)]/15 text-[color:var(--accent-foreground)]",
    success: "bg-[color:var(--success-color)]/15 text-[color:var(--success-color)]",
    danger: "bg-[color:var(--danger-color)]/15 text-[color:var(--danger-color)]",
    primary: "bg-primary/10 text-primary",
  }[tone];
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm lift-hover flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl grid place-items-center ${bg}`}>
        <i className={`${icon} text-xl`} />
      </div>
      <div>
        <div className="text-xs text-text-secondary font-semibold uppercase tracking-wide">
          {label}
        </div>
        <div className="font-display text-3xl font-bold">{value}</div>
      </div>
    </div>
  );
}

