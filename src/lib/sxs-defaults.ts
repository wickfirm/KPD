import type { SxsContent } from "@/lib/sxs-content";

const planImage = "/assets/plans/rendered-floorplan.png";

/// The residence page as it is published today. The CMS record starts as this
/// object, then editors change any field. Local /assets paths are rewritten to
/// R2 when a migrated file exists.
export const sxsDefaults: SxsContent = {
  navigation: {
    items: [
      { label: "home", anchor: "home" },
      { label: "the residences", anchor: "about-sevenxseven" },
      { label: "interiors", anchor: "apartments" },
      { label: "gallery", anchor: "gallery" },
      { label: "architecture", anchor: "exterior" },
      { label: "amenities", anchor: "amenities" },
      { label: "community", anchor: "community" },
      { label: "location", anchor: "location" },
      { label: "floor plans", anchor: "floor-plans" },
      { label: "payment plan", anchor: "payment-plan" },
      { label: "contact", anchor: "contact" },
    ],
  },
  hero: {
    eyebrow: "Meydan Horizon",
    headline: "luxury in balance",
    body: "Stillness and energy. Privacy and connection. Retreat and play. The home that offers you both.",
    media: "/assets/hero/video-1788257574774.mp4",
    gallery: [
      { src: "/assets/hero/Hero%20Gallery/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(1).png", alt: "seven x seven residents lounge", position: "62% 50%" },
      { src: "/assets/hero/Hero%20Gallery/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(2).png", alt: "seven x seven residential lobby", position: "64% 50%" },
      { src: "/assets/hero/Hero%20Gallery/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(7).png", alt: "seven x seven fitness suite", position: "68% 50%" },
      { src: "/assets/hero/Hero%20Gallery/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(8).png", alt: "seven x seven yoga studio", position: "66% 50%" },
      { src: "/assets/hero/Hero%20Gallery/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(11).png", alt: "seven x seven pool terrace", position: "64% 50%" },
      { src: "/assets/hero/Hero%20Gallery/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(13).png", alt: "seven x seven outdoor wellness terrace", position: "68% 50%" },
    ],
  },
  about: {
    headline: "the residences",
    body: "The city, within reach. Meydan Horizon keeps the city close. At home, water, greenery and open views reveal a calmer side of Dubai.",
    media: "/assets/hero/about-building-cleanup.png",
  },
  manifesto: { body: "Explore one home for every kind of day. Surrounded by light. Shaped by details." },
  apartments: {
    headline: "more room, crafted with intent.",
    body: "One-, two- and three-bedroom residences built around space, function and ease.",
    imageOne: "/assets/sxs%20apartments/1.png",
    imageTwo: "/assets/sxs%20apartments/2.png",
    imageTen: "/assets/sxs%20apartments/10.png",
    gallery: [
      { src: "/assets/sxs%20apartments/3.png", alt: "seven x seven crafted kitchen and island" },
      { src: "/assets/sxs%20apartments/4.png", alt: "seven x seven open dining and living room" },
      { src: "/assets/sxs%20apartments/5.png", alt: "seven x seven sunlit living room" },
      { src: "/assets/sxs%20apartments/6.png", alt: "seven x seven principal bathroom" },
      { src: "/assets/sxs%20apartments/7.png", alt: "seven x seven principal bedroom" },
      { src: "/assets/sxs%20apartments/8.png", alt: "seven x seven bedroom with skyline view" },
      { src: "/assets/sxs%20apartments/9.png", alt: "seven x seven open-plan residence" },
    ],
  },
  gallery: {
    headline: "gallery",
    note: "see the balance",
    gallery: [
      { src: "/assets/sxs%20exterior/1.png", alt: "seven x seven illuminated facade at dusk" },
      { src: "/assets/sxs%20exterior/2.png", alt: "seven x seven landscaped arrival" },
      { src: "/assets/sxs%20exterior/3.png", alt: "seven x seven tower and podium architecture" },
      { src: "/assets/sxs%20exterior/4.png", alt: "seven x seven residential exterior" },
      { src: "/assets/sxs%20exterior/5.png", alt: "seven x seven exterior detail" },
    ],
  },
  exterior: {
    headline: "Discreetly different.",
    body: "Behind its composed allure, seven x seven residences Meydan Horizon extends everyday life beyond the home, revealing a connected sequence of wellness, social and outdoor spaces for every side of you.",
    media: "/assets/hero/seven-x-seven-facade-evening.webp",
  },
  amenities: {
    headline: "amenities",
    items: [
      { src: "/assets/sxsamenities/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(1).png", alt: "seven x seven residents lounge and reception", label: "Residents lounge" },
      { src: "/assets/sxsamenities/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(2).png", alt: "seven x seven residential lobby", label: "Residential lobby" },
      { src: "/assets/sxsamenities/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(3).png", alt: "seven x seven private lift lobby", label: "Private lift lobby" },
      { src: "/assets/sxsamenities/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(4).png", alt: "seven x seven spa changing suite", label: "Spa changing suites" },
      { src: "/assets/sxsamenities/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(5).png", alt: "seven x seven indoor vitality pool", label: "Vitality pool" },
      { src: "/assets/sxsamenities/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(6).png", alt: "seven x seven relaxation lounge", label: "Relaxation lounge" },
      { src: "/assets/sxsamenities/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(7).png", alt: "seven x seven fitness studio", label: "Fitness studio" },
      { src: "/assets/sxsamenities/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(8).png", alt: "seven x seven yoga studio", label: "Yoga studio" },
      { src: "/assets/sxsamenities/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(9).png", alt: "seven x seven water garden promenade", label: "Water garden" },
      { src: "/assets/sxsamenities/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(10).png", alt: "seven x seven infinity pool overlooking Dubai", label: "Skyline infinity pool" },
      { src: "/assets/sxsamenities/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(11).png", alt: "seven x seven family pool terrace", label: "Family pool terrace" },
      { src: "/assets/sxsamenities/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(12).png", alt: "seven x seven landscaped play garden", label: "Children's play garden" },
      { src: "/assets/sxsamenities/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(13).png", alt: "seven x seven outdoor fitness terrace", label: "Outdoor fitness terrace" },
      { src: "/assets/sxsamenities/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(14).png", alt: "seven x seven shaded social terrace", label: "Shaded social terrace" },
      { src: "/assets/sxsamenities/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(15).png", alt: "seven x seven firepit lounge", label: "Firepit lounge" },
    ],
  },
  community: {
    headline: "mohammed bin rashid city",
    body: "MBR City brings together residential calm, new infrastructure, open landscapes and fast access to Dubai's central destinations.",
    slides: [
      { src: "/assets/hero/about-building-cleanup.png", alt: "seven x seven within a green residential landscape" },
      { src: "/assets/hero/tower-sunset.webp", alt: "seven x seven at sunset within Meydan Horizon" },
      { src: "/assets/hero/seven-x-seven-facade-evening.webp", alt: "seven x seven evening facade and community setting" },
    ],
  },
  location: {
    headline: "close to what matters.",
    body: "Meydan Horizon, within the wider MBR City, connects seven x seven residences to schools, business hubs, cultural districts, dining addresses and shopping centres. Everything stays within easy reach.",
    places: [
      { name: "Ras Al Khor Wildlife Sanctuary", minutes: "9 min", lat: 25.1926, lng: 55.3601, reveal: 0.08 },
      { name: "Downtown Dubai / Burj Khalifa / Dubai Mall", minutes: "10-12 min", lat: 25.1972, lng: 55.2744, reveal: 0.15 },
      { name: "Dubai Creek Harbour", minutes: "10-12 min", lat: 25.202, lng: 55.344, reveal: 0.22 },
      { name: "Dubai Design District", minutes: "12 min", lat: 25.1865, lng: 55.2993, reveal: 0.3 },
      { name: "DIFC / Business Bay / DWTC", minutes: "12-15 min", lat: 25.2118, lng: 55.2796, reveal: 0.38 },
      { name: "Meydan One Mall", minutes: "17 min", lat: 25.1633, lng: 55.3037, reveal: 0.46 },
      { name: "Meydan Racecourse", minutes: "19 min", lat: 25.1572, lng: 55.3004, reveal: 0.54 },
      { name: "City Walk", minutes: "20 min", lat: 25.2074, lng: 55.2623, reveal: 0.62 },
      { name: "Dubai Marina", minutes: "22 min", lat: 25.0805, lng: 55.1403, reveal: 0.7 },
      { name: "Mall of the Emirates", minutes: "25 min", lat: 25.1181, lng: 55.2006, reveal: 0.78 },
      { name: "Palm Jumeirah", minutes: "28 min", lat: 25.1124, lng: 55.139, reveal: 0.92 },
    ],
  },
  floorplans: {
    headline: "floor plans",
    tabOne: "1 bedroom",
    tabTwo: "2 bedrooms",
    tabThree: "3 bedrooms",
    plans: {
      one: {
        image: planImage, alt: "Rendered one bedroom residence floor plan", title: "one-bedroom residences", unit: "1 bhk apartment",
        totalSqft: "858 sqft", totalSqm: "79.79 sqm", suiteSqft: "709 sqft", suiteSqm: "65.84 sqm", balconySqft: "150 sqft", balconySqm: "13.95 sqm",
        legend: [["01", "guest toilet", "1.95m x 4.66m"], ["02", "kitchen", "open plan"], ["03", "living & dining area", "7.60m x 3.90m"], ["04", "master bedroom", "5.45m x 4.03m"], ["05", "balcony", "-"]],
      },
      two: {
        image: planImage, alt: "Rendered two bedroom residence floor plan", title: "two-bedroom residences", unit: "2 bhk apartment",
        totalSqft: "1279 sqft", totalSqm: "118.84 sqm", suiteSqft: "1014 sqft", suiteSqm: "94.17 sqm", balconySqft: "266 sqft", balconySqm: "24.67 sqm",
        legend: [["01", "powder room", "1.95m x 1.69m"], ["02", "kitchen", "4.05m x 2.25m"], ["03", "living & dining area", "4.05m x 7.40m"], ["04", "bedroom 2", "4.20m x 4.09m"], ["05", "bathroom 2", "1.90m x 2.20m"]],
      },
      three: {
        image: planImage, alt: "Rendered three bedroom residence floor plan", title: "three-bedroom residences", unit: "3 bhk apartment",
        totalSqft: "2560 sqft", totalSqm: "237.83 sqm", suiteSqft: "1900 sqft", suiteSqm: "176.52 sqm", balconySqft: "660 sqft", balconySqm: "61.32 sqm",
        legend: [["01", "powder room", "2.48m x 1.60m"], ["02", "kitchen", "3.40m x 3.90m"], ["03", "living & dining area", "7.65m x 3.90m"], ["04", "laundry", "1.40m x 1.00m"], ["05", "store room", "2.40m x 1.90m"]],
      },
    },
  },
  payment: {
    headline: "a considered path to ownership",
    body: "A structured payment plan from reservation through handover, aligned with construction progress.",
    milestones: [
      { percent: 20, title: "day 1", detail: "At the time of booking", phase: "calendar" },
      { percent: 10, title: "60 days", detail: "After the reservation date", phase: "calendar" },
      { percent: 10, title: "120 days", detail: "After the reservation date", phase: "calendar" },
      { percent: 5, title: "240 days", detail: "After the reservation date", phase: "calendar" },
      { percent: 5, title: "360 days", detail: "After the reservation date", phase: "calendar" },
      { percent: 5, title: "30% built", detail: "On 30% construction completion", phase: "construction" },
      { percent: 5, title: "40% built", detail: "On 40% construction completion", phase: "construction" },
      { percent: 5, title: "50% built", detail: "On 50% construction completion", phase: "construction" },
      { percent: 5, title: "60% built", detail: "On 60% construction completion", phase: "construction" },
      { percent: 30, title: "handover", detail: "On completion of the project", phase: "handover" },
    ],
  },
  register: {
    headline: "make it yours",
    body: "Explore availability, floor plans and purchase details with our team.",
    interestOptions: ["Information about the project", "A property consultant to contact me", "Book a private viewing"],
    consent: "By submitting this form you agree to share your details so the sales team can contact you and accept our privacy policy.",
  },
  footer: {
    body: "seven x seven sees luxury as the freedom to live your way.",
    copyright: "Copyright 2026 Kasumigaseki Properties Development",
  },
  privacy: {},
  cta: {
    primary: "register your interest",
    secondary: "explore residences",
    submit: "register your interest",
  },
  brand: {
    logoWhite: "/assets/brand/logo-stacked-white.png",
    logoBlack: "/assets/brand/logo-stacked-black.png",
    markWhite: "/assets/brand/s-mark-white.png",
    markBlack: "/assets/brand/s-mark-black.png",
    intro: "/assets/hero/sxs%20without%20bg.png",
    map: "/assets/maps/mobile-driving-distances.png",
  },
  seo: {
    title: "seven x seven",
    description: "seven x seven Meydan Horizon Residences. Luxury, in balance.",
  },
};
