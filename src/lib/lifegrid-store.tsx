import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BedType, Hospital, HospitalType } from "./lifegrid-data";
import { HOSPITALS as SEED_HOSPITALS } from "./lifegrid-data";
import { db } from "@/services/db";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "patient" | "hospital" | "admin";
  hospitalId?: number;
}

export interface PendingBooking {
  hospitalId: number;
  hospitalName: string;
  hospitalType: HospitalType;
  bedType: BedType;
  amount: number;
}

export interface Confirmation {
  bookingId: string;
  hospitalName: string;
  hospitalType: HospitalType;
  bedType: BedType;
  amountPaid: number;
  paymentId: string | null;
  status: "pending" | "confirmed" | "rejected";
  timestamp: string;
}

export interface Booking {
  id: string;
  hospitalId: number;
  hospitalName: string;
  hospitalType: HospitalType;
  bedType: BedType;
  patientId: string;
  patientName: string;
  patientContact: string;
  amount: number;
  paymentStatus: "paid" | "not-required";
  status: "pending" | "confirmed" | "rejected";
  rejectionReason?: string;
  requestedAt: string;
  viewedByHospital: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon?: string;
}

interface Store {
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;
  logout: () => void;
  pendingBooking: PendingBooking | null;
  setPendingBooking: (b: PendingBooking | null) => void;
  confirmation: Confirmation | null;
  setConfirmation: (c: Confirmation | null) => void;
  notifications: Notification[];
  markAllRead: () => void;
  hospitals: Hospital[];
  updateHospitalBeds: (id: number, bed: BedType, delta: number) => void;
  setHospitalBedCount: (id: number, bed: BedType, count: number) => void;
  bookings: Booking[];
  addBooking: (
    b: Omit<Booking, "id" | "status" | "requestedAt" | "viewedByHospital">,
  ) => Booking;
  updateBookingStatus: (
    id: string,
    status: "confirmed" | "rejected",
    reason?: string,
  ) => Booking | null;
  markBookingsViewed: (hospitalId: number) => void;
}

const StoreContext = createContext<Store | null>(null);

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

const seedNotifications = (): Notification[] => [
  {
    id: "n1",
    title: "Welcome to LifeGrid",
    message: "Track hospital bed availability in real time.",
    timestamp: "just now",
    read: false,
    icon: "fa-solid fa-heart-pulse",
  },
  {
    id: "n2",
    title: "3 hospitals near you have ICU beds",
    message: "Tap the map to find the closest one.",
    timestamp: "10 min ago",
    read: false,
    icon: "fa-solid fa-hospital",
  },
  {
    id: "n3",
    title: "Emergency helpline: 108",
    message: "24×7 ambulance dispatch across your city.",
    timestamp: "1 hr ago",
    read: true,
    icon: "fa-solid fa-truck-medical",
  },
];

