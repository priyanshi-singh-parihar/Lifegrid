export type BedType = "icu" | "oxygen" | "ventilator" | "general" | "emergency";
export type HospitalType = "government" | "private";

export interface Hospital {
  id: number;
  name: string;
  type: HospitalType;
  location: string;
  address: string;
  distance: string;
  rating: number;
  phone: string;
  image: string;
  description: string;
  beds: Record<BedType, number>;
  services: string[];
}

export const BED_TYPES: { key: BedType; label: string; icon: string }[] = [
  { key: "icu", label: "ICU", icon: "fa-solid fa-procedures" },
  { key: "oxygen", label: "Oxygen", icon: "fa-solid fa-lungs" },
  { key: "ventilator", label: "Ventilator", icon: "fa-solid fa-wind" },
  { key: "general", label: "General", icon: "fa-solid fa-bed" },
  { key: "emergency", label: "Emergency", icon: "fa-solid fa-truck-medical" },
];

export const PRICING: Record<BedType, { government: number; private: number }> = {
  general: { government: 0, private: 49 },
  icu: { government: 0, private: 149 },
  oxygen: { government: 0, private: 149 },
  emergency: { government: 0, private: 149 },
  ventilator: { government: 0, private: 199 },
};

export function bedStatus(count: number): "available" | "limited" | "full" {
  if (count === 0) return "full";
  if (count < 5) return "limited";
  return "available";
}

export function bedStatusColor(count: number): string {
  const s = bedStatus(count);
  if (s === "full") return "text-[color:var(--danger-color)]";
  if (s === "limited") return "text-[color:var(--warning-color)]";
  return "text-[color:var(--success-color)]";
}

export function bedStatusLabel(count: number): string {
  const s = bedStatus(count);
  if (s === "full") return "Full";
  if (s === "limited") return "Limited";
  return "Available";
}

/** Returns a list of missing/invalid field labels. Empty array = record is complete. */
export function validateHospital(h: Partial<Hospital> | undefined | null): string[] {
  if (!h) return ["hospital record"];
  const missing: string[] = [];
  const nonEmpty = (v: unknown) => typeof v === "string" && v.trim().length > 0;

  if (!nonEmpty(h.name)) missing.push("name");
  if (!nonEmpty(h.address)) missing.push("address");
  if (!nonEmpty(h.location)) missing.push("city/location");
  if (!nonEmpty(h.phone) || !/^\+?\d[\d\s-]{6,}$/.test(String(h.phone))) missing.push("contact phone");
  if (!Array.isArray(h.services) || h.services.length === 0) missing.push("services");

  const beds = h.beds as Hospital["beds"] | undefined;
  if (!beds || typeof beds !== "object") {
    missing.push("bed availability");
  } else {
    const required: BedType[] = ["icu", "oxygen", "ventilator", "general", "emergency"];
    const missingBeds = required.filter(
      (k) => typeof beds[k] !== "number" || Number.isNaN(beds[k]) || beds[k] < 0,
    );
    if (missingBeds.length) missing.push(`bed counts (${missingBeds.join(", ")})`);
  }
  return missing;
}

