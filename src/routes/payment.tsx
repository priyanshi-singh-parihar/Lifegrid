import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/lifegrid/Navbar";
import { Footer } from "@/components/lifegrid/Footer";
import { formatBedType } from "@/lib/lifegrid-data";
import { useStore } from "@/lib/lifegrid-store";

export const Route = createFileRoute("/payment")({
  head: () => ({
    meta: [
      { title: "Secure payment — LifeGrid" },
      { name: "description", content: "Complete your private hospital bed booking securely." },
    ],
  }),
  component: PaymentPage,
});

type Method = "upi" | "card" | "netbanking";

function PaymentPage() {
  const { user, pendingBooking, setPendingBooking, setConfirmation, updateHospitalBeds, addBooking } = useStore();
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>("upi");
  const [upi, setUpi] = useState("");
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [holder, setHolder] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error("Please login to continue payment");
      navigate({ to: "/login", search: { redirect: "/payment" } });
      return;
    }
    if (!pendingBooking) {
      toast.error("No pending booking — pick a hospital first");
      navigate({ to: "/" });
    }
  }, [user, pendingBooking, navigate]);

  if (!pendingBooking) return null;

  const validate = (): boolean => {
    if (method === "upi") {
      if (!upi.trim()) return toast.error("Enter UPI ID or mobile"), false;
    } else if (method === "card") {
      if (card.replace(/\s/g, "").length < 12) return toast.error("Invalid card number"), false;
      if (!/^\d{2}\/\d{2}$/.test(exp)) return toast.error("Invalid expiry"), false;
      if (!/^\d{3,4}$/.test(cvv)) return toast.error("Invalid CVV"), false;
      if (!holder.trim()) return toast.error("Enter cardholder name"), false;
    }
    return true;
  };

  const pay = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => setCheckoutOpen(true), 500);
  };

  const onCheckoutSuccess = () => {
    setCheckoutOpen(false);
    if (!user) return;
    // Hold the bed and record a pending booking; the hospital must accept.
    updateHospitalBeds(pendingBooking.hospitalId, pendingBooking.bedType, -1);
    const booking = addBooking({
      hospitalId: pendingBooking.hospitalId,
      hospitalName: pendingBooking.hospitalName,
      hospitalType: pendingBooking.hospitalType,
      bedType: pendingBooking.bedType,
      patientId: user.id,
      patientName: user.name,
      patientContact: user.email,
      amount: pendingBooking.amount,
      paymentStatus: "paid",
    });
    const conf = {
      bookingId: booking.id,
      hospitalName: pendingBooking.hospitalName,
      hospitalType: pendingBooking.hospitalType,
      bedType: pendingBooking.bedType,
      amountPaid: pendingBooking.amount,
      paymentId: "pay_" + Math.random().toString(36).slice(2, 12),
      status: "confirmed" as const,
      timestamp: booking.requestedAt,
    };
    setConfirmation(conf);
    setPendingBooking(null);
    toast.success("Payment successful — booking confirmed instantly");
    navigate({ to: "/confirmation" });
  };

  const onCheckoutCancel = () => {
    setCheckoutOpen(false);
    setLoading(false);
    toast.error("Payment cancelled");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <Link
          to="/hospital/$id"
          params={{ id: String(pendingBooking.hospitalId) }}
          className="text-primary text-sm font-semibold mb-4 inline-flex items-center gap-2"
        >
          <i className="fa-solid fa-arrow-left" /> Back to hospital
        </Link>

        <div className="grid md:grid-cols-[1fr_360px] gap-6 mt-2">
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 slide-up">
            <h1 className="font-display text-2xl font-bold mb-1">Payment method</h1>
            <p className="text-sm text-text-secondary mb-5">Choose how you'd like to pay for your bed.</p>

            <div className="grid gap-3 sm:grid-cols-3 mb-6">
              {(
                [
                  { k: "upi", label: "UPI", icon: "fa-solid fa-mobile-screen", desc: "Google Pay, PhonePe" },
                  { k: "card", label: "Card", icon: "fa-solid fa-credit-card", desc: "Visa, Mastercard, Rupay" },
                  { k: "netbanking", label: "Net Banking", icon: "fa-solid fa-building-columns", desc: "All Indian banks" },
                ] as { k: Method; label: string; icon: string; desc: string }[]
              ).map((o) => (
                <button
                  key={o.k}
                  onClick={() => setMethod(o.k)}
                  className={`p-4 text-left rounded-xl border-2 transition ${
                    method === o.k ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <i className={`${o.icon} text-primary text-xl`} />
                  <div className="font-bold mt-2">{o.label}</div>
                  <div className="text-xs text-text-secondary">{o.desc}</div>
                </button>
              ))}
            </div>

            {method === "upi" && (
              <label className="block text-sm">
                <span className="text-text-secondary">UPI ID or mobile number</span>
                <input
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                  placeholder="you@upi"
                  className="mt-1 w-full h-11 px-3 rounded-lg border border-border bg-background"
                />
              </label>
            )}
            {method === "card" && (
              <div className="space-y-3">
                <label className="block text-sm">
                  <span className="text-text-secondary">Card number</span>
                  <input
                    value={card}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                      setCard(v.replace(/(.{4})/g, "$1 ").trim());
                    }}
                    placeholder="1234 5678 9012 3456"
                    className="mt-1 w-full h-11 px-3 rounded-lg border border-border bg-background tracking-widest"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm">
                    <span className="text-text-secondary">Expiry (MM/YY)</span>
                    <input
                      value={exp}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setExp(v.length >= 3 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                      }}
                      placeholder="12/28"
                      className="mt-1 w-full h-11 px-3 rounded-lg border border-border bg-background"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-text-secondary">CVV</span>
                    <input
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      className="mt-1 w-full h-11 px-3 rounded-lg border border-border bg-background"
                    />
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="text-text-secondary">Cardholder name</span>
                  <input
                    value={holder}
                    onChange={(e) => setHolder(e.target.value)}
                    placeholder="Name on card"
                    className="mt-1 w-full h-11 px-3 rounded-lg border border-border bg-background"
                  />
                </label>
              </div>
            )}
            {method === "netbanking" && (
              <p className="text-sm text-text-secondary">You'll be redirected to your bank's login page.</p>
            )}

            <div className="mt-6 flex items-center gap-2 text-xs text-text-secondary">
              <i className="fa-solid fa-lock text-success" />
              Secured by Razorpay · 256-bit SSL Encryption
            </div>

            <button
              onClick={pay}
              disabled={loading}
              className="mt-4 w-full h-12 rounded-[30px] bg-primary text-white font-bold lift-hover disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-lock" />}
              {loading ? "Processing…" : `Pay ₹${pendingBooking.amount}`}
            </button>
          </div>

          <aside className="bg-card border border-border rounded-2xl shadow-sm p-6 h-fit slide-up">
            <h2 className="font-display text-lg font-bold mb-3">Order summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-text-secondary">Hospital</dt><dd className="font-semibold text-right">{pendingBooking.hospitalName}</dd></div>
              <div className="flex justify-between"><dt className="text-text-secondary">Bed type</dt><dd className="font-semibold">{formatBedType(pendingBooking.bedType)}</dd></div>
              <div className="flex justify-between"><dt className="text-text-secondary">Duration</dt><dd className="font-semibold">1 Day</dd></div>
              <div className="border-t border-border my-2" />
              <div className="flex justify-between text-lg"><dt className="font-bold">Total</dt><dd className="font-bold text-primary">₹{pendingBooking.amount}</dd></div>
            </dl>
          </aside>
        </div>
      </div>
      <Footer />

      {checkoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 fade-in">
          <div className="bg-card w-full max-w-sm rounded-2xl p-6 shadow-lg slide-up text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 text-primary grid place-items-center">
              <i className="fa-solid fa-shield-halved text-2xl" />
            </div>
            <h3 className="font-display text-lg font-bold mt-3">Razorpay Secure Checkout</h3>
            <p className="text-sm text-text-secondary mt-1">
              Confirm your payment of <strong>₹{pendingBooking.amount}</strong> via {method.toUpperCase()}.
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={onCheckoutCancel} className="flex-1 h-10 rounded-lg border border-border font-semibold">
                Cancel
              </button>
              <button onClick={onCheckoutSuccess} className="flex-1 h-10 rounded-lg bg-primary text-white font-semibold">
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