export function LifeGridProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AppUser | null>(null);
  const [pendingBooking, setPendingBookingState] = useState<PendingBooking | null>(null);
  const [confirmation, setConfirmationState] = useState<Confirmation | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>(SEED_HOSPITALS);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    setUserState(readLS<AppUser | null>("lg_user", null));
    setPendingBookingState(readLS<PendingBooking | null>("lg_pending", null));
    setConfirmationState(readLS<Confirmation | null>("lg_confirmation", null));
    setNotifications(readLS<Notification[]>("lg_notifications", seedNotifications()));

    // Load hospitals from DB service
    const dbHs = db.getHospitals();
    setHospitals((cur) =>
      cur.map((h) => {
        const dbH = dbHs.find((x) => x.id === h.id);
        if (dbH) {
          return {
            ...h,
            beds: {
              icu: dbH.availableBeds.icu,
              oxygen: dbH.availableBeds.oxygen,
              emergency: dbH.availableBeds.emergency,
              ventilator: dbH.availableBeds.ventilator,
              general: dbH.availableBeds.general,
            }
          };
        }
        return h;
      })
    );

    // Load bookings from DB service
    const dbBks = db.getBookings();
    const mappedBks: Booking[] = dbBks.map((dbBk) => {
      const h = SEED_HOSPITALS.find((x) => x.id === dbBk.hospitalId);
      return {
        id: dbBk.id,
        hospitalId: dbBk.hospitalId,
        hospitalName: h ? h.name : `Hospital ${dbBk.hospitalId}`,
        hospitalType: h ? h.type : "private",
        bedType: dbBk.bedType,
        patientId: `pt_${dbBk.patientName}`,
        patientName: dbBk.patientName,
        patientContact: dbBk.contactInfo,
        amount: dbBk.amount,
        paymentStatus: dbBk.amount > 0 ? "paid" : "not-required",
        status: dbBk.status,
        requestedAt: dbBk.timestamp,
        viewedByHospital: true,
      };
    });
    setBookings(mappedBks);
  }, []);

  // Simulate live bed updates (only for hospitals with no pending admin activity)
  useEffect(() => {
    const t = setInterval(() => {
      setHospitals((hs) => {
        const next = hs.map((h) => {
          const beds = { ...h.beds };
          const keys = Object.keys(beds) as BedType[];
          const k = keys[Math.floor(Math.random() * keys.length)];
          const jitter = Math.floor(Math.random() * 3) - 1;
          beds[k] = Math.max(0, beds[k] + jitter);
          return { ...h, beds };
        });
        
        // Sync with mock database
        const dbHs = db.getHospitals();
        const updatedDbHs = dbHs.map((dbH) => {
          const liveH = next.find((x) => x.id === dbH.id);
          if (liveH) {
            return {
              ...dbH,
              availableBeds: {
                icu: liveH.beds.icu,
                oxygen: liveH.beds.oxygen,
                emergency: liveH.beds.emergency,
                ventilator: liveH.beds.ventilator,
                general: liveH.beds.general,
              }
            };
          }
          return dbH;
        });
        db.saveHospitals(updatedDbHs);

        return next;
      });
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const setUser = useCallback((u: AppUser | null) => {
    setUserState(u);
    if (u) writeLS("lg_user", u);
    else if (typeof window !== "undefined") window.localStorage.removeItem("lg_user");
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setPendingBookingState(null);
    if (typeof window !== "undefined") window.localStorage.removeItem("lg_pending");
  }, [setUser]);

  const setPendingBooking = useCallback((b: PendingBooking | null) => {
    setPendingBookingState(b);
    if (b) writeLS("lg_pending", b);
    else if (typeof window !== "undefined") window.localStorage.removeItem("lg_pending");
  }, []);

  const setConfirmation = useCallback((c: Confirmation | null) => {
    setConfirmationState(c);
    if (c) writeLS("lg_confirmation", c);
    else if (typeof window !== "undefined") window.localStorage.removeItem("lg_confirmation");
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((ns) => {
      const next = ns.map((n) => ({ ...n, read: true }));
      writeLS("lg_notifications", next);
      return next;
    });
  }, []);

  const updateHospitalBeds = useCallback((id: number, bed: BedType, delta: number) => {
    setHospitals((hs) => {
      const next = hs.map((h) =>
        h.id === id
          ? { ...h, beds: { ...h.beds, [bed]: Math.max(0, h.beds[bed] + delta) } }
          : h,
      );
      
      // Update Database
      db.updateHospitalBeds(id, bed, delta);
      return next;
    });
  }, []);

  const setHospitalBedCount = useCallback((id: number, bed: BedType, count: number) => {
    setHospitals((hs) => {
      const next = hs.map((h) =>
        h.id === id
          ? { ...h, beds: { ...h.beds, [bed]: Math.max(0, Math.floor(count)) } }
          : h,
      );
      
      // Update Database
      const dbHs = db.getHospitals();
      const dbH = dbHs.find((x) => x.id === id);
      if (dbH) {
        dbH.availableBeds[bed] = Math.max(0, Math.floor(count));
        db.saveHospitals(dbHs);
      }
      return next;
    });
  }, []);

  const addBooking: Store["addBooking"] = useCallback((b) => {
    // Add booking in Database
    const dbBk = db.addBooking({
      hospitalId: b.hospitalId,
      patientName: b.patientName,
      contactInfo: b.patientContact,
      bedType: b.bedType,
      amount: b.amount,
      status: "pending",
    });

    const booking: Booking = {
      ...b,
      id: dbBk.id,
      status: "pending",
      requestedAt: dbBk.timestamp,
      viewedByHospital: false,
    };

    setBookings((prev) => {
      const next = [booking, ...prev];
      return next;
    });
    return booking;
  }, []);

  const updateBookingStatus: Store["updateBookingStatus"] = useCallback(
    (id, status, reason) => {
      let updated: Booking | null = null;
      setBookings((prev) => {
        const next = prev.map((b) => {
          if (b.id !== id) return b;
          updated = {
            ...b,
            status,
            rejectionReason: status === "rejected" ? reason || "" : undefined,
            viewedByHospital: true,
          };
          return updated;
        });
        return next;
      });

      // Update in database
      db.updateBookingStatus(id, status);

      // If rejected, release the held bed back into inventory.
      if (updated && status === "rejected") {
        setHospitals((hs) => {
          const nxt = hs.map((h) =>
            h.id === updated!.hospitalId
              ? {
                  ...h,
                  beds: {
                    ...h.beds,
                    [updated!.bedType]: h.beds[updated!.bedType] + 1,
                  },
                }
              : h,
          );
          return nxt;
        });
        // Release bed in DB
        db.updateHospitalBeds(updated!.hospitalId, updated!.bedType, 1);
      }
      
      // Keep the current patient's confirmation in sync if it matches.
      setConfirmationState((c) => {
        if (!c || c.bookingId !== id) return c;
        const next = { ...c, status };
        writeLS("lg_confirmation", next);
        return next;
      });
      return updated;
    },
    [],
  );

  const markBookingsViewed = useCallback((hospitalId: number) => {
    setBookings((prev) => {
      let changed = false;
      const next = prev.map((b) => {
        if (b.hospitalId === hospitalId && !b.viewedByHospital) {
          changed = true;
          return { ...b, viewedByHospital: true };
        }
        return b;
      });
      if (changed) writeLS("lg_bookings", next);
      return next;
    });
  }, []);

  const value = useMemo<Store>(
    () => ({
      user,
      setUser,
      logout,
      pendingBooking,
      setPendingBooking,
      confirmation,
      setConfirmation,
      notifications,
      markAllRead,
      hospitals,
      updateHospitalBeds,
      setHospitalBedCount,
      bookings,
      addBooking,
      updateBookingStatus,
      markBookingsViewed,
    }),
    [
      user,
      setUser,
      logout,
      pendingBooking,
      setPendingBooking,
      confirmation,
      setConfirmation,
      notifications,
      markAllRead,
      hospitals,
      updateHospitalBeds,
      setHospitalBedCount,
      bookings,
      addBooking,
      updateBookingStatus,
      markBookingsViewed,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error("useStore must be used within LifeGridProvider");
  return s;
}

/* Theme */

type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && window.localStorage.getItem("lg_theme")) as
      | Theme
      | null;
    const initial: Theme =
      saved ??
      (typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);
  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      try {
        window.localStorage.setItem("lg_theme", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const c = useContext(ThemeContext);
  if (!c) throw new Error("useTheme requires ThemeProvider");
  return c;
}

export function generateBookingId(): string {
  return "LG" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}