export const HOSPITALS: Hospital[] = [
  // ============= Gwalior district hospitals =============
  {
    id: 101,
    name: "Jayarogya Hospital (JAH Group)",
    type: "government",
    location: "Gwalior",
    address: "Veer Savarkar Marg, Kampoo, Gwalior, MP 474009",
    distance: "1.2 km",
    rating: 4.1,
    phone: "+917512404000",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80",
    description:
      "Flagship teaching hospital attached to Gajra Raja Medical College, offering all major specialities free of cost.",
    beds: { icu: 14, oxygen: 45, ventilator: 8, general: 320, emergency: 22 },
    services: ["General Medicine", "Surgery", "Trauma", "Emergency", "Cardiology", "Neurology"],
  },
  {
    id: 102,
    name: "Kamla Raja Hospital",
    type: "government",
    location: "Gwalior",
    address: "JAH Campus, Kampoo, Gwalior, MP 474009",
    distance: "1.4 km",
    rating: 4.0,
    phone: "+917512420323",
    image: "https://images.unsplash.com/photo-1580281657527-47f249e8f4df?w=800&q=80",
    description:
      "Government women & children's hospital under the JAH group with maternity and neonatal ICU.",
    beds: { icu: 6, oxygen: 20, ventilator: 3, general: 180, emergency: 10 },
    services: ["Maternity", "Pediatrics", "Neonatal ICU", "Gynecology", "Emergency"],
  },
  {
    id: 103,
    name: "District Hospital Murar",
    type: "government",
    location: "Gwalior",
    address: "Murar, Gwalior, MP 474011",
    distance: "4.6 km",
    rating: 3.9,
    phone: "+917512367890",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
    description:
      "District-level public hospital serving Murar and eastern Gwalior with 24x7 emergency and inpatient care.",
    beds: { icu: 4, oxygen: 18, ventilator: 2, general: 150, emergency: 8 },
    services: ["General Medicine", "Surgery", "Emergency", "Maternity", "Pediatrics"],
  },
  {
    id: 104,
    name: "Civil Hospital Hazira",
    type: "government",
    location: "Gwalior",
    address: "Fort Road, Hazira, Gwalior, MP 474009",
    distance: "2.8 km",
    rating: 3.8,
    phone: "+917514015222",
    image: "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&q=80",
    description:
      "Civil hospital serving the Hazira and Lashkar area with outpatient, inpatient and emergency services.",
    beds: { icu: 2, oxygen: 12, ventilator: 1, general: 90, emergency: 6 },
    services: ["General Medicine", "Emergency", "Maternity", "Pediatrics"],
  },
  {
    id: 105,
    name: "ESIC Model Hospital Gwalior",
    type: "government",
    location: "Gwalior",
    address: "Sithouli, Gwalior, MP 474005",
    distance: "8.2 km",
    rating: 3.9,
    phone: "+917512470260",
    image: "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=800&q=80",
    description:
      "ESIC-run model hospital for insured workers and their families with multi-speciality care.",
    beds: { icu: 3, oxygen: 14, ventilator: 2, general: 110, emergency: 5 },
    services: ["General Medicine", "Surgery", "Orthopedics", "Emergency", "Maternity"],
  },
  {
    id: 106,
    name: "Cancer Hospital & Research Institute",
    type: "government",
    location: "Gwalior",
    address: "Residency Road, Gwalior, MP 474002",
    distance: "3.1 km",
    rating: 4.3,
    phone: "+917512331520",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80",
    description:
      "Regional cancer centre offering subsidised oncology, chemotherapy and radiotherapy services.",
    beds: { icu: 5, oxygen: 16, ventilator: 3, general: 120, emergency: 4 },
    services: ["Oncology", "Chemotherapy", "Radiotherapy", "Palliative Care"],
  },
  {
    id: 107,
    name: "Military Hospital Gwalior",
    type: "government",
    location: "Gwalior",
    address: "Cantonment, Morar, Gwalior, MP 474006",
    distance: "5.4 km",
    rating: 4.4,
    phone: "+917512480500",
    image: "https://images.unsplash.com/photo-1587351021355-a479a299d2f9?w=800&q=80",
    description:
      "Armed forces medical facility providing tertiary care to serving personnel, veterans and dependants.",
    beds: { icu: 6, oxygen: 22, ventilator: 4, general: 160, emergency: 8 },
    services: ["General Medicine", "Surgery", "Trauma", "Orthopedics", "Emergency"],
  },
  {
    id: 108,
    name: "CHC Dabra",
    type: "government",
    location: "Gwalior",
    address: "Dabra, Gwalior District, MP 475110",
    distance: "42 km",
    rating: 3.7,
    phone: "+917524223045",
    image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80",
    description:
      "Community Health Centre serving the Dabra block of Gwalior district with primary and secondary care.",
    beds: { icu: 1, oxygen: 8, ventilator: 0, general: 60, emergency: 4 },
    services: ["General Medicine", "Maternity", "Pediatrics", "Emergency"],
  },
  {
    id: 109,
    name: "CHC Bhitarwar",
    type: "government",
    location: "Gwalior",
    address: "Bhitarwar, Gwalior District, MP 475220",
    distance: "55 km",
    rating: 3.6,
    phone: "+917520270220",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
    description:
      "Community Health Centre in Bhitarwar tehsil offering essential inpatient and emergency care.",
    beds: { icu: 0, oxygen: 6, ventilator: 0, general: 45, emergency: 3 },
    services: ["General Medicine", "Maternity", "Emergency"],
  },
  {
    id: 110,
    name: "BIMR Hospitals",
    type: "private",
    location: "Gwalior",
    address: "Surya Mandir Road, Residency, Gwalior, MP 474002",
    distance: "3.0 km",
    rating: 4.5,
    phone: "+917514097777",
    image: "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=800&q=80",
    description:
      "Birla Institute of Medical Research — 200+ bed multi-speciality hospital with advanced cardiac and neuro care.",
    beds: { icu: 10, oxygen: 30, ventilator: 6, general: 140, emergency: 8 },
    services: ["Cardiology", "Neurology", "Oncology", "Orthopedics", "Emergency", "Nephrology"],
  },
  {
    id: 111,
    name: "Apollo Spectra Hospital",
    type: "private",
    location: "Gwalior",
    address: "City Centre, Gwalior, MP 474011",
    distance: "2.5 km",
    rating: 4.6,
    phone: "+917514094000",
    image: "https://images.unsplash.com/photo-1587351021355-a479a299d2f9?w=800&q=80",
    description:
      "Apollo group speciality hospital focused on surgical care, ENT, orthopedics and daycare procedures.",
    beds: { icu: 6, oxygen: 18, ventilator: 3, general: 60, emergency: 4 },
    services: ["Orthopedics", "ENT", "General Surgery", "Urology", "Emergency"],
  },
  {
    id: 112,
    name: "Cygnus MLB Hospital",
    type: "private",
    location: "Gwalior",
    address: "Phalka Bazar, Lashkar, Gwalior, MP 474001",
    distance: "2.1 km",
    rating: 4.3,
    phone: "+917514088888",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80",
    description:
      "Multi-speciality hospital in the heart of Lashkar with 24x7 emergency, ICU and maternity services.",
    beds: { icu: 8, oxygen: 22, ventilator: 4, general: 85, emergency: 6 },
    services: ["Cardiology", "Emergency", "Orthopedics", "Maternity", "Pediatrics"],
  },
  {
    id: 113,
    name: "Rathi Hospital",
    type: "private",
    location: "Gwalior",
    address: "Nai Sadak, Lashkar, Gwalior, MP 474001",
    distance: "2.3 km",
    rating: 4.2,
    phone: "+917512422999",
    image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80",
    description:
      "Long-established private hospital known for general surgery, gastroenterology and critical care.",
    beds: { icu: 5, oxygen: 14, ventilator: 2, general: 55, emergency: 3 },
    services: ["General Surgery", "Gastroenterology", "ICU", "Emergency"],
  },
  {
    id: 114,
    name: "Kalyan Memorial & Kamlesh Tejwani Heart Care",
    type: "private",
    location: "Gwalior",
    address: "Jayendraganj, Lashkar, Gwalior, MP 474009",
    distance: "2.6 km",
    rating: 4.4,
    phone: "+917512422100",
    image: "https://images.unsplash.com/photo-1580281657527-47f249e8f4df?w=800&q=80",
    description:
      "Dedicated cardiac care centre with cath lab, cardiac ICU and 24x7 heart emergency services.",
    beds: { icu: 6, oxygen: 12, ventilator: 3, general: 40, emergency: 3 },
    services: ["Cardiology", "Cardiac Surgery", "Emergency", "Radiology"],
  },
  {
    id: 115,
    name: "Agrawal Hospital & Research Institute",
    type: "private",
    location: "Gwalior",
    address: "Lashkar, Gwalior, MP 474001",
    distance: "2.4 km",
    rating: 4.1,
    phone: "+917512320450",
    image: "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&q=80",
    description:
      "Multi-speciality private hospital offering ENT, general medicine and daycare surgical services.",
    beds: { icu: 3, oxygen: 10, ventilator: 1, general: 45, emergency: 3 },
    services: ["ENT", "General Medicine", "Pediatrics", "Emergency"],
  },
  {
    id: 116,
    name: "ASG Eye Hospital",
    type: "private",
    location: "Gwalior",
    address: "Nigotia Tower, City Centre, Gwalior, MP 474011",
    distance: "2.7 km",
    rating: 4.6,
    phone: "+917514218024",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
    description:
      "Specialty eye hospital offering cataract, glaucoma, retina and cornea services.",
    beds: { icu: 0, oxygen: 4, ventilator: 0, general: 25, emergency: 1 },
    services: ["Ophthalmology", "Cataract", "Retina", "Cornea"],
  },
  {
    id: 117,
    name: "Sanjeevani Hospital",
    type: "private",
    location: "Gwalior",
    address: "Thatipur, Morar, Gwalior, MP 474011",
    distance: "5.0 km",
    rating: 4.2,
    phone: "+917512340120",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80",
    description:
      "Neighbourhood multi-speciality hospital serving Morar with 24x7 emergency and trauma support.",
    beds: { icu: 4, oxygen: 12, ventilator: 2, general: 50, emergency: 4 },
    services: ["Emergency", "Trauma", "Orthopedics", "General Medicine"],
  },
  {
    id: 118,
    name: "Vinayaka Hospital",
    type: "private",
    location: "Gwalior",
    address: "City Centre, Gwalior, MP 474011",
    distance: "2.9 km",
    rating: 4.0,
    phone: "+917514000456",
    image: "https://images.unsplash.com/photo-1587351021355-a479a299d2f9?w=800&q=80",
    description:
      "Private hospital offering maternity, pediatrics and general surgery in central Gwalior.",
    beds: { icu: 3, oxygen: 8, ventilator: 1, general: 40, emergency: 2 },
    services: ["Maternity", "Pediatrics", "General Surgery", "Emergency"],
  },
  {
    id: 119,
    name: "Zenith Hospital",
    type: "private",
    location: "Gwalior",
    address: "Gandhi Road, Lashkar, Gwalior, MP 474009",
    distance: "2.2 km",
    rating: 4.3,
    phone: "+917514065111",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80",
    description: "Multi-speciality hospital with 24x7 emergency, ICU, orthopedic and general surgery care.",
    beds: { icu: 5, oxygen: 16, ventilator: 2, general: 60, emergency: 4 },
    services: ["Orthopedics", "General Surgery", "Emergency", "ICU", "Pediatrics"],
  },
  {
    id: 120,
    name: "Bansal Hospital Gwalior",
    type: "private",
    location: "Gwalior",
    address: "Gole Ka Mandir Road, Gwalior, MP 474005",
    distance: "6.4 km",
    rating: 4.4,
    phone: "+917514080100",
    image: "https://images.unsplash.com/photo-1587351021355-a479a299d2f9?w=800&q=80",
    description: "Modern private hospital with cardiac, neurology and critical care specialities.",
    beds: { icu: 7, oxygen: 20, ventilator: 4, general: 75, emergency: 5 },
    services: ["Cardiology", "Neurology", "Emergency", "Nephrology", "ICU"],
  },
  {
    id: 121,
    name: "Galaxy Hospital",
    type: "private",
    location: "Gwalior",
    address: "Thatipur, Morar, Gwalior, MP 474011",
    distance: "5.2 km",
    rating: 4.1,
    phone: "+917512340888",
    image: "https://images.unsplash.com/photo-1580281657527-47f249e8f4df?w=800&q=80",
    description: "Neighbourhood hospital serving Morar with maternity, general surgery and emergency care.",
    beds: { icu: 3, oxygen: 10, ventilator: 1, general: 45, emergency: 3 },
    services: ["Maternity", "General Surgery", "Pediatrics", "Emergency"],
  },
  {
    id: 122,
    name: "Shri Ram Hospital",
    type: "private",
    location: "Gwalior",
    address: "DD Nagar, Gwalior, MP 474020",
    distance: "4.9 km",
    rating: 4.0,
    phone: "+917514066700",
    image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80",
    description: "Community hospital with 24x7 emergency, general medicine and daycare surgery.",
    beds: { icu: 2, oxygen: 9, ventilator: 1, general: 42, emergency: 3 },
    services: ["General Medicine", "Emergency", "Orthopedics", "Pediatrics"],
  },
  {
    id: 123,
    name: "Aayushman Multispeciality Hospital",
    type: "private",
    location: "Gwalior",
    address: "Deen Dayal Nagar, Gwalior, MP 474020",
    distance: "5.5 km",
    rating: 4.2,
    phone: "+917514099200",
    image: "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=800&q=80",
    description: "Multi-speciality hospital offering cardiac, ortho and critical care with round-the-clock emergency.",
    beds: { icu: 6, oxygen: 18, ventilator: 3, general: 65, emergency: 5 },
    services: ["Cardiology", "Orthopedics", "ICU", "Emergency", "General Medicine"],
  },
  {
    id: 124,
    name: "Suyash Hospital",
    type: "private",
    location: "Gwalior",
    address: "Vinay Nagar, Gwalior, MP 474012",
    distance: "3.6 km",
    rating: 4.0,
    phone: "+917514023456",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
    description: "Private hospital with maternity, pediatric and general surgical services.",
    beds: { icu: 3, oxygen: 10, ventilator: 1, general: 38, emergency: 2 },
    services: ["Maternity", "Pediatrics", "General Surgery", "Emergency"],
  },
  {
    id: 125,
    name: "Kedia Hospital",
    type: "private",
    location: "Gwalior",
    address: "Roxy Road, Lashkar, Gwalior, MP 474001",
    distance: "2.0 km",
    rating: 4.1,
    phone: "+917512427650",
    image: "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&q=80",
    description: "Established private hospital known for general surgery, urology and gastroenterology.",
    beds: { icu: 4, oxygen: 12, ventilator: 2, general: 48, emergency: 3 },
    services: ["General Surgery", "Urology", "Gastroenterology", "Emergency"],
  },
  {
    id: 126,
    name: "CHC Ghatigaon",
    type: "government",
    location: "Gwalior",
    address: "Ghatigaon, Gwalior District, MP 475330",
    distance: "38 km",
    rating: 3.6,
    phone: "+917522253011",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80",
    description: "Community Health Centre serving Ghatigaon block with primary and secondary care.",
    beds: { icu: 0, oxygen: 5, ventilator: 0, general: 40, emergency: 3 },
    services: ["General Medicine", "Maternity", "Emergency"],
  },
  {
    id: 127,
    name: "CHC Morar",
    type: "government",
    location: "Gwalior",
    address: "Morar, Gwalior, MP 474006",
    distance: "5.8 km",
    rating: 3.7,
    phone: "+917512368120",
    image: "https://images.unsplash.com/photo-1580281657527-47f249e8f4df?w=800&q=80",
    description: "Community Health Centre serving Morar with 24x7 emergency and inpatient services.",
    beds: { icu: 1, oxygen: 8, ventilator: 0, general: 55, emergency: 4 },
    services: ["General Medicine", "Maternity", "Pediatrics", "Emergency"],
  },
  {
    id: 128,
    name: "Sharda Hospital",
    type: "private",
    location: "Gwalior",
    address: "University Road, Gwalior, MP 474011",
    distance: "3.9 km",
    rating: 4.2,
    phone: "+917514087345",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80",
    description: "Multi-speciality hospital with ENT, ophthalmology and general medicine departments.",
    beds: { icu: 3, oxygen: 11, ventilator: 1, general: 42, emergency: 3 },
    services: ["ENT", "Ophthalmology", "General Medicine", "Emergency"],
  },
  {
    id: 129,
    name: "Jeevan Jyoti Hospital",
    type: "private",
    location: "Gwalior",
    address: "Bahodapur, Gwalior, MP 474012",
    distance: "4.3 km",
    rating: 4.0,
    phone: "+917514035500",
    image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80",
    description: "Community hospital offering maternity, pediatric and emergency care.",
    beds: { icu: 2, oxygen: 9, ventilator: 1, general: 36, emergency: 2 },
    services: ["Maternity", "Pediatrics", "Emergency", "General Medicine"],
  },
  {
    id: 130,
    name: "Cygnus Ravindra Hospital",
    type: "private",
    location: "Gwalior",
    address: "City Centre, Gwalior, MP 474011",
    distance: "2.8 km",
    rating: 4.3,
    phone: "+917514091234",
    image: "https://images.unsplash.com/photo-1587351021355-a479a299d2f9?w=800&q=80",
    description: "Multi-speciality hospital with cardiac, orthopedic and critical care facilities.",
    beds: { icu: 6, oxygen: 18, ventilator: 3, general: 70, emergency: 5 },
    services: ["Cardiology", "Orthopedics", "ICU", "Emergency", "Neurology"],
  },
];

export const CITIES = ["Gwalior"];

export function formatBedType(bed: BedType): string {
  if (bed === "icu") return "ICU Bed";
  return `${bed.charAt(0).toUpperCase()}${bed.slice(1)} Bed`;
}

export function bedIcon(bed: BedType): string {
  return BED_TYPES.find((b) => b.key === bed)?.icon ?? "fa-solid fa-bed";
}
