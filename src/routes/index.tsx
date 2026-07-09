import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/lifegrid/Navbar";
import { Footer } from "@/components/lifegrid/Footer";
import { HospitalCard } from "@/components/lifegrid/HospitalCard";
import { useStore } from "@/lib/lifegrid-store";
import { BED_TYPES, CITIES, type BedType } from "@/lib/lifegrid-data";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const sendContactEmail = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string(),
      email: z.string().email(),
      message: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const { name, email, message } = data;
    console.log("Server received contact form message:", { name, email, message });

    const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

    if (!apiKey) {
      console.warn("RESEND_API_KEY is not defined. Email simulated successfully on local server console.");
      return { success: true, simulated: true };
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "LifeGrid Contact <onboarding@resend.dev>",
          to: "lifegrid.support@gmail.com",
          subject: `LifeGrid Contact: Message from ${name}`,
          html: `
            <h3>New Message from LifeGrid Contact Form</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="border-left: 3px solid #00b894; padding-left: 10px; margin-left: 0; color: #555;">
              ${message.replace(/\n/g, "<br/>")}
            </blockquote>
          `,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Resend API returned error:", errText);
        throw new Error(`Resend error: ${errText}`);
      }

      const responseData = await res.json();
      console.log("Resend email sent successfully:", responseData);
      return { success: true, id: responseData.id };
    } catch (err: any) {
      console.error("Failed to send email via Resend:", err);
      throw new Error(err.message || "Failed to send email");
    }
  });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LifeGrid — Find hospital beds in real time" },
      {
        name: "description",
        content:
          "Search Indian hospitals with live ICU, oxygen, ventilator, and general bed counts. Government bookings are free; private beds are secured with Razorpay.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { hospitals } = useStore();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [city, setCity] = useState<string>("");
  const [bedFilter, setBedFilter] = useState<BedType | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "government" | "private">("all");
  const [sortBy, setSortBy] = useState<"distance" | "rating">("distance");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const suggestions = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return hospitals
      .filter((h) => h.name.toLowerCase().includes(q) || h.location.toLowerCase().includes(q))
      .slice(0, 5);
  }, [search, hospitals]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = hospitals.filter((h) => {
      const matchQ = !q || h.name.toLowerCase().includes(q) || h.location.toLowerCase().includes(q);
      const matchCity = !city || h.location === city;
      const matchType = typeFilter === "all" || h.type === typeFilter;
      const matchBed = bedFilter === "all" || h.beds[bedFilter] > 0;
      return matchQ && matchCity && matchType && matchBed;
    });
    list = [...list].sort((a, b) =>
      sortBy === "rating"
        ? b.rating - a.rating
        : parseFloat(a.distance) - parseFloat(b.distance),
    );
    return list;
  }, [hospitals, search, city, bedFilter, typeFilter, sortBy]);

  const totalEmergency = hospitals.reduce((s, h) => s + h.beds.emergency, 0);
  const totalICU = hospitals.reduce((s, h) => s + h.beds.icu, 0);
  const totalOxy = hospitals.reduce((s, h) => s + h.beds.oxygen, 0);
  const totalVent = hospitals.reduce((s, h) => s + h.beds.ventilator, 0);

  const useLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      () => {
        setCity("Mumbai");
        toast.success("Showing hospitals near you");
      },
      () => toast.error("Could not get your location"),
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {loading && (
        <div className="fixed inset-0 z-[100] bg-background grid place-items-center fade-in">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary text-white grid place-items-center pulse-icon">
              <i className="fa-solid fa-heart-pulse text-3xl" />
            </div>
            <div className="mt-4 font-display text-2xl font-bold text-foreground">LifeGrid</div>
            <div className="text-sm text-text-secondary mt-1">Loading real-time bed data…</div>
          </div>
        </div>
      )}

      <Navbar />

      {/* Hero */}
      <section className="bg-hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-2 items-center">
          <div className="slide-up">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" /> Live updates
            </span>
            <h1 className="mt-4 font-display text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Find a hospital bed the moment you need it.
            </h1>
            <p className="mt-4 text-text-secondary text-base md:text-lg">
              Real-time ICU, oxygen, ventilator and emergency bed availability across India — book
              instantly, at government hospitals for free.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#hospitals"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[30px] bg-primary text-white font-semibold lift-hover"
              >
                <i className="fa-solid fa-magnifying-glass" /> Find Hospitals
              </a>
              <a
                href="tel:108"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[30px] bg-emergency text-white font-semibold lift-hover"
              >
                <i className="fa-solid fa-truck-medical" /> Emergency Help
              </a>
            </div>
            <dl className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              {[
                { k: hospitals.length, v: "Hospitals" },
                { k: hospitals.reduce((s, h) => s + Object.values(h.beds).reduce((a, b) => a + b, 0), 0), v: "Beds live" },
                { k: CITIES.length, v: "Cities" },
              ].map((s) => (
                <div key={s.v} className="bg-card border border-border rounded-xl p-3 text-center">
                  <div className="font-display text-2xl font-bold text-primary">{s.k}</div>
                  <div className="text-[11px] uppercase tracking-wide text-text-secondary">{s.v}</div>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative slide-up">
            <img
              src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=900&q=80"
              alt="Doctors in hospital"
              className="w-full h-80 md:h-96 object-cover rounded-3xl shadow-lg"
            />
            <div className="absolute -bottom-5 -left-5 bg-card border border-border rounded-2xl shadow-md p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/15 text-success grid place-items-center">
                <i className="fa-solid fa-circle-check" />
              </div>
              <div>
                <div className="text-xs text-text-secondary">Live bed updates</div>
                <div className="text-sm font-bold text-foreground">Refreshed every 5s</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location selector */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3">
          <button
            onClick={useLocation}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary font-semibold text-sm"
          >
            <i className="fa-solid fa-location-crosshairs" /> Use my location
          </button>
          <div className="flex-1 flex items-center gap-2">
            <label className="text-sm text-text-secondary hidden md:block">City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm"
            >
              <option value="">All cities</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Andheri", "Bandra", "Powai", "Whitefield"].map((n) => (
              <button
                key={n}
                onClick={() => setSearch(n)}
                className="px-3 py-1 rounded-full text-xs border border-border text-text-secondary hover:border-primary hover:text-primary"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency band */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <div className="bg-emergency-gradient rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-emergency text-white grid place-items-center pulse-icon">
              <i className="fa-solid fa-truck-medical" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">Live emergency capacity</h3>
              <p className="text-xs text-text-secondary">Aggregated across all partner hospitals — updates every 5 seconds.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "fa-solid fa-truck-medical", label: "Emergency beds", val: totalEmergency },
              { icon: "fa-solid fa-procedures", label: "ICU beds", val: totalICU },
              { icon: "fa-solid fa-lungs", label: "Oxygen beds", val: totalOxy },
              { icon: "fa-solid fa-wind", label: "Ventilators", val: totalVent },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center slide-up">
                <i className={`${s.icon} text-emergency text-xl`} />
                <div className="font-display text-2xl font-bold mt-1">{s.val}</div>
                <div className="text-[11px] uppercase tracking-wide text-text-secondary">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search + filters + directory */}
      <section id="hospitals" className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground">Hospitals near you</h2>
            <p className="text-sm text-text-secondary">{filtered.length} results</p>
          </div>
          <div className="relative w-full md:w-96">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSuggestOpen(true);
              }}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
              placeholder="Search hospital or area…"
              className="w-full h-11 pl-11 pr-4 rounded-[30px] border border-border bg-card shadow-sm outline-none focus:border-primary"
            />
            {suggestOpen && suggestions.length > 0 && (
              <ul className="absolute z-20 mt-2 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden slide-up">
                {suggestions.map((s) => (
                  <li
                    key={s.id}
                    onMouseDown={() => setSearch(s.name)}
                    className="px-4 py-2 text-sm hover:bg-bg-secondary cursor-pointer flex items-center gap-2"
                  >
                    <i className="fa-solid fa-hospital text-primary" />
                    <span>
                      <span dangerouslySetInnerHTML={{ __html: highlight(s.name, search) }} />
                      <span className="text-text-secondary"> · {s.location}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs uppercase font-bold text-text-secondary self-center mr-1">Bed:</span>
          {(["all", ...BED_TYPES.map((b) => b.key)] as (BedType | "all")[]).map((k) => (
            <button
              key={k}
              onClick={() => setBedFilter(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                bedFilter === k
                  ? "bg-primary text-white border-primary"
                  : "bg-card text-text-secondary border-border hover:border-primary"
              }`}
            >
              {k === "all" ? "All" : k.toUpperCase()}
            </button>
          ))}
          <span className="text-xs uppercase font-bold text-text-secondary self-center mx-1 md:ml-3">Type:</span>
          {(["all", "government", "private"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTypeFilter(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition capitalize ${
                typeFilter === k
                  ? "bg-primary text-white border-primary"
                  : "bg-card text-text-secondary border-border hover:border-primary"
              }`}
            >
              {k}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-text-secondary">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "distance" | "rating")}
              className="h-9 px-2 rounded-lg border border-border bg-card text-sm"
            >
              <option value="distance">Distance</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((h) => (
            <HospitalCard key={h.id} h={h} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-text-secondary">
              No hospitals match your filters.
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
        <h2 className="font-display text-3xl font-bold text-foreground mb-6">What patients say</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              name: "Priya Sharma",
              quote:
                "Found an ICU bed in under 2 minutes when my father needed it. LifeGrid saved his life.",
              rating: 5,
            },
            {
              name: "Rohit Verma",
              quote: "The government-hospital booking was instant and completely free. Incredible.",
              rating: 5,
            },
            {
              name: "Anita Rao",
              quote: "Live bed counts finally exist. No more calling 10 hospitals in an emergency.",
              rating: 4,
            },
          ].map((t) => (
            <article key={t.name} className="bg-card border border-border rounded-2xl p-6 shadow-sm lift-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary text-white grid place-items-center font-bold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{t.name}</div>
                  <div className="text-xs text-[color:var(--accent-color)]">
                    {"★".repeat(t.rating)}
                    <span className="text-text-light">{"★".repeat(5 - t.rating)}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-text-secondary">"{t.quote}"</p>
            </article>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
        <div className="grid md:grid-cols-2 gap-8 bg-card border border-border rounded-2xl p-6 md:p-10 shadow-sm">
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground">Get in touch</h2>
            <p className="text-sm text-text-secondary mt-2">
              Partner with LifeGrid or ask a question — we reply within one business day.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-text-secondary">
              <li className="flex items-center gap-3"><i className="fa-solid fa-envelope text-primary w-5" /> lifegrid.support@gmail.com</li>
              <li className="flex items-center gap-3"><i className="fa-solid fa-phone text-primary w-5" /> +91 80 1234 5678</li>
              <li className="flex items-center gap-3"><i className="fa-solid fa-location-dot text-primary w-5" /> Gwalior, India</li>
            </ul>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSending(true);
              const formData = new FormData(e.currentTarget);
              const name = formData.get("name") as string;
              const email = formData.get("email") as string;
              const message = formData.get("message") as string;

              try {
                await sendContactEmail({ name, email, message });
                toast.success("Message sent successfully! We will get back to you soon.");
                (e.target as HTMLFormElement).reset();
              } catch (err: any) {
                console.error(err);
                toast.error(err.message || "Failed to send message. Please try again.");
              } finally {
                setSending(false);
              }
            }}
            className="space-y-3"
          >
            <input required name="name" placeholder="Your name" className="w-full h-11 px-3 rounded-lg border border-border bg-background" />
            <input required type="email" name="email" placeholder="Email" className="w-full h-11 px-3 rounded-lg border border-border bg-background" />
            <textarea required name="message" placeholder="Message" rows={4} className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
            <button
              type="submit"
              disabled={sending}
              className="w-full h-11 rounded-[30px] bg-primary text-white font-semibold lift-hover disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {sending ? (
                <><i className="fa-solid fa-spinner fa-spin" /> Sending…</>
              ) : (
                "Send message"
              )}
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function highlight(text: string, q: string): string {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return `${escapeHtml(text.slice(0, i))}<mark class="bg-primary/25 text-foreground rounded px-0.5">${escapeHtml(text.slice(i, i + q.length))}</mark>${escapeHtml(text.slice(i + q.length))}`;
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
