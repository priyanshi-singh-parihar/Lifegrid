import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Navbar } from "@/components/lifegrid/Navbar";
import { Footer } from "@/components/lifegrid/Footer";
import { formatBedType } from "@/lib/lifegrid-data";
import { useStore } from "@/lib/lifegrid-store";

export const Route = createFileRoute("/confirmation")({
  head: () => ({
    meta: [
      { title: "Booking status — LifeGrid" },
      { name: "description", content: "Track the status of your hospital bed booking." },
    ],
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { confirmation, bookings } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!confirmation) navigate({ to: "/" });
  }, [confirmation, navigate]);

  if (!confirmation) return null;
  const isGov = confirmation.hospitalType === "government";
  // Live status: prefer the current bookings entry if present.
  const live = bookings.find((b) => b.id === confirmation.bookingId);
  const status = live?.status ?? confirmation.status;
  const rejectionReason = live?.rejectionReason;

  const styles = {
    pending: {
      wrap: "bg-[color:var(--warning-color)]/15 text-[color:var(--accent-foreground)]",
      icon: "fa-solid fa-clock",
      title: "Request received",
      subtitle: "Waiting for the hospital to confirm your bed.",
      pill: "bg-[color:var(--warning-color)]/20 text-[color:var(--accent-foreground)]",
      pillLabel: "Pending",
    },
    confirmed: {
      wrap: "bg-success/15 text-success",
      icon: "fa-solid fa-circle-check",
      title: "Booking Confirmed!",
      subtitle: "Show this receipt at the hospital reception on arrival.",
      pill: "bg-success/15 text-success",
      pillLabel: "Confirmed",
    },
    rejected: {
      wrap: "bg-[color:var(--danger-color)]/15 text-[color:var(--danger-color)]",
      icon: "fa-solid fa-circle-xmark",
      title: "Booking Rejected",
      subtitle:
        "The hospital couldn't fulfil this request. The bed has been released back to inventory.",
      pill: "bg-[color:var(--danger-color)]/15 text-[color:var(--danger-color)]",
      pillLabel: "Rejected",
    },
  } as const;

  const s = styles[status];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 print:py-0">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8 text-center slide-up print:shadow-none print:border-none">
          <div className={`mx-auto h-16 w-16 rounded-full grid place-items-center ${s.wrap}`}>
            <i className={`${s.icon} text-3xl`} />
          </div>
          <h1 className="font-display text-3xl font-bold mt-4">{s.title}</h1>
          <p className="text-sm text-text-secondary mt-2">{s.subtitle}</p>

          <dl className="mt-6 divide-y divide-border text-left">
            <div className="py-3 flex justify-between"><dt className="text-text-secondary">Booking ID</dt><dd className="font-bold">{confirmation.bookingId}</dd></div>
            <div className="py-3 flex justify-between"><dt className="text-text-secondary">Hospital</dt><dd className="font-semibold text-right">{confirmation.hospitalName}</dd></div>
            <div className="py-3 flex justify-between"><dt className="text-text-secondary">Bed type</dt><dd className="font-semibold">{formatBedType(confirmation.bedType)}</dd></div>
            <div className="py-3 flex justify-between">
              <dt className="text-text-secondary">Amount paid</dt>
              <dd className="font-bold text-primary">
                {isGov ? "Free (Government)" : `₹${confirmation.amountPaid}`}
              </dd>
            </div>
            <div className={`py-3 flex justify-between -mx-4 px-4 rounded-lg ${s.pill}`}>
              <dt className="font-bold">Status</dt>
              <dd className="font-bold">{s.pillLabel}</dd>
            </div>
            {status === "rejected" && rejectionReason && (
              <div className="py-3">
                <dt className="text-text-secondary">Reason</dt>
                <dd className="italic mt-1">{rejectionReason}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 print:hidden">
            {status === "confirmed" && (
              <button
                onClick={() => window.print()}
                className="flex-1 h-11 rounded-[30px] border-2 border-border font-semibold lift-hover"
              >
                <i className="fa-solid fa-print mr-2" /> Print Receipt
              </button>
            )}
            <Link
              to="/"
              className="flex-1 h-11 rounded-[30px] bg-primary text-white font-semibold lift-hover grid place-items-center"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
