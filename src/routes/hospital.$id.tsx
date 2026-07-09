import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/lifegrid/Navbar";
import { Footer } from "@/components/lifegrid/Footer";
import {
  BED_TYPES,
  PRICING,
  bedStatus,
  bedStatusLabel,
  formatBedType,
  validateHospital,
  type BedType,
} from "@/lib/lifegrid-data";
import { useStore } from "@/lib/lifegrid-store";

export const Route = createFileRoute("/hospital/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Hospital details — LifeGrid` },
      { name: "description", content: `Live bed availability and booking for hospital #${params.id}.` },
    ],
  }),
  component: HospitalDetails,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">Hospital not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary font-semibold">← Back to search</Link>
      </div>
    </div>
  ),
});

function HospitalDetails() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { hospitals, user, setPendingBooking, setConfirmation, updateHospitalBeds, addBooking } = useStore();
  const h = hospitals.find((x) => x.id === Number(id));
  const [selected, setSelected] = useState<BedType | null>(null);
  const [requesting, setRequesting] = useState(false);

  if (!h) throw notFound();

  const missingFields = validateHospital(h);
  if (missingFields.length > 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <div className="bg-card border border-border rounded-2xl shadow-sm p-8 text-center slide-up">
            <div className="mx-auto h-14 w-14 rounded-full bg-[color:var(--danger-color)]/15 text-[color:var(--danger-color)] grid place-items-center">
              <i className="fa-solid fa-triangle-exclamation text-2xl" />
            </div>
            <h1 className="font-display text-2xl font-bold mt-4">
              Incomplete hospital record
            </h1>
            <p className="text-sm text-text-secondary mt-2">
              We can't safely show <strong>{h.name || `hospital #${h.id}`}</strong> yet — the
              following required details are missing or invalid:
            </p>
            <ul className="mt-4 inline-flex flex-wrap gap-2 justify-center">
              {missingFields.map((f) => (
                <li
                  key={f}
                  className="px-3 py-1 rounded-full bg-[color:var(--danger-color)]/10 text-[color:var(--danger-color)] text-xs font-semibold"
                >
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-semibold lift-hover"
              >
                <i className="fa-solid fa-arrow-left" /> Back to hospitals
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }


  const totalRemaining = Object.values(h.beds).reduce((a, b) => a + b, 0);
  const overallStatus = bedStatus(totalRemaining);
  const overallBadge =
    overallStatus === "full"
      ? "bg-[color:var(--danger-color)]/15 text-[color:var(--danger-color)]"
      : overallStatus === "limited"
        ? "bg-[color:var(--warning-color)]/20 text-[color:var(--accent-foreground)]"
        : "bg-[color:var(--success-color)]/15 text-[color:var(--success-color)]";

  const requestBed = () => {
    if (!selected) return;
    if (!user) {
      toast.error("Please login to request a bed");
      navigate({ to: "/login", search: { redirect: `/hospital/${h.id}` } });
      return;
    }
    if (user.role === "hospital") {
      toast.error("Switch to a patient account to request a bed");
      return;
    }
    if (h.beds[selected] <= 0) {
      toast.error("That bed type is no longer available");
      return;
    }
    setRequesting(true);
    const price = PRICING[selected][h.type];
    setPendingBooking({
      hospitalId: h.id,
      hospitalName: h.name,
      hospitalType: h.type,
      bedType: selected,
      amount: price,
    });

    if (h.type === "government") {
      setTimeout(() => {
        // Hold the bed immediately; hospital admin will accept/reject.
        updateHospitalBeds(h.id, selected, -1);
        const booking = addBooking({
          hospitalId: h.id,
          hospitalName: h.name,
          hospitalType: h.type,
          bedType: selected,
          patientId: user.id,
          patientName: user.name,
          patientContact: user.email,
          amount: 0,
          paymentStatus: "not-required",
        });
        setConfirmation({
          bookingId: booking.id,
          hospitalName: h.name,
          hospitalType: h.type,
          bedType: selected,
          amountPaid: 0,
          paymentId: null,
          status: "confirmed",
          timestamp: booking.requestedAt,
        });
        setPendingBooking(null);
        toast.success("Booking confirmed instantly!");
        setRequesting(false);
        navigate({ to: "/confirmation" });
      }, 500);
    } else {
      setTimeout(() => {
        setRequesting(false);
        navigate({ to: "/payment" });
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-primary font-semibold text-sm mb-4">
          <i className="fa-solid fa-arrow-left" /> Back to Hospitals
        </Link>

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden slide-up">
          <div className="grid md:grid-cols-[320px_1fr] gap-6 p-6 bg-hero-gradient border-b border-border">
            <div className="h-56 md:h-64 rounded-xl overflow-hidden shadow-sm">
              <img src={h.image} alt={h.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">{h.name}</h1>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-text-secondary">
                <span className="flex items-center gap-1"><i className="fa-solid fa-location-dot" /> {h.address}</span>
                <span className="flex items-center gap-1"><i className="fa-solid fa-route" /> {h.distance}</span>
                <span className="flex items-center gap-1"><i className="fa-solid fa-phone" /> {h.phone}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    h.type === "government"
                      ? "bg-[color:var(--success-color)]/15 text-[color:var(--success-color)]"
                      : "bg-[color:var(--danger-color)]/15 text-[color:var(--danger-color)]"
                  }`}
                >
                  {h.type === "government" ? "🏛️ Government Hospital" : "🏥 Private Hospital"}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${overallBadge}`}>
                  {bedStatusLabel(totalRemaining)} · {totalRemaining} beds total
                </span>
                <span className="px-3 py-1 rounded-full bg-card border border-border text-xs font-bold flex items-center gap-1">
                  <i className="fa-solid fa-star text-[color:var(--accent-color)]" /> {h.rating.toFixed(1)}
                </span>
              </div>
              <p className="mt-4 text-sm text-text-secondary max-w-2xl">{h.description}</p>
            </div>
          </div>

          <div className="p-6">
            <h2 className="font-display text-xl font-bold mb-4">Bed availability</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {BED_TYPES.map((b) => {
                const count = h.beds[b.key];
                const status = bedStatus(count);
                const price = PRICING[b.key][h.type];
                const isSelected = selected === b.key;
                const disabled = count === 0;
                const colorText =
                  status === "full"
                    ? "text-[color:var(--danger-color)]"
                    : status === "limited"
                      ? "text-[color:var(--warning-color)]"
                      : "text-[color:var(--success-color)]";
                return (
                  <button
                    key={b.key}
                    disabled={disabled}
                    onClick={() => setSelected(b.key)}
                    className={`text-left p-4 rounded-2xl border-2 bg-card transition ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/60"
                    } ${disabled ? "opacity-60 cursor-not-allowed" : "lift-hover"}`}
                  >
                    <div className="flex items-center justify-between">
                      <i className={`${b.icon} text-2xl text-primary`} />
                      {isSelected && <i className="fa-solid fa-circle-check text-primary" />}
                    </div>
                    <div className="mt-3 font-bold text-foreground">{b.label}</div>
                    <div className={`font-display text-3xl font-bold ${colorText}`}>{count}</div>
                    <div className={`text-xs font-semibold ${colorText}`}>{bedStatusLabel(count)}</div>
                    {h.type === "private" && (
                      <div className="text-sm font-bold text-primary mt-2">₹{price}/day</div>
                    )}
                    {h.type === "government" && (
                      <div className="text-sm font-bold text-success mt-2">Free</div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`tel:${h.phone}`}
                className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-border bg-card font-semibold lift-hover"
              >
                <i className="fa-solid fa-phone text-primary" /> Call Hospital
              </a>
              <button
                onClick={requestBed}
                disabled={!selected || requesting}
                className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-semibold lift-hover disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {requesting ? (
                  <><i className="fa-solid fa-spinner fa-spin" /> Requesting…</>
                ) : (
                  <><i className="fa-solid fa-bed" /> Request Bed</>
                )}
              </button>
              <a
                href={`https://wa.me/${h.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I'd like to inquire about bed availability at ${h.name}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white lift-hover"
                style={{ backgroundColor: "#25d366" }}
              >
                <i className="fa-brands fa-whatsapp" /> WhatsApp
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${h.name}, ${h.address}`)}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-border bg-card font-semibold lift-hover"
              >
                <i className="fa-solid fa-diamond-turn-right text-primary" /> Get Directions
              </a>
            </div>

            {selected && (
              <p className="mt-3 text-sm text-text-secondary">
                Selected: <strong className="text-foreground">{formatBedType(selected)}</strong>{" "}
                {h.type === "private" ? `— ₹${PRICING[selected][h.type]} / day` : "— Free"}
              </p>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 mt-6">
          <h3 className="font-display text-lg font-bold mb-4">Available services</h3>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {h.services.map((s) => (
              <div key={s} className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary">
                <i className="fa-solid fa-circle-check text-primary" />
                <span className="text-sm">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
