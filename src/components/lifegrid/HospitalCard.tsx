import { Link } from "@tanstack/react-router";
import type { Hospital } from "@/lib/lifegrid-data";
import { BED_TYPES, bedStatus } from "@/lib/lifegrid-data";

export function HospitalCard({ h }: { h: Hospital }) {
  return (
    <article className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm lift-hover flex flex-col">
      <div className="relative h-44 overflow-hidden">
        <img src={h.image} alt={h.name} className="w-full h-full object-cover" />
        <span
          className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold ${
            h.type === "government"
              ? "bg-[color:var(--success-color)]/15 text-[color:var(--success-color)]"
              : "bg-[color:var(--danger-color)]/15 text-[color:var(--danger-color)]"
          }`}
        >
          {h.type === "government" ? "🏛️ Government" : "🏥 Private"}
        </span>
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-background/90 text-xs font-bold text-accent-foreground flex items-center gap-1">
          <i className="fa-solid fa-star text-[color:var(--accent-color)]" /> {h.rating.toFixed(1)}
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground leading-tight">{h.name}</h3>
          <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
            <i className="fa-solid fa-location-dot" /> {h.address} · {h.distance}
          </p>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {BED_TYPES.map((b) => {
            const c = h.beds[b.key];
            const s = bedStatus(c);
            const color =
              s === "full"
                ? "bg-[color:var(--danger-color)]/15 text-[color:var(--danger-color)]"
                : s === "limited"
                  ? "bg-[color:var(--warning-color)]/20 text-[color:var(--accent-foreground)]"
                  : "bg-[color:var(--success-color)]/15 text-[color:var(--success-color)]";
            return (
              <div key={b.key} className={`rounded-lg p-1.5 text-center ${color}`} title={b.label}>
                <i className={`${b.icon} text-[11px]`} />
                <div className="text-xs font-bold">{c}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-auto flex gap-2 pt-2">
          <Link
            to="/hospital/$id"
            params={{ id: String(h.id) }}
            className="flex-1 text-center px-3 py-2 rounded-lg bg-primary text-white text-sm font-semibold lift-hover"
          >
            View Details
          </Link>
          <a
            href={`tel:${h.phone}`}
            aria-label="Call"
            className="h-9 w-9 grid place-items-center rounded-lg border border-border text-text-secondary hover:text-primary"
          >
            <i className="fa-solid fa-phone" />
          </a>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${h.name}, ${h.address}`)}&travelmode=driving`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Directions"
            className="h-9 w-9 grid place-items-center rounded-lg border border-border text-text-secondary hover:text-primary"
          >
            <i className="fa-solid fa-diamond-turn-right" />
          </a>
        </div>
      </div>
    </article>
  );
}
