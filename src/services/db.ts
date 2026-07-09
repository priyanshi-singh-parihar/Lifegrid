import { HOSPITALS as SEED_HOSPITALS } from "@/lib/lifegrid-data";

export interface HospitalDB {
  id: number;
  name: string;
  password?: string;
  totalBeds: {
    icu: number;
    oxygen: number;
    emergency: number;
    ventilator: number;
    general: number;
  };
  availableBeds: {
    icu: number;
    oxygen: number;
    emergency: number;
    ventilator: number;
    general: number;
  };
}

export interface BookingDB {
  id: string;
  hospitalId: number;
  patientName: string;
  contactInfo: string;
  bedType: "icu" | "oxygen" | "emergency" | "ventilator" | "general";
  timestamp: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected';
}

const STORAGE_HOSPITALS_KEY = "lg_hospitals_db";
const STORAGE_BOOKINGS_KEY = "lg_bookings_db";

const isClient = typeof window !== "undefined";

export const db = {
  getHospitals(): HospitalDB[] {
    if (!isClient) return [];
    try {
      const raw = localStorage.getItem(STORAGE_HOSPITALS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to read hospitals DB from localStorage:", e);
    }
    // Seed initial hospitals
    const seeded: HospitalDB[] = SEED_HOSPITALS.map((h) => ({
      id: h.id,
      name: h.name,
      password: "password123",
      totalBeds: {
        icu: h.beds.icu,
        oxygen: h.beds.oxygen,
        emergency: h.beds.emergency,
        ventilator: h.beds.ventilator,
        general: h.beds.general,
      },
      availableBeds: {
        icu: h.beds.icu,
        oxygen: h.beds.oxygen,
        emergency: h.beds.emergency,
        ventilator: h.beds.ventilator,
        general: h.beds.general,
      },
    }));
    this.saveHospitals(seeded);
    return seeded;
  },

  saveHospitals(hospitals: HospitalDB[]) {
    if (!isClient) return;
    try {
      localStorage.setItem(STORAGE_HOSPITALS_KEY, JSON.stringify(hospitals));
    } catch (e) {
      console.error("Failed to save hospitals DB to localStorage:", e);
    }
  },

  updateHospitalBeds(hospitalId: number, bedType: keyof HospitalDB["availableBeds"], delta: number) {
    const list = this.getHospitals();
    const h = list.find((x) => x.id === hospitalId);
    if (h) {
      h.availableBeds[bedType] = Math.max(0, Math.min(h.totalBeds[bedType], h.availableBeds[bedType] + delta));
      this.saveHospitals(list);
    }
  },

  getBookings(): BookingDB[] {
    if (!isClient) return [];
    try {
      const raw = localStorage.getItem(STORAGE_BOOKINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to read bookings DB from localStorage:", e);
    }
    return [];
  },

  saveBookings(bookings: BookingDB[]) {
    if (!isClient) return;
    try {
      localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(bookings));
    } catch (e) {
      console.error("Failed to save bookings DB to localStorage:", e);
    }
  },

  addBooking(b: Omit<BookingDB, "id" | "timestamp">): BookingDB {
    const list = this.getBookings();
    const newBooking: BookingDB = {
      ...b,
      id: "BK" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
      timestamp: new Date().toISOString(),
    };
    list.push(newBooking);
    this.saveBookings(list);
    return newBooking;
  },

  updateBookingStatus(bookingId: string, status: BookingDB["status"]): BookingDB | null {
    const list = this.getBookings();
    const b = list.find((x) => x.id === bookingId);
    if (b) {
      b.status = status;
      this.saveBookings(list);
      return b;
    }
    return null;
  }
};
