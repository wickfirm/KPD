"use client";

/// <reference types="google.maps" />

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  Building2,
  CalendarDays,
  KeyRound,
  Menu,
  X
} from "lucide-react";
import {
  FaBuilding,
  FaChildren,
  FaCouch,
  FaDroplet,
  FaDumbbell,
  FaElevator,
  FaFireFlameCurved,
  FaPersonPraying,
  FaPersonRunning,
  FaPersonSwimming,
  FaShower,
  FaSpa,
  FaTree,
  FaUmbrellaBeach,
  FaWaterLadder
} from "react-icons/fa6";
import type { SxsContent, SxsSectionKey } from "@/lib/sxs-content";
import { MobilePublicSite } from "./MobilePublicSite";

type SectionKey = SxsSectionKey;
export type PublishedContent = SxsContent;

const heroGallery = [
  { src: "/assets/hero/Hero%20Gallery/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(1).png", alt: "seven x seven residents lounge", position: "62% 50%" },
  { src: "/assets/hero/Hero%20Gallery/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(2).png", alt: "seven x seven residential lobby", position: "64% 50%" },
  { src: "/assets/hero/Hero%20Gallery/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(7).png", alt: "seven x seven fitness suite", position: "68% 50%" },
  { src: "/assets/hero/Hero%20Gallery/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(8).png", alt: "seven x seven yoga studio", position: "66% 50%" },
  { src: "/assets/hero/Hero%20Gallery/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(11).png", alt: "seven x seven pool terrace", position: "64% 50%" },
  { src: "/assets/hero/Hero%20Gallery/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(13).png", alt: "seven x seven outdoor wellness terrace", position: "68% 50%" }
];

const manifestoText = "Explore one home for every kind of day. Surrounded by light. Shaped by details.";

const moodBoardPortraits = [
  { src: "/assets/sxs%20apartments/3.png", alt: "seven x seven crafted kitchen and island" },
  { src: "/assets/sxs%20apartments/4.png", alt: "seven x seven open dining and living room" },
  { src: "/assets/sxs%20apartments/5.png", alt: "seven x seven sunlit living room" },
  { src: "/assets/sxs%20apartments/6.png", alt: "seven x seven principal bathroom" },
  { src: "/assets/sxs%20apartments/7.png", alt: "seven x seven principal bedroom" },
  { src: "/assets/sxs%20apartments/8.png", alt: "seven x seven bedroom with skyline view" },
  { src: "/assets/sxs%20apartments/9.png", alt: "seven x seven open-plan residence" }
];

const galleryImages = [
  { src: "/assets/sxs%20exterior/1.png", alt: "seven x seven illuminated facade at dusk" },
  { src: "/assets/sxs%20exterior/2.png", alt: "seven x seven landscaped arrival" },
  { src: "/assets/sxs%20exterior/3.png", alt: "seven x seven tower and podium architecture" },
  { src: "/assets/sxs%20exterior/4.png", alt: "seven x seven residential exterior" },
  { src: "/assets/sxs%20exterior/5.png", alt: "seven x seven exterior detail" }
];

const amenityScenes = [
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
  { src: "/assets/sxsamenities/20260914_SevenXSeven_Amenities_ColourDraft1.pdf%20(15).png", alt: "seven x seven firepit lounge", label: "Firepit lounge" }
];

const amenities = [
  { icon: FaCouch, label: "Residents lounge", scene: 0 },
  { icon: FaBuilding, label: "Residential lobby", scene: 1 },
  { icon: FaElevator, label: "Private lift lobby", scene: 2 },
  { icon: FaShower, label: "Spa changing suites", scene: 3 },
  { icon: FaPersonSwimming, label: "Vitality pool", scene: 4 },
  { icon: FaSpa, label: "Relaxation lounge", scene: 5 },
  { icon: FaDumbbell, label: "Fitness studio", scene: 6 },
  { icon: FaPersonPraying, label: "Yoga studio", scene: 7 },
  { icon: FaDroplet, label: "Water garden", scene: 8 },
  { icon: FaWaterLadder, label: "Skyline infinity pool", scene: 9 },
  { icon: FaUmbrellaBeach, label: "Family pool terrace", scene: 10 },
  { icon: FaChildren, label: "Children's play garden", scene: 11 },
  { icon: FaPersonRunning, label: "Outdoor fitness terrace", scene: 12 },
  { icon: FaTree, label: "Shaded social terrace", scene: 13 },
  { icon: FaFireFlameCurved, label: "Firepit lounge", scene: 14 }
];

const communitySlides = [
  {
    src: "/assets/hero/about-building-cleanup.png",
    alt: "seven x seven within a green residential landscape"
  },
  {
    src: "/assets/hero/tower-sunset.webp",
    alt: "seven x seven at sunset within Meydan Horizon"
  },
  {
    src: "/assets/hero/seven-x-seven-facade-evening.webp",
    alt: "seven x seven evening facade and community setting"
  }
];

const distanceHeading = "close to what matters.";
const distanceDescription =
  "Meydan Horizon, within the wider MBR City, connects seven x seven residences to schools, business hubs, cultural districts, dining addresses and shopping centres. Everything stays within easy reach.";

const distancePlaces = [
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
  { name: "Palm Jumeirah", minutes: "28 min", lat: 25.1124, lng: 55.139, reveal: 0.92 }
];

const residenceCoordinates = { lat: 25.18141, lng: 55.32252 };

const renderedFloorPlanImage = "/assets/plans/rendered-floorplan.png";

const floorPlans = {
  one: {
    image: renderedFloorPlanImage,
    alt: "Rendered one bedroom residence floor plan",
    title: "one-bedroom residences",
    unit: "1 bhk apartment",
    totalSqft: "858 sqft",
    totalSqm: "79.79 sqm",
    suiteSqft: "709 sqft",
    suiteSqm: "65.84 sqm",
    balconySqft: "150 sqft",
    balconySqm: "13.95 sqm",
    legend: [
      ["01", "guest toilet", "1.95m x 4.66m"],
      ["02", "kitchen", "open plan"],
      ["03", "living & dining area", "7.60m x 3.90m"],
      ["04", "master bedroom", "5.45m x 4.03m"],
      ["05", "balcony", "-"]
    ]
  },
  two: {
    image: renderedFloorPlanImage,
    alt: "Rendered two bedroom residence floor plan",
    title: "two-bedroom residences",
    unit: "2 bhk apartment",
    totalSqft: "1279 sqft",
    totalSqm: "118.84 sqm",
    suiteSqft: "1014 sqft",
    suiteSqm: "94.17 sqm",
    balconySqft: "266 sqft",
    balconySqm: "24.67 sqm",
    legend: [
      ["01", "powder room", "1.95m x 1.69m"],
      ["02", "kitchen", "4.05m x 2.25m"],
      ["03", "living & dining area", "4.05m x 7.40m"],
      ["04", "bedroom 2", "4.20m x 4.09m"],
      ["05", "bathroom 2", "1.90m x 2.20m"]
    ]
  },
  three: {
    image: renderedFloorPlanImage,
    alt: "Rendered three bedroom residence floor plan",
    title: "three-bedroom residences",
    unit: "3 bhk apartment",
    totalSqft: "2560 sqft",
    totalSqm: "237.83 sqm",
    suiteSqft: "1900 sqft",
    suiteSqm: "176.52 sqm",
    balconySqft: "660 sqft",
    balconySqm: "61.32 sqm",
    legend: [
      ["01", "powder room", "2.48m x 1.60m"],
      ["02", "kitchen", "3.40m x 3.90m"],
      ["03", "living & dining area", "7.65m x 3.90m"],
      ["04", "laundry", "1.40m x 1.00m"],
      ["05", "store room", "2.40m x 1.90m"]
    ]
  }
} as const;

type FloorPlanKey = keyof typeof floorPlans;
const floorPlanTabLabels: Record<FloorPlanKey, string> = {
  one: "1 bedroom",
  two: "2 bedrooms",
  three: "3 bedrooms"
};

const paymentMilestones = [
  { percent: 20, title: "day 1", detail: "At the time of booking", phase: "calendar" },
  { percent: 10, title: "60 days", detail: "After the reservation date", phase: "calendar" },
  { percent: 10, title: "120 days", detail: "After the reservation date", phase: "calendar" },
  { percent: 5, title: "240 days", detail: "After the reservation date", phase: "calendar" },
  { percent: 5, title: "360 days", detail: "After the reservation date", phase: "calendar" },
  { percent: 5, title: "30% built", detail: "On 30% construction completion", phase: "construction" },
  { percent: 5, title: "40% built", detail: "On 40% construction completion", phase: "construction" },
  { percent: 5, title: "50% built", detail: "On 50% construction completion", phase: "construction" },
  { percent: 5, title: "60% built", detail: "On 60% construction completion", phase: "construction" },
  { percent: 30, title: "handover", detail: "On completion of the project", phase: "handover" }
] as const;

const sectionNavigation = [
  { id: "home", label: "home", progress: 0 },
  { id: "about-sevenxseven", label: "the residences", progress: 2 },
  { id: "apartments", label: "interiors", progress: 4 },
  { id: "gallery", label: "gallery", progress: 8.8 },
  { id: "exterior", label: "architecture", progress: 15.3 },
  { id: "amenities", label: "amenities", progress: 16.3 },
  { id: "community", label: "community", progress: 22.3 },
  { id: "location", label: "location", progress: 23.3 },
  { id: "floor-plans", label: "floor plans", progress: 28.5 },
  { id: "payment-plan", label: "payment plan", progress: 29.5 },
  { id: "contact", label: "contact", progress: 35.5 }
] as const;

const amenitySnapProgress = Array.from(
  { length: amenityScenes.length },
  (_, index) => 16.3 + (index * 5) / (amenityScenes.length - 1)
);

const scrollSnapProgress = Array.from(
  new Set([
    0, 1, 2, 3, 7.8, 8.8,
    14.3, 15.3, ...amenitySnapProgress, 22.3, 23.3, 24.5, 25, 25.5, 26.5, 27.5,
    28.5, 29.5, 34.5, 35.5
  ])
).sort((a, b) => a - b);

const rollbackFreeRanges = [
  [3, 7.8],
  [8.8, 14.3],
  [24.5, 27.5],
  [29.5, 34.5]
] as const;

const distanceAreaLabels = [
  { name: "Deira", lat: 25.2697, lng: 55.3095 },
  { name: "Jumeirah", lat: 25.215, lng: 55.246 },
  { name: "Business Bay", lat: 25.185, lng: 55.264 },
  { name: "Meydan", lat: 25.167, lng: 55.31 },
  { name: "Al Barsha", lat: 25.1124, lng: 55.2007 },
  { name: "Dubai Marina", lat: 25.0805, lng: 55.1403 }
];

export function SevenXSevenFresh({ content, preview = false }: { content: PublishedContent; preview?: boolean }) {
  const text = (section: SectionKey, key: string, fallback: string) => {
    const value = content[section]?.[key];
    return typeof value === "string" && value.trim() ? value : fallback;
  };
  const items = (section: SectionKey, key: string, fallback: string[]) => {
    const value = content[section]?.[key];
    return Array.isArray(value) && value.every((item) => typeof item === "string") && value.length ? value : fallback;
  };
  const media = (section: SectionKey, key: string, fallback: string) => {
    const value = content[section]?.[key];
    return typeof value === "string" && value.startsWith("/") ? value : fallback;
  };
  const mediaItems = (section: SectionKey, key: string, fallback: Array<{ src: string; alt: string; label?: string; position?: string }>) => {
    const value = content[section]?.[key];
    if (!Array.isArray(value) || !value.length) return fallback;
    return value.map((item, index) => {
      if (typeof item === "string") return { ...fallback[index % fallback.length], src: item };
      const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return { src: typeof record.media === "string" ? record.media : typeof record.src === "string" ? record.src : fallback[index % fallback.length].src, alt: typeof record.alt === "string" ? record.alt : fallback[index % fallback.length].alt, label: typeof record.label === "string" ? record.label : fallback[index % fallback.length].label, position: typeof record.position === "string" ? record.position : fallback[index % fallback.length].position };
    });
  };
  const heroScenes = mediaItems("hero", "gallery", heroGallery);
  const apartmentScenes = mediaItems("apartments", "gallery", moodBoardPortraits);
  const exteriorGalleryScenes = mediaItems("gallery", "gallery", galleryImages);
  const amenitySceneData = mediaItems("amenities", "items", amenityScenes);
  const communitySceneData = mediaItems("community", "slides", communitySlides);
  const manifestoCopy = text("manifesto", "body", manifestoText);
  const distanceHeadingCopy = text("location", "headline", distanceHeading);
  const distanceDescriptionCopy = text("location", "body", distanceDescription);
  const amenityLabels = amenitySceneData.map((scene, index) => scene.label ?? amenities[index % amenities.length].label);
  const navigationValue = content.navigation?.items;
  const navigationSections = Array.isArray(navigationValue) && navigationValue.length
    ? navigationValue.map((item, index) => {
        if (typeof item === "string") return { ...sectionNavigation[index % sectionNavigation.length], label: item };
        const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
        const anchor = typeof record.anchor === "string" ? record.anchor.replace(/^#/, "") : sectionNavigation[index % sectionNavigation.length].id;
        const known = sectionNavigation.find((entry) => entry.id === anchor);
        return { id: anchor, label: typeof record.label === "string" ? record.label : anchor.replaceAll("-", " "), progress: known?.progress ?? (index / Math.max(navigationValue.length - 1, 1)) * 35.5 };
      })
    : [...sectionNavigation];
  const interestOptions = items("register", "interestOptions", ["Information about the project", "A property consultant to contact me", "Book a private viewing"]);
  const primaryCta = text("cta", "primary", "register your interest");
  const secondaryCta = text("cta", "secondary", "explore residences");
  const submitCta = text("cta", "submit", primaryCta);
  const consentCopy = text("register", "consent", "By submitting this form you agree to share your details so the sales team can contact you and accept our privacy policy.").replace(/privacy policy\.?$/i, "").trim();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTransitioning, setMenuTransitioning] = useState(false);
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [heroSlides, setHeroSlides] = useState({ current: 0, previous: heroScenes.length - 1 });
  const [activeCommunitySlide, setActiveCommunitySlide] = useState(0);
  const [activeFloorPlan, setActiveFloorPlan] = useState<FloorPlanKey>("three");
  const [selectedPaymentMilestone, setSelectedPaymentMilestone] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [activeAmenity, setActiveAmenity] = useState(0);
  const [mobileScrolled, setMobileScrolled] = useState(false);
  const [mobileProgress, setMobileProgress] = useState(0);
  const [mobileLightbox, setMobileLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [paymentPlaying, setPaymentPlaying] = useState(false);
  const [leadSubmission, setLeadSubmission] = useState<{ source: string; state: "idle" | "submitting" | "success" | "error" }>({ source: "", state: "idle" });

  async function submitLead(event: FormEvent<HTMLFormElement>, source: "Register modal" | "Footer form") {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const interestSelect = form.elements.namedItem("TypeOfLead") as HTMLSelectElement | null;
    setLeadSubmission({ source, state: "submitting" });

    try {
      const fullName = String(formData.get("FullName") || "").trim();
      const email = String(formData.get("Email") || "").trim();
      const phone = String(formData.get("PhoneNumber") || "").trim();
      const interest = String(interestSelect?.selectedOptions[0]?.text ?? formData.get("TypeOfLead") ?? "seven x seven");
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email,
          phone,
          message: `seven x seven residence enquiry from the ${source}. Interest: ${interest}.`,
          interest,
          sourcePage: "/seven-x-seven",
          inquiryType: "seven x seven residence",
          details: [
            { label: "Name", value: fullName },
            { label: "Email", value: email },
            { label: "Phone", value: phone },
            { label: "Interest", value: interest },
            { label: "Source", value: source },
            { label: "Landing page", value: window.location.href },
          ],
        }),
      });
      if (!response.ok) throw new Error("Unable to submit enquiry");
      (window as Window & { sxsTrack?: (event: string, detail: { target: string }) => void }).sxsTrack?.("generate_lead", { target: source });
      form.reset();
      setLeadSubmission({ source, state: "success" });
      if (source === "Register modal") window.setTimeout(() => setInterestModalOpen(false), 900);
    } catch {
      setLeadSubmission({ source, state: "error" });
    }
  }
  const communityCarouselRef = useRef<HTMLDivElement>(null);
  const communitySlideRef = useRef(0);
  const siteRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const manifestoTextRef = useRef<HTMLParagraphElement>(null);
  const moodTrackRef = useRef<HTMLDivElement>(null);
  const galleryViewportRef = useRef<HTMLDivElement>(null);
  const galleryTrackRef = useRef<HTMLDivElement>(null);
  const galleryPercentRef = useRef<HTMLSpanElement>(null);
  const distanceHeadingRef = useRef<HTMLHeadingElement>(null);
  const distanceDescriptionRef = useRef<HTMLParagraphElement>(null);
  const distanceMapRef = useRef<HTMLDivElement>(null);
  const distanceDarkMapRef = useRef<HTMLDivElement>(null);
  const distanceGoogleMapsRef = useRef<{ light: google.maps.Map; dark: google.maps.Map } | null>(null);
  const paymentStatusPercentRef = useRef<HTMLElement>(null);
  const paymentStatusTitleRef = useRef<HTMLHeadingElement>(null);
  const paymentStatusDetailRef = useRef<HTMLParagraphElement>(null);
  const interestModalCloseRef = useRef<HTMLButtonElement>(null);
  const activeSectionRef = useRef("home");
  const snappingRef = useRef(false);
  const userScrollIntentRef = useRef(false);
  const scrollAnimationFrameRef = useRef<number | null>(null);
  const menuTransitionTimerRef = useRef<number | null>(null);
  const floorPlan = floorPlans[activeFloorPlan];
  useLayoutEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const onScroll = () => {
      const available = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      setMobileScrolled(window.scrollY > window.innerHeight * 0.72);
      setMobileProgress(Math.min((window.scrollY / available) * 100, 100));
      const marker = window.scrollY + window.innerHeight * 0.28;
      const sections = [...document.querySelectorAll<HTMLElement>(".mobile-public section[id], .mobile-public footer[id]")];
      const current = sections.reduce((nearest, section) => section.offsetTop <= marker ? section : nearest, sections[0]);
      if (current?.id && current.id !== activeSectionRef.current) {
        activeSectionRef.current = current.id;
        setActiveSection(current.id);
      }
    };
    const root = document.querySelector(".mobile-public");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target as HTMLElement;
        element.classList.add("is-visible");
      });
    }, { rootMargin: "8% 0px 0px", threshold: 0.01 });
    root?.querySelectorAll<HTMLElement>(".mobile-section").forEach((section) => observer.observe(section));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile || !paymentPlaying) return;
    const timer = window.setInterval(() => {
      setSelectedPaymentMilestone((current) => {
        if (current >= paymentMilestones.length - 1) {
          setPaymentPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [isMobile, paymentPlaying]);

  useEffect(() => {
    if (!interestModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInterestModalOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    window.requestAnimationFrame(() => interestModalCloseRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [interestModalOpen]);

  const animateScrollTo = (top: number, duration: number, onComplete?: () => void) => {
    if (scrollAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollAnimationFrameRef.current);
    }

    const start = window.scrollY;
    const distance = top - start;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || Math.abs(distance) < 2) {
      window.scrollTo(0, top);
      scrollAnimationFrameRef.current = null;
      onComplete?.();
      return;
    }

    const startedAt = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min((now - startedAt) / duration, 1);
      const eased = elapsed < 0.5
        ? 4 * elapsed * elapsed * elapsed
        : 1 - Math.pow(-2 * elapsed + 2, 3) / 2;
      window.scrollTo(0, start + distance * eased);
      if (elapsed < 1) {
        scrollAnimationFrameRef.current = window.requestAnimationFrame(tick);
      } else {
        scrollAnimationFrameRef.current = null;
        onComplete?.();
      }
    };
    scrollAnimationFrameRef.current = window.requestAnimationFrame(tick);
  };

  const navigateFromMenu = (progress: number, targetId?: string) => {
    if (menuTransitioning) return;

    if (window.matchMedia("(max-width: 720px)").matches) {
      const section = navigationSections.find((item) => item.id === targetId) ?? navigationSections.reduce((nearest, item) =>
        Math.abs(item.progress - progress) < Math.abs(nearest.progress - progress) ? item : nearest
      );
      setMenuOpen(false);
      setMenuTransitioning(true);
      menuTransitionTimerRef.current = window.setTimeout(() => {
        const target = document.querySelector<HTMLElement>(`.mobile-public #${section.id}`);
        document.body.style.overflow = "";
        if (target) {
          const headerOffset = 63;
          target.classList.add("is-visible");
          const previousScrollBehavior = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = "auto";
          window.scrollTo(0, target.offsetTop - headerOffset);
          window.requestAnimationFrame(() => {
            document.documentElement.style.scrollBehavior = previousScrollBehavior;
          });
        }
        setMenuTransitioning(false);
        menuTransitionTimerRef.current = null;
      }, 500);
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;

    setMenuOpen(false);
    setMenuTransitioning(true);
    userScrollIntentRef.current = false;
    snappingRef.current = true;

    if (scrollAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollAnimationFrameRef.current);
      scrollAnimationFrameRef.current = null;
    }

    menuTransitionTimerRef.current = window.setTimeout(() => {
      const stageTop = window.scrollY + stage.getBoundingClientRect().top;
      window.scrollTo(0, stageTop + progress * window.innerHeight);
      setMenuTransitioning(false);
      menuTransitionTimerRef.current = null;
      window.requestAnimationFrame(() => {
        snappingRef.current = false;
        window.dispatchEvent(new Event("scroll"));
      });
    }, 500);
  };

  const selectCommunitySlide = (index: number) => {
    const nextIndex = (index + communitySceneData.length) % communitySceneData.length;
    communitySlideRef.current = nextIndex;
    setActiveCommunitySlide(nextIndex);
  };

  const selectPaymentMilestone = (index: number) => {
    const milestone = paymentMilestones[index];
    setSelectedPaymentMilestone(index);
    if (paymentStatusPercentRef.current) paymentStatusPercentRef.current.textContent = `${milestone.percent}%`;
    if (paymentStatusTitleRef.current) paymentStatusTitleRef.current.textContent = milestone.title;
    if (paymentStatusDetailRef.current) paymentStatusDetailRef.current.textContent = milestone.detail;
  };

  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const resetScroll = () => window.scrollTo(0, 0);
    window.addEventListener("beforeunload", resetScroll);
    return () => {
      window.removeEventListener("beforeunload", resetScroll);
      if (scrollAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollAnimationFrameRef.current);
      }
      if (menuTransitionTimerRef.current !== null) {
        window.clearTimeout(menuTransitionTimerRef.current);
      }
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroSlides(({ current }) => ({
        previous: current,
        current: (current + 1) % heroScenes.length
      }));
    }, 10000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || menuTransitioning ? "hidden" : "";
    const closeMenu = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeMenu);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeMenu);
    };
  }, [menuOpen, menuTransitioning]);

  useEffect(() => {
    if (isMobile) return;
    const stage = stageRef.current;
    if (!stage) return;

    let settleTimer = 0;

    const markUserScroll = (event?: Event) => {
      if (event?.defaultPrevented) return;
      if (event?.target instanceof Element && event.target.closest(".community-carousel")) return;
      if (scrollAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollAnimationFrameRef.current);
        scrollAnimationFrameRef.current = null;
      }
      snappingRef.current = false;
      userScrollIntentRef.current = true;
    };

    const markKeyboardScroll = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
        markUserScroll();
      }
    };

    const settleScroll = () => {
      if (menuOpen || snappingRef.current || !userScrollIntentRef.current) return;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        const stageTop = window.scrollY + stage.getBoundingClientRect().top;
        const rawProgress = (window.scrollY - stageTop) / Math.max(window.innerHeight, 1);
        if (rawProgress < -0.05 || rawProgress > 35.55) return;
        if (rollbackFreeRanges.some(([start, end]) => rawProgress > start && rawProgress < end)) {
          userScrollIntentRef.current = false;
          return;
        }

        const target = scrollSnapProgress.reduce((nearest, point) =>
          Math.abs(point - rawProgress) < Math.abs(nearest - rawProgress) ? point : nearest
        );
        if (Math.abs(target - rawProgress) < 0.012) {
          userScrollIntentRef.current = false;
          return;
        }

        userScrollIntentRef.current = false;
        snappingRef.current = true;
        animateScrollTo(stageTop + target * window.innerHeight, 1450, () => {
          snappingRef.current = false;
        });
      }, 180);
    };

    window.addEventListener("scroll", settleScroll, { passive: true });
    window.addEventListener("wheel", markUserScroll, { passive: true });
    window.addEventListener("touchstart", markUserScroll, { passive: true });
    window.addEventListener("keydown", markKeyboardScroll);
    return () => {
      window.clearTimeout(settleTimer);
      window.removeEventListener("scroll", settleScroll);
      window.removeEventListener("wheel", markUserScroll);
      window.removeEventListener("touchstart", markUserScroll);
      window.removeEventListener("keydown", markKeyboardScroll);
    };
  }, [menuOpen, isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const mapElement = distanceMapRef.current;
    const darkMapElement = distanceDarkMapRef.current;
    if (!mapElement || !darkMapElement) {
      return;
    }

    let cancelled = false;
    let mapInstance: google.maps.Map | null = null;
    let darkMapInstance: google.maps.Map | null = null;
    let overlays: google.maps.OverlayView[] = [];
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const loadGoogleMaps = () => {
      if (window.google?.maps) {
        return Promise.resolve();
      }

      const existingScript = document.querySelector<HTMLScriptElement>("script[data-seven-google-maps]");
      if (existingScript) {
        return new Promise<void>((resolve, reject) => {
          existingScript.addEventListener("load", () => resolve(), { once: true });
          existingScript.addEventListener("error", () => reject(new Error("Google Maps failed to load")), { once: true });
        });
      }

      return new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.dataset.sevenGoogleMaps = "true";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&loading=async`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Google Maps failed to load"));
        document.head.appendChild(script);
      });
    };

    void loadGoogleMaps()
      .then(() => {
        if (cancelled || !distanceMapRef.current || !distanceDarkMapRef.current) {
          return;
        }

        class DistancePlaceOverlay extends google.maps.OverlayView {
          private anchor: HTMLDivElement | null = null;

          constructor(
            private readonly position: google.maps.LatLng,
            private readonly place: (typeof distancePlaces)[number]
          ) {
            super();
          }

          onAdd() {
            const anchor = document.createElement("div");
            anchor.className = "distance-place-anchor";
            anchor.innerHTML = `<div class="distance-place" data-reveal="${this.place.reveal}"><i></i><span>${this.place.name}</span><small>${this.place.minutes}</small></div>`;
            this.anchor = anchor;
            this.getPanes()?.overlayLayer.appendChild(anchor);
          }

          draw() {
            const point = this.getProjection().fromLatLngToDivPixel(this.position);
            if (!point || !this.anchor) {
              return;
            }
            this.anchor.style.transform = `translate3d(${point.x - 4}px, ${point.y - 4}px, 0)`;
          }

          onRemove() {
            this.anchor?.remove();
            this.anchor = null;
          }
        }

        class DistanceAreaOverlay extends google.maps.OverlayView {
          private anchor: HTMLDivElement | null = null;

          constructor(
            private readonly position: google.maps.LatLng,
            private readonly label: string
          ) {
            super();
          }

          onAdd() {
            const anchor = document.createElement("div");
            anchor.className = "distance-area-label";
            anchor.textContent = this.label;
            this.anchor = anchor;
            this.getPanes()?.overlayLayer.appendChild(anchor);
          }

          draw() {
            const point = this.getProjection().fromLatLngToDivPixel(this.position);
            if (!point || !this.anchor) {
              return;
            }
            this.anchor.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
          }

          onRemove() {
            this.anchor?.remove();
            this.anchor = null;
          }
        }

        const sharedMapOptions: google.maps.MapOptions = {
          center: residenceCoordinates,
          zoom: 14.5,
          isFractionalZoomEnabled: true,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: "none",
          keyboardShortcuts: false
        };

        darkMapInstance = new google.maps.Map(distanceDarkMapRef.current, {
          ...sharedMapOptions,
          backgroundColor: "#050606",
          styles: [
            { elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
            { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
            { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#050606" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#414440" }] },
            { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#656963" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c0f0f" }] }
          ]
        });

        mapInstance = new google.maps.Map(distanceMapRef.current, {
          ...sharedMapOptions,
          backgroundColor: "#f3f3ef",
          styles: [
            { elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
            { featureType: "administrative.country", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "administrative.province", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "administrative.neighborhood", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "administrative.land_parcel", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f3f3ef" }] },
            { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#b8bab6" }] },
            { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#969995" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#d8dcdb" }] }
          ]
        });
        distanceGoogleMapsRef.current = { light: mapInstance, dark: darkMapInstance };

        overlays = distancePlaces.map((place) => {
          const overlay = new DistancePlaceOverlay(new google.maps.LatLng(place.lat, place.lng), place);
          overlay.setMap(mapInstance);
          return overlay;
        });
        overlays.push(
          ...distanceAreaLabels.map((area) => {
            const overlay = new DistanceAreaOverlay(new google.maps.LatLng(area.lat, area.lng), area.name);
            overlay.setMap(mapInstance);
            return overlay;
          }),
          ...distanceAreaLabels.map((area) => {
            const overlay = new DistanceAreaOverlay(new google.maps.LatLng(area.lat, area.lng), area.name);
            overlay.setMap(darkMapInstance);
            return overlay;
          })
        );

        google.maps.event.addListenerOnce(mapInstance, "idle", () => {
          window.dispatchEvent(new Event("scroll"));
        });
      })
      .catch((error: unknown) => {
        console.error("Unable to initialize the distance map", error);
        mapElement.dataset.mapError = "true";
      });

    const refreshMap = () => {
      if (!mapInstance) {
        return;
      }
      google.maps.event.trigger(mapInstance, "resize");
      mapInstance.setCenter(residenceCoordinates);
      if (darkMapInstance) {
        google.maps.event.trigger(darkMapInstance, "resize");
        darkMapInstance.setCenter(residenceCoordinates);
      }
    };
    window.addEventListener("resize", refreshMap);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", refreshMap);
      overlays.forEach((overlay) => overlay.setMap(null));
      overlays = [];
      distanceGoogleMapsRef.current = null;
    };
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const carousel = communityCarouselRef.current;
    if (!carousel) {
      return;
    }

    let wheelTotal = 0;
    let wheelLocked = false;
    let unlockTimer = 0;

    const handleWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      const direction = Math.sign(delta);
      const current = communitySlideRef.current;
      const canChange = direction > 0 ? current < communitySceneData.length - 1 : direction < 0 && current > 0;

      if (!direction || !canChange) {
        wheelTotal = 0;
        return;
      }

      event.preventDefault();
      if (wheelLocked) {
        return;
      }

      wheelTotal += delta;
      if (Math.abs(wheelTotal) < 36) {
        return;
      }

      selectCommunitySlide(current + direction);
      wheelTotal = 0;
      wheelLocked = true;
      unlockTimer = window.setTimeout(() => {
        wheelLocked = false;
      }, 760);
    };

    carousel.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.clearTimeout(unlockTimer);
      carousel.removeEventListener("wheel", handleWheel);
    };
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const site = siteRef.current;
    const stage = stageRef.current;
    if (!site || !stage) {
      return;
    }

    let frame = 0;

    const updateFoldProgress = () => {
      frame = 0;
      const stageRect = stage.getBoundingClientRect();
      const mobileLayout = window.matchMedia("(max-width: 720px)").matches;
      const mastheadHeight = window.innerHeight * (mobileLayout ? 0.36 : 0.25);
      const apartmentImageHeight = window.innerHeight - mastheadHeight;
      const openingLeftNaturalWidth = apartmentImageHeight * (1123 / 721);
      const openingRightNaturalWidth = apartmentImageHeight * (600 / 741);
      const openingPairScale = Math.max(
        window.innerWidth / (openingLeftNaturalWidth + openingRightNaturalWidth),
        1
      );
      const openingLeftWidth = openingLeftNaturalWidth * openingPairScale;
      const openingRightWidth = openingRightNaturalWidth * openingPairScale;
      const captionImageRatioA = mobileLayout ? 0.76 : 0.82;
      const captionImageRatioB = mobileLayout ? 0.66 : 0.72;
      const rawProgress = Math.min(Math.max(-stageRect.top / Math.max(window.innerHeight, 1), 0), 35.5);
      const progress = Math.min(rawProgress, 1);
      const aboutProgress = Math.min(Math.max(rawProgress - 1, 0), 1);
      const aboutContentProgress = Math.min(Math.max((rawProgress - 1.82) / 0.18, 0), 1);
      const aboutPaperProgress = Math.min(Math.max((aboutProgress - 0.08) / 0.92, 0), 1);
      const manifestoProgress = Math.min(Math.max(rawProgress - 2, 0), 1);
      const moodEntryProgress = Math.min(Math.max(rawProgress - 3, 0), 1);
      const moodRightProgress = Math.min(Math.max((moodEntryProgress - 0.45) / 0.55, 0), 1);
      const moodHorizontalProgress = Math.min(Math.max((rawProgress - 4) / 3.4, 0), 1);
      const apartmentsMastheadProgress = Math.min(Math.max((rawProgress - 3.45) / 0.35, 0), 1);
      const moodClosingProgress = Math.min(Math.max((rawProgress - 7.4) / 0.4, 0), 1);
      const moodClosingEased = moodClosingProgress * moodClosingProgress * (3 - 2 * moodClosingProgress);
      const galleryRevealProgress = Math.min(Math.max(rawProgress - 7.8, 0), 1);
      const galleryScrollProgress = Math.min(Math.max((rawProgress - 8.8) / 5.5, 0), 1);
      const exteriorRevealProgress = Math.min(Math.max(rawProgress - 14.3, 0), 1);
      const amenitiesRevealProgress = Math.min(Math.max(rawProgress - 15.3, 0), 1);
      const amenitiesSequenceProgress = Math.min(Math.max((rawProgress - 16.3) / 5, 0), 1);
      const communityRevealProgress = Math.min(Math.max(rawProgress - 21.3, 0), 1);
      const distanceRevealProgress = Math.min(Math.max(rawProgress - 22.3, 0), 1);
      const distanceTypingProgress = distanceRevealProgress;
      const distanceMapProgress = Math.min(Math.max((rawProgress - 23.3) / 1.2, 0), 1);
      const distanceMarkerProgress = Math.min(Math.max((rawProgress - 24.5) / 0.5, 0), 1);
      const distanceLightProgress = Math.min(Math.max((rawProgress - 25.5) / 2, 0), 1);
      const distanceZoomProgress = distanceLightProgress;
      const floorPlanRevealProgress = Math.min(Math.max(rawProgress - 27.5, 0), 1);
      const paymentRevealProgress = Math.min(Math.max(rawProgress - 28.5, 0), 1);
      const paymentSequenceProgress = Math.min(Math.max((rawProgress - 29.5) / 5, 0), 1);
      const footerRevealProgress = Math.min(Math.max(rawProgress - 34.5, 0), 1);
      const nextActiveSection = navigationSections.reduce((nearest, section) =>
        Math.abs(section.progress - rawProgress) < Math.abs(nearest.progress - rawProgress) ? section : nearest
      ).id;
      if (nextActiveSection !== activeSectionRef.current) {
        activeSectionRef.current = nextActiveSection;
        setActiveSection(nextActiveSection);
      }
      const typingProgress = Math.min(Math.max((manifestoProgress - 0.48) / 0.52, 0), 1);
      const manifestoTextOpacity = Math.min(Math.max((manifestoProgress - 0.46) / 0.08, 0), 1);
      const logoDarkProgress = Math.min(Math.max((aboutProgress - 0.68) / 0.18, 0), 1);
      const logoTopSpacing = Math.min(Math.max(window.innerWidth * 0.03, 28), 40);
      const logoTravel = window.innerHeight - (Math.min(Math.max(window.innerWidth * 0.1, 86), 148) + logoTopSpacing);

      site.style.setProperty("--fold-progress", progress.toFixed(4));
      site.style.setProperty("--video-y", `${(1 - progress) * 100}%`);
      site.style.setProperty("--video-lock-y", `${(progress - 1) * 100}%`);
      site.style.setProperty("--about-y", `${(1 - aboutProgress) * 100}%`);
      site.style.setProperty("--about-lock-y", `${(aboutProgress - 1) * 100}%`);
      site.style.setProperty("--about-paper-opacity", aboutPaperProgress.toFixed(4));
      site.style.setProperty("--about-paper-inset", `${((1 - aboutPaperProgress) * 100).toFixed(2)}%`);
      site.style.setProperty("--about-content-opacity", aboutContentProgress.toFixed(4));
      site.style.setProperty("--about-content-y", `${(1 - aboutContentProgress) * 18}px`);
      site.style.setProperty("--manifesto-y", `${(1 - manifestoProgress) * 100}%`);
      site.style.setProperty("--manifesto-lock-y", `${(manifestoProgress - 1) * 100}%`);
      site.style.setProperty("--manifesto-progress", manifestoProgress.toFixed(4));
      site.style.setProperty("--manifesto-text-opacity", manifestoTextOpacity.toFixed(4));
      site.style.setProperty("--mood-left-y", `${(1 - moodEntryProgress) * 100}%`);
      site.style.setProperty("--mood-right-y", `${(1 - moodRightProgress) * 100}%`);
      site.style.setProperty("--mood-entry-opacity", Math.min(moodEntryProgress * 4, 1).toFixed(4));
      site.style.setProperty("--apartments-image-height", `${apartmentImageHeight.toFixed(2)}px`);
      site.style.setProperty("--mood-opening-left-width", `${openingLeftWidth.toFixed(2)}px`);
      site.style.setProperty("--mood-opening-right-width", `${openingRightWidth.toFixed(2)}px`);
      site.style.setProperty("--mood-opening-width", `${(openingLeftWidth + openingRightWidth).toFixed(2)}px`);
      site.style.setProperty("--mood-portrait-width", `${(apartmentImageHeight * (600 / 741)).toFixed(2)}px`);
      site.style.setProperty("--mood-step-a-width", `${(apartmentImageHeight * captionImageRatioA * (600 / 741)).toFixed(2)}px`);
      site.style.setProperty("--mood-step-b-width", `${(apartmentImageHeight * captionImageRatioB * (600 / 741)).toFixed(2)}px`);
      site.style.setProperty("--mood-step-a-image-height", `${(apartmentImageHeight * captionImageRatioA).toFixed(2)}px`);
      site.style.setProperty("--mood-step-b-image-height", `${(apartmentImageHeight * captionImageRatioB).toFixed(2)}px`);
      site.style.setProperty("--mood-step-a-caption-height", `${(apartmentImageHeight * (1 - captionImageRatioA)).toFixed(2)}px`);
      site.style.setProperty("--mood-step-b-caption-height", `${(apartmentImageHeight * (1 - captionImageRatioB)).toFixed(2)}px`);
      site.style.setProperty("--mood-final-width", `${(apartmentImageHeight * (1123 / 687)).toFixed(2)}px`);
      site.style.setProperty("--mood-closing-full-width", `${(window.innerHeight * (1123 / 687)).toFixed(2)}px`);
      site.style.setProperty("--apartments-masthead-opacity", apartmentsMastheadProgress.toFixed(4));
      site.style.setProperty("--mood-closing-opacity", rawProgress >= 7.4 ? "1" : "0");
      site.style.setProperty("--mood-closing-clip-top", `${((1 - moodClosingEased) * mastheadHeight).toFixed(2)}px`);
      const moodClosingCoverHeight = Math.max(window.innerHeight, window.innerWidth * (687 / 1123));
      site.style.setProperty(
        "--mood-closing-bg-height",
        `${(apartmentImageHeight + (moodClosingCoverHeight - apartmentImageHeight) * moodClosingEased).toFixed(2)}px`
      );

      const moodTrack = moodTrackRef.current;
      if (moodTrack) {
        const trackTravel = Math.max(moodTrack.scrollWidth - window.innerWidth, 0);
        site.style.setProperty("--mood-track-x", `${(-trackTravel * moodHorizontalProgress).toFixed(2)}px`);

        moodTrack
          .querySelectorAll<HTMLElement>(".mood-panel-captioned, .mood-panel-editorial")
          .forEach((panel) => {
            const rect = panel.getBoundingClientRect();
            const visibleWidth = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0));
            const visibleRatio = rect.width > 0 ? visibleWidth / rect.width : 0;
            const captionVisibility = Math.min(Math.max((visibleRatio - 0.38) / 0.34, 0), 1);
            panel.style.setProperty("--mood-caption-opacity", captionVisibility.toFixed(4));
          });
      }
      site.style.setProperty("--gallery-y", `${(1 - galleryRevealProgress) * 100}%`);
      site.style.setProperty("--gallery-lock-y", `${(galleryRevealProgress - 1) * 100}%`);
      site.style.setProperty("--exterior-x", `${(1 - exteriorRevealProgress) * 100}%`);
      site.style.setProperty("--exterior-lock-x", `${(exteriorRevealProgress - 1) * 100}%`);
      site.style.setProperty("--amenities-y", `${(1 - amenitiesRevealProgress) * 100}%`);
      site.style.setProperty("--amenities-lock-y", `${(amenitiesRevealProgress - 1) * 100}%`);
      site.style.setProperty("--amenities-progress", amenitiesSequenceProgress.toFixed(4));
      site.style.setProperty("--community-y", `${(1 - communityRevealProgress) * 100}%`);
      site.style.setProperty("--community-lock-y", `${(communityRevealProgress - 1) * 100}%`);
      site.style.setProperty("--distance-x", `${(1 - distanceRevealProgress) * 100}%`);
      site.style.setProperty("--distance-lock-x", `${(distanceRevealProgress - 1) * 100}%`);
      site.style.setProperty("--distance-copy-x", `${(-distanceMapProgress * 112).toFixed(2)}%`);
      const distanceMapStart = mobileLayout ? 88 : 50;
      site.style.setProperty("--distance-map-x", `${((1 - distanceMapProgress) * distanceMapStart).toFixed(2)}%`);
      site.style.setProperty("--distance-marker-progress", distanceMarkerProgress.toFixed(4));
      site.style.setProperty("--distance-light-radius", `${(distanceLightProgress * 145).toFixed(2)}vmax`);
      site.style.setProperty("--distance-light-progress", distanceLightProgress.toFixed(4));
      site.style.setProperty("--distance-light-theme", distanceLightProgress > 0 ? "1" : "0");
      site.style.setProperty("--distance-area-opacity", (0.32 + (1 - distanceLightProgress) * 0.68).toFixed(4));
      site.style.setProperty("--floor-plan-y", `${(1 - floorPlanRevealProgress) * 100}%`);
      site.style.setProperty("--floor-plan-lock-y", `${(floorPlanRevealProgress - 1) * 100}%`);
      site.style.setProperty("--payment-y", `${(1 - paymentRevealProgress) * 100}%`);
      site.style.setProperty("--payment-lock-y", `${(paymentRevealProgress - 1) * 100}%`);

      const paymentStep = paymentSequenceProgress * paymentMilestones.length;
      const paymentStepIndex = Math.min(Math.floor(paymentStep), paymentMilestones.length - 1);
      const paymentStepFraction = Math.min(paymentStep - paymentStepIndex, 1);
      const paymentTotals = paymentMilestones.reduce<number[]>((totals, milestone) => {
        totals.push((totals.at(-1) ?? 0) + milestone.percent);
        return totals;
      }, []);
      const paymentBefore = paymentStepIndex === 0 ? 0 : paymentTotals[paymentStepIndex - 1];
      const paymentPaid = paymentBefore + paymentMilestones[paymentStepIndex].percent * paymentStepFraction;
      site.style.setProperty("--payment-paid", `${paymentPaid.toFixed(2)}%`);
      site.style.setProperty("--payment-mark-x", `${paymentPaid.toFixed(2)}%`);
      site.style.setProperty("--payment-mark-rotation", `${(paymentSequenceProgress * 1080).toFixed(2)}deg`);
      site.style.setProperty("--footer-x", `${(1 - footerRevealProgress) * 100}%`);
      site.style.setProperty("--footer-lock-x", `${(footerRevealProgress - 1) * 100}%`);

      const paymentStatus = paymentMilestones[paymentStepIndex];
      if (paymentStatusPercentRef.current) paymentStatusPercentRef.current.textContent = `${paymentStatus.percent}%`;
      if (paymentStatusTitleRef.current) paymentStatusTitleRef.current.textContent = paymentStatus.title;
      if (paymentStatusDetailRef.current) paymentStatusDetailRef.current.textContent = paymentStatus.detail;
      site.querySelectorAll<HTMLElement>(".payment-milestone").forEach((milestone, index) => {
        const revealAt = index / paymentMilestones.length;
        const milestoneProgress = Math.min(Math.max((paymentSequenceProgress - revealAt) * paymentMilestones.length, 0), 1);
        milestone.style.setProperty("--milestone-progress", milestoneProgress.toFixed(4));
        milestone.dataset.active = index === paymentStepIndex ? "true" : "false";
      });

      const distanceMaps = distanceGoogleMapsRef.current;
      if (distanceMaps) {
        const easedZoomProgress = 1 - Math.pow(1 - distanceZoomProgress, 3);
        const camera = {
          center: residenceCoordinates,
          zoom: 14.5 - easedZoomProgress * 3.5
        };
        distanceMaps.light.moveCamera(camera);
        distanceMaps.dark.moveCamera(camera);
      }

      const amenityVisuals = site.querySelectorAll<HTMLElement>(".amenity-visual");
      amenityVisuals.forEach((visual, index) => {
        const transitionCount = amenitySceneData.length - 1;
        const localProgress = index === 0 ? 1 : Math.min(Math.max(amenitiesSequenceProgress * transitionCount - (index - 1), 0), 1);
        visual.style.setProperty("--amenity-wipe", `${((1 - localProgress) * 100).toFixed(2)}%`);
      });
      const activeAmenityScene = Math.min(
        Math.round(amenitiesSequenceProgress * (amenitySceneData.length - 1)),
        amenitySceneData.length - 1
      );
      site.querySelectorAll<HTMLElement>(".amenity-grid-item").forEach((item) => {
        item.dataset.active = Number(item.dataset.scene) === activeAmenityScene ? "true" : "false";
      });

      const headingCharacters = distanceHeadingRef.current?.querySelectorAll<HTMLElement>(".distance-character");
      const descriptionCharacters = distanceDescriptionRef.current?.querySelectorAll<HTMLElement>(".distance-character");
      const headingTypingProgress = Math.min(distanceTypingProgress / 0.36, 1);
      const descriptionTypingProgress = Math.min(Math.max((distanceTypingProgress - 0.34) / 0.66, 0), 1);
      [
        { characters: headingCharacters, progress: headingTypingProgress },
        { characters: descriptionCharacters, progress: descriptionTypingProgress }
      ].forEach(({ characters, progress: characterProgress }) => {
        if (!characters?.length) {
          return;
        }
        const activeIndex = characterProgress >= 0.999 ? characters.length : Math.floor(characterProgress * characters.length);
        characters.forEach((character, index) => {
          character.dataset.state = index < activeIndex ? "revealed" : index === activeIndex ? "active" : "hidden";
        });
      });

      site.querySelectorAll<HTMLElement>(".distance-place").forEach((place) => {
        const revealAt = Number(place.dataset.reveal ?? 0);
        const placeProgress = Math.min(Math.max((distanceLightProgress - revealAt) / 0.08, 0), 1);
        place.style.setProperty("--place-progress", placeProgress.toFixed(4));
      });

      const galleryViewport = galleryViewportRef.current;
      const galleryTrack = galleryTrackRef.current;
      if (galleryViewport && galleryTrack) {
        const galleryTravel = Math.max(galleryTrack.scrollHeight - galleryViewport.clientHeight, 0);
        site.style.setProperty("--gallery-track-y", `${(-galleryTravel * galleryScrollProgress).toFixed(2)}px`);
      }
      site.style.setProperty("--gallery-progress", galleryScrollProgress.toFixed(4));
      site.style.setProperty("--gallery-mark-x", `${(galleryScrollProgress * 100).toFixed(2)}%`);
      site.style.setProperty("--gallery-mark-rotation", `${(galleryScrollProgress * 720).toFixed(2)}deg`);
      if (galleryPercentRef.current) {
        galleryPercentRef.current.textContent = `${Math.round(galleryScrollProgress * 100)}%`;
      }
      site.style.setProperty("--logo-y", `${progress * -logoTravel}px`);
      site.style.setProperty("--logo-scale", (1 - progress * 0.22).toFixed(4));
      const moodLogoLightProgress = Math.min(Math.max((moodHorizontalProgress - 0.86) / 0.12, 0), 1);
      const galleryLogoLightProgress = Math.min(Math.max((galleryRevealProgress - 0.86) / 0.14, 0), 1);
      const distanceDarkAtLogo = Math.min(Math.max((distanceRevealProgress - 0.82) / 0.18, 0), 1);
      const distanceLightAtLogo = Math.min(Math.max((distanceLightProgress - 0.86) / 0.14, 0), 1);
      const paymentDarkAtLogo = Math.min(Math.max((paymentRevealProgress - 0.82) / 0.18, 0), 1);
      const communityLogoOpacity = Math.max(
        logoDarkProgress * (1 - Math.max(moodLogoLightProgress, galleryLogoLightProgress)),
        communityRevealProgress
      );
      site.style.setProperty(
        "--logo-dark-opacity",
        (Math.max(communityLogoOpacity * (1 - distanceDarkAtLogo), distanceLightAtLogo) * (1 - paymentDarkAtLogo)).toFixed(4)
      );

      const characters = manifestoTextRef.current?.querySelectorAll<HTMLElement>(".manifesto-character");
      if (characters?.length) {
        const activeIndex = typingProgress >= 0.999 ? characters.length : Math.floor(typingProgress * characters.length);
        characters.forEach((character, index) => {
          character.dataset.state = index < activeIndex ? "revealed" : index === activeIndex ? "active" : "hidden";
        });
      }
    };

    const requestUpdate = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(updateFoldProgress);
      }
    };

    updateFoldProgress();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [isMobile]);

  if (isMobile) {
    return (
      <MobilePublicSite
        preview={preview}
        heroScenes={heroScenes}
        heroIndex={heroSlides.current}
        onHeroChange={(index) => setHeroSlides(({ current }) => ({ previous: current, current: index }))}
        heroEyebrow={text("hero", "eyebrow", "Meydan Horizon")}
        heroHeadline={text("hero", "headline", "luxury in balance")}
        heroBody={text("hero", "body", "Stillness and energy. Privacy and connection. Retreat and play. The home that offers you both.")}
        heroVideo={media("hero", "media", "/assets/hero/video-1788257574774.mp4")}
        aboutImage={media("about", "media", "/assets/hero/about-building-cleanup.png")}
        aboutHeadline={text("about", "headline", "the residences")}
        aboutBody={text("about", "body", "The city, within reach. Meydan Horizon keeps the city close. At home, water, greenery and open views reveal a calmer side of Dubai.")}
        manifesto={manifestoCopy}
        apartmentsHeadline={text("apartments", "headline", "more room, crafted with intent.")}
        apartmentsBody={text("apartments", "body", "One-, two- and three-bedroom residences built around space, function and ease.")}
        apartmentScenes={apartmentScenes}
        galleryHeadline={text("gallery", "headline", "gallery")}
        galleryScenes={exteriorGalleryScenes}
        exteriorImage={media("exterior", "media", "/assets/hero/seven-x-seven-facade-evening.webp")}
        exteriorHeadline={text("exterior", "headline", "Discreetly different.")}
        exteriorBody={text("exterior", "body", "Behind its composed allure, seven x seven residences Meydan Horizon extends everyday life beyond the home, revealing a connected sequence of wellness, social and outdoor spaces for every side of you.")}
        amenitiesHeadline={text("amenities", "headline", "amenities")}
        amenityScenes={amenitySceneData}
        amenityLabels={amenityLabels}
        activeAmenity={activeAmenity}
        onAmenityChange={setActiveAmenity}
        communityHeadline={text("community", "headline", "mohammed bin rashid city")}
        communityBody={text("community", "body", "MBR City brings together residential calm, new infrastructure, open landscapes and fast access to Dubai's central destinations.")}
        communityScenes={communitySceneData}
        activeCommunity={activeCommunitySlide}
        onCommunityChange={selectCommunitySlide}
        locationHeadline={distanceHeadingCopy}
        locationBody={distanceDescriptionCopy}
        distancePlaces={distancePlaces}
        floorPlan={floorPlan}
        floorPlanKey={activeFloorPlan}
        onFloorPlanChange={setActiveFloorPlan}
        paymentHeadline={text("payment", "headline", "a considered path to ownership")}
        paymentBody={text("payment", "body", "A structured payment plan from reservation through handover, aligned with construction progress.")}
        milestones={paymentMilestones}
        selectedMilestone={selectedPaymentMilestone}
        onMilestoneChange={setSelectedPaymentMilestone}
        paymentPlaying={paymentPlaying}
        onTogglePayment={() => setPaymentPlaying((playing) => !playing)}
        footerBody={text("footer", "body", "seven x seven sees luxury as the freedom to live your way.")}
        footerCopyright={text("footer", "copyright", "Copyright 2026 Kasumigaseki Properties Development")}
        registerHeadline={text("register", "headline", "make it yours")}
        registerBody={text("register", "body", "Explore availability, floor plans and purchase details with our team.")}
        interestOptions={interestOptions}
        consentCopy={consentCopy}
        primaryCta={primaryCta}
        secondaryCta={secondaryCta}
        submitCta={submitCta}
        onSubmitLead={submitLead}
        leadSubmission={leadSubmission}
        navigation={navigationSections}
        activeSection={activeSection}
        menuOpen={menuOpen}
        menuTransitioning={menuTransitioning}
        onMenuToggle={() => setMenuOpen((open) => !open)}
        onNavigate={navigateFromMenu}
        modalOpen={interestModalOpen}
        onModalOpen={() => setInterestModalOpen(true)}
        onModalClose={() => setInterestModalOpen(false)}
        mobileScrolled={mobileScrolled}
        mobileProgress={mobileProgress}
        lightbox={mobileLightbox}
        onLightbox={setMobileLightbox}
      />
    );
  }

  return (
    <main className={`fresh-site intro-active${preview ? " is-cms-preview" : ""}`} ref={siteRef}>
      <div className="hero-logo-flight" aria-label="seven x seven">
        <div className="hero-logo-shell">
          <img className="hero-logo-image hero-logo-image-light" src="/assets/brand/logo-stacked-white.png" alt="" />
          <img className="hero-logo-image hero-logo-image-dark" src="/assets/brand/logo-stacked-black.png" alt="" />
        </div>
      </div>

      <button
        className="site-menu-toggle"
        type="button"
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={menuOpen}
        aria-controls="site-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>

      <div className={`site-menu${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
        <img className="site-menu-brand" src="/assets/brand/logo-stacked-white.png" alt="seven x seven" />
        <nav id="site-navigation" aria-label="Sections">
          <p>explore the residences</p>
          {navigationSections.map((section, index) => (
            <a
              className={activeSection === section.id ? "is-active" : ""}
              href={`#${section.id}`}
              tabIndex={menuOpen ? 0 : -1}
              aria-current={activeSection === section.id ? "location" : undefined}
              onClick={(event) => {
                event.preventDefault();
                navigateFromMenu(section.progress);
              }}
              key={section.id}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
               <strong>{section.label}</strong>
            </a>
          ))}
        </nav>
      </div>

      {menuTransitioning ? (
        <div className="menu-anchor-loader" role="status" aria-live="polite" aria-label="Opening selected section">
          <img src="/assets/brand/s-mark-white.png" alt="" />
        </div>
      ) : null}

      {interestModalOpen ? (
        <div
          className="interest-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="interest-modal-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setInterestModalOpen(false);
          }}
        >
          <div className="interest-modal-media" aria-hidden="true" />
          <div className="interest-modal-card">
            <button
              className="interest-modal-close"
              type="button"
              aria-label="Close registration form"
              onClick={() => setInterestModalOpen(false)}
              ref={interestModalCloseRef}
            >
              <X aria-hidden="true" />
            </button>
            <form className="interest-form" onSubmit={(event) => submitLead(event, "Register modal")}>
              <p>seven x seven residences</p>
               <h2 id="interest-modal-title">{text("register", "headline", "make it yours")}</h2>
               <p>{text("register", "body", "Explore availability, floor plans and purchase details with our team.")}</p>
               <input type="text" name="FullName" placeholder="Full Name" aria-label="Full Name" required />
               <input className="form-honeypot" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <div className="interest-phone-field">
                <button type="button" aria-label="Change country code">UAE</button>
                <input type="tel" name="PhoneNumber" placeholder="+971 123456789" aria-label="Phone Number" required />
              </div>
              <input type="email" name="Email" placeholder="Email Address" aria-label="Email Address" required />
              <select name="TypeOfLead" aria-label="I am interested in" defaultValue="project-information">
                 {interestOptions.map((option, index) => <option value={`interest-${index}`} key={option}>{option}</option>)}
              </select>
               <button className="interest-submit everly-cta" type="submit" disabled={leadSubmission.source === "Register modal" && leadSubmission.state === "submitting"}>{leadSubmission.source === "Register modal" && leadSubmission.state === "submitting" ? "sending" : submitCta}</button>
              {leadSubmission.source === "Register modal" && leadSubmission.state === "success" ? <small role="status">Thank you. Your enquiry has been received.</small> : null}
              {leadSubmission.source === "Register modal" && leadSubmission.state === "error" ? <small role="alert">We could not submit your enquiry. Please try again.</small> : null}
              <small>
                 {consentCopy} <a href="/privacy-policy">privacy policy</a>.
              </small>
            </form>
          </div>
        </div>
      ) : null}

      <div className="scroll-stage" ref={stageRef}>
        <div className="stage-sticky">
          <div className="intro-loader" aria-hidden="true">
            <div className="intro-loader-mark">
              <img src="/assets/brand/s-mark-white.png" alt="" />
            </div>
            <img className="intro-loader-facade" src="/assets/hero/sxs%20without%20bg.png" alt="" />
          </div>

          <section className="fresh-hero" id="home" aria-label="seven x seven residences facade reveal">
            <div className="fresh-hero-gallery">
              {heroScenes.map((image, index) => (
                <img
                  key={image.src}
                  className={`fresh-hero-image${index === heroSlides.current ? " is-active" : ""}${index === heroSlides.previous ? " is-previous" : ""}`}
                  src={image.src}
                  alt={image.alt}
                  style={
                    {
                      "--gallery-position": image.position
                    } as CSSProperties
                  }
                />
              ))}
            </div>
            <div className="hero-settle-content">
              <div className="hero-intro-copy">
                 <p className="hero-intro-kicker">{text("hero", "eyebrow", "Meydan Horizon")}</p>
                 <h1>{text("hero", "headline", "luxury in balance")}</h1>
                 <p className="hero-intro-note">{text("hero", "body", "Stillness and energy. Privacy and connection. Retreat and play. The home that offers you both.")}</p>
              </div>
            </div>
          </section>

          <section className="next-fold-reveal" aria-label="seven x seven residences motion reveal">
            <video
              className="next-fold-video"
               src={media("hero", "media", "/assets/hero/video-1788257574774.mp4")}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
          </section>

          <section className="about-section about-reveal" id="about-sevenxseven" aria-label="About seven x seven residences">
            <div className="about-reveal-pattern" aria-hidden="true" />
            <img
              className="about-reveal-image"
               src={media("about", "media", "/assets/hero/about-building-cleanup.png")}
              alt="seven x seven residences facade set within a landscaped Meydan Horizon arrival"
            />
            <div className="about-reveal-shade" aria-hidden="true" />
            <div className="about-reveal-content">
              <div className="about-grid">
                <div className="about-heading">
                   <h2>{text("about", "headline", "the residences")}</h2>
                </div>
                <div className="about-copy">
                   <p>{text("about", "body", "The city, within reach. Meydan Horizon keeps the city close. At home, water, greenery and open views reveal a calmer side of Dubai.")}</p>
                  <button className="about-reveal-cta everly-cta" type="button" onClick={() => navigateFromMenu(4)}>
                     {secondaryCta}
                  </button>
                </div>
              </div>
              <div className="about-image-fact">
                <p>Available unit types</p>
                <h3>One-, two- and three-bedroom residences with penthouses</h3>
              </div>
            </div>
          </section>

          <section className="manifesto-reveal" aria-label="seven x seven private living statement">
            <div className="manifesto-surface" aria-hidden="true" />
          </section>
          <div className="manifesto-content">
             <p className="manifesto-text" ref={manifestoTextRef} aria-label={manifestoCopy}>
               {Array.from(manifestoCopy).map((character, index) => (
                <span className="manifesto-character" data-state="hidden" aria-hidden="true" key={`${character}-${index}`}>
                  {character}
                </span>
              ))}
            </p>
            <div className="manifesto-rule" aria-hidden="true">
              <span />
              <i>/</i>
              <span />
            </div>
          </div>

          <section className="mood-gallery" id="apartments" aria-label="seven x seven interior mood gallery">
            <header className="apartments-masthead">
              <h2>interiors</h2>
              <div className="apartments-masthead-copy">
                 <h3>{text("apartments", "headline", "more room, crafted with intent.")}</h3>
                 <p>{text("apartments", "body", "One-, two- and three-bedroom residences built around space, function and ease.")}</p>
                <button
                  className="everly-cta"
                  type="button"
                  onClick={() => navigateFromMenu(28.5, "floor-plans")}
                >
                   explore floor plans
                </button>
              </div>
            </header>
            <div className="mood-track" ref={moodTrackRef}>
              <div className="mood-panel mood-panel-opening">
                <div className="mood-opening-left">
                  <img
                    src="/assets/sxs%20apartments/1.png"
                    alt="seven x seven living room and private workspace"
                  />
                </div>
                <div className="mood-opening-right">
                  <img
                    src="/assets/sxs%20apartments/2.png"
                    alt="seven x seven living room with waterfront outlook"
                  />
                </div>
              </div>
              {apartmentScenes.map((image, index) => {
                const isTitlePanel = index === 1 || index === 4;
                const isEditorialPanel = index === 2 || index === 5;
                return (
                  <figure
                    className={`mood-panel mood-panel-portrait${isTitlePanel ? " mood-panel-short-a mood-panel-captioned" : ""}${isEditorialPanel ? " mood-panel-short-b mood-panel-editorial" : ""}`}
                    key={image.src}
                  >
                    <img src={image.src} alt={image.alt} />
                    {index === 1 ? <figcaption>Designed for your pace.</figcaption> : null}
                    {index === 4 ? <figcaption>Precision you can feel.</figcaption> : null}
                    {index === 2 ? (
                      <figcaption>
                        Slow mornings. Dinner with friends. A moment for yourself. Here, your home follows your rhythm. Comfort. Convenience. Craft. Nothing left behind.
                      </figcaption>
                    ) : null}
                    {index === 5 ? (
                      <figcaption>
                        Oak and walnut bring warmth. Travertine adds weight and texture. Soft light and tactile finishes wrap everything with quiet depth.
                      </figcaption>
                    ) : null}
                  </figure>
                );
              })}
              <figure className="mood-panel mood-panel-closing">
                <img
                  src="/assets/sxs%20apartments/10.png"
                  alt="seven x seven residents lounge"
                />
              </figure>
            </div>
            <div className="mood-closing-wipe" aria-hidden="true" />
          </section>

          <section className="vertical-gallery" id="gallery" aria-label="seven x seven residences gallery">
            <div className="vertical-gallery-shell">
              <aside className="vertical-gallery-rail">
                <div className="vertical-gallery-title">
                   <h2>{text("gallery", "headline", "gallery")}</h2>
                   <p>{text("gallery", "note", "see the balance")}</p>
                  <div className="vertical-gallery-progress" aria-hidden="true">
                    <span className="vertical-gallery-progress-fill" />
                    <span className="vertical-gallery-percent" ref={galleryPercentRef}>0%</span>
                    <span className="vertical-gallery-progress-mark" />
                  </div>
                </div>
              </aside>
              <div className="vertical-gallery-viewport" ref={galleryViewportRef}>
                <div className="vertical-gallery-track" ref={galleryTrackRef}>
                  {exteriorGalleryScenes.map((image, index) => (
                    <figure className="vertical-gallery-item" key={image.src}>
                      <img src={image.src} alt={image.alt} />
                      <figcaption>{String(index + 1).padStart(2, "0")}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="exterior-reveal" id="exterior" aria-label="seven x seven exterior and amenities">
            <div className="exterior-reveal-shell">
              <img
                className="exterior-reveal-image"
                 src={media("exterior", "media", "/assets/hero/seven-x-seven-facade-evening.webp")}
                alt="seven x seven residences illuminated facade at evening"
              />
              <div className="exterior-reveal-overlay" aria-hidden="true" />
              <div className="exterior-content">
                 <h2>{text("exterior", "headline", "Discreetly different.")}</h2>
                 <p>{text("exterior", "body", "Behind its composed allure, seven x seven residences Meydan Horizon extends everyday life beyond the home, revealing a connected sequence of wellness, social and outdoor spaces for every side of you.")}</p>
                 <button className="everly-cta" type="button" onClick={() => navigateFromMenu(2, "about-sevenxseven")}>explore the residences</button>
              </div>
              <div className="exterior-down-cue" aria-hidden="true">
                <span>Disconnect at arrival. Connect with yourself with every step in.</span>
                <i />
              </div>
            </div>
          </section>

          <section className="amenities-reveal" id="amenities" aria-label="seven x seven amenities">
            <div className="amenities-reveal-shell">
              <div className="amenity-visuals">
                {amenitySceneData.map((scene, index) => (
                  <figure className="amenity-visual" key={scene.src} style={{ "--amenity-layer": index } as CSSProperties}>
                    <img src={scene.src} alt={scene.alt} />
                    <figcaption>{scene.label}</figcaption>
                  </figure>
                ))}
              </div>
              <div className="amenities-panel">
                <div className="amenities-panel-heading">
                   <p>own your ritual</p>
                   <h2>{text("amenities", "headline", "amenities")}</h2>
                </div>
                <div className="amenity-grid">
                  {amenities.map((amenity, index) => {
                    const AmenityIcon = amenity.icon;

                    return (
                      <div
                        className="amenity-grid-item"
                        data-active={amenity.scene === 0 ? "true" : "false"}
                        data-scene={amenity.scene}
                        key={`${amenity.label}-${index}`}
                      >
                        <AmenityIcon aria-hidden="true" />
                         <p>{amenityLabels[index] ?? amenity.label}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="amenities-progress" aria-hidden="true">
                  <span />
                </div>
              </div>
            </div>
          </section>

          <section className="community-reveal" id="community" aria-label="Mohammed Bin Rashid City community">
            <div className="community-reveal-shell">
              <div className="community-copy">
                 <h2>{text("community", "headline", "mohammed bin rashid city")}</h2>
                 <p className="community-description">{text("community", "body", "MBR City brings together residential calm, new infrastructure, open landscapes and fast access to Dubai's central destinations.")}</p>
                 <button className="everly-cta register-interest-trigger" type="button" onClick={() => setInterestModalOpen(true)}>{primaryCta}</button>
              </div>
              <div className="community-carousel" aria-label="Community gallery" ref={communityCarouselRef}>
                {communitySceneData.map((slide, index) => (
                  <img
                    className={index === activeCommunitySlide ? "is-active" : ""}
                    src={slide.src}
                    alt={slide.alt}
                    key={slide.src}
                  />
                ))}
                <div className="community-carousel-controls">
                  <button
                    className="community-arrow community-prev"
                    type="button"
                    aria-label="Previous community image"
                    onClick={() => selectCommunitySlide(activeCommunitySlide - 1)}
                  >
                    <span aria-hidden="true">&#8592;</span>
                  </button>
                  <div className="community-dots" aria-label="Community gallery position">
                    {communitySceneData.map((slide, index) => (
                      <button
                        className={index === activeCommunitySlide ? "is-active" : ""}
                        type="button"
                        aria-label={`Show community image ${index + 1}`}
                        aria-pressed={index === activeCommunitySlide}
                        onClick={() => selectCommunitySlide(index)}
                        key={slide.src}
                      />
                    ))}
                  </div>
                  <button
                    className="community-arrow community-next"
                    type="button"
                    aria-label="Next community image"
                    onClick={() => selectCommunitySlide(activeCommunitySlide + 1)}
                  >
                    <span aria-hidden="true">&#8594;</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="distance-reveal" id="location" aria-label="Driving distances from seven x seven residences">
            <div className="distance-reveal-shell">
              <div className="distance-intro-copy">
                 <h2 ref={distanceHeadingRef} aria-label={distanceHeadingCopy}>
                   {Array.from(distanceHeadingCopy).map((character, index) => (
                    <span className="distance-character" data-state="hidden" aria-hidden="true" key={`${character}-${index}`}>
                      {character}
                    </span>
                  ))}
                </h2>
                 <p className="distance-description" ref={distanceDescriptionRef} aria-label={distanceDescriptionCopy}>
                   {Array.from(distanceDescriptionCopy).map((character, index) => (
                    <span className="distance-character" data-state="hidden" aria-hidden="true" key={`${character}-${index}`}>
                      {character}
                    </span>
                  ))}
                </p>
              </div>

              <div className="distance-map-slide">
                <div className="distance-map-space">
                  <div
                    className="distance-live-map distance-dark-map"
                    ref={distanceDarkMapRef}
                    aria-hidden="true"
                  />
                  <div
                    className="distance-live-map distance-light-map"
                    ref={distanceMapRef}
                    role="img"
                    aria-label="Map of Dubai destinations surrounding seven x seven residences"
                  />

                  <div className="distance-residence-marker">
                    <span className="distance-marker-disc">
                      <img className="distance-marker-light" src="/assets/brand/s-mark-white.png" alt="" />
                      <img className="distance-marker-dark" src="/assets/brand/s-mark-black.png" alt="" />
                    </span>
                    <p>seven x seven residences</p>
                    <small>Meydan Horizon</small>
                  </div>

                </div>
              </div>
            </div>
          </section>

          <section className="floor-plan-reveal floor-plan-section" id="floor-plans" aria-label="Residence floor plans">
            <div className="floor-plan-reveal-shell">
              <div className="floor-plan-panel">
                <p>floor plans</p>
                <h2>{floorPlan.title}</h2>

                <div className="floor-plan-tabs" role="tablist" aria-label="Select a residence floor plan">
                  {(Object.keys(floorPlans) as FloorPlanKey[]).map((key) => (
                    <button
                      className={key === activeFloorPlan ? "is-active" : ""}
                      type="button"
                      role="tab"
                      aria-selected={key === activeFloorPlan}
                      onClick={() => setActiveFloorPlan(key)}
                      key={key}
                    >
                      {floorPlanTabLabels[key]}
                    </button>
                  ))}
                </div>

                <div className="floor-plan-areas">
                  <div className="floor-plan-area-head">
                    <span>unit</span>
                    <span>total area</span>
                  </div>
                  <div className="floor-plan-area-row">
                    <strong>{floorPlan.unit}</strong>
                    <span>{floorPlan.totalSqft}</span>
                    <span>{floorPlan.totalSqm}</span>
                  </div>
                  <div className="floor-plan-area-row">
                    <strong>suite area</strong>
                    <span>{floorPlan.suiteSqft}</span>
                    <span>{floorPlan.suiteSqm}</span>
                  </div>
                  <div className="floor-plan-area-row">
                    <strong>balcony area</strong>
                    <span>{floorPlan.balconySqft}</span>
                    <span>{floorPlan.balconySqm}</span>
                  </div>
                </div>

                <div className="floor-plan-legend-wrap">
                  <h3>legend</h3>
                  <div className="floor-plan-legend">
                    {floorPlan.legend.map(([number, name, size]) => (
                      <div className="floor-plan-legend-row" key={`${activeFloorPlan}-${number}`}>
                        <span className="legend-number">{number}</span>
                        <span className="legend-name">{name}</span>
                        <span className="legend-size">{size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="floor-plan-stage">
                <img src={floorPlan.image} alt={floorPlan.alt} />
              </div>
            </div>
          </section>

          <section className="payment-reveal" id="payment-plan" aria-label="seven x seven payment plan">
            <div className="payment-reveal-shell">
              <aside className="payment-intro">
                 <h2>{text("payment", "headline", "a considered path to ownership")}</h2>
                 <span>{text("payment", "body", "A structured payment plan from reservation through handover, aligned with construction progress.")}</span>
                 <button className="everly-cta register-interest-trigger" type="button" onClick={() => setInterestModalOpen(true)}>{primaryCta}</button>
              </aside>

              <div className="payment-timeline">
                <div className="payment-total" aria-live="polite">
                  <strong ref={paymentStatusPercentRef}>20%</strong>
                  <div>
                    <h3 ref={paymentStatusTitleRef}>day 1</h3>
                    <p ref={paymentStatusDetailRef}>At the time of booking</p>
                  </div>
                </div>

                <div className="payment-progress" aria-label="Cumulative amount paid">
                  <div className="payment-progress-track">
                    {paymentMilestones.map((milestone, index) => (
                      <span style={{ flexGrow: milestone.percent }} key={`${milestone.title}-${index}`} />
                    ))}
                    <i />
                    <span className="payment-progress-mark" />
                  </div>
                  <div className="payment-progress-labels">
                    <span>0%</span>
                    <strong>Paid to date</strong>
                    <span>100%</span>
                  </div>
                </div>

                <div className="payment-phase">
                  <div className="payment-phase-heading">
                    <CalendarDays aria-hidden="true" />
                    <span>Reservation calendar</span>
                  </div>
                  <div className="payment-milestone-row">
                    {paymentMilestones.slice(0, 5).map((milestone, index) => (
                      <button
                        className={`payment-milestone${selectedPaymentMilestone === index ? " is-selected" : ""}`}
                        data-active="false"
                        type="button"
                        aria-pressed={selectedPaymentMilestone === index}
                        onClick={() => selectPaymentMilestone(index)}
                        key={milestone.title}
                      >
                        <i />
                        <strong>{milestone.percent}%</strong>
                        <span>{milestone.title}</span>
                        <small>{milestone.detail}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="payment-phase">
                  <div className="payment-phase-heading">
                    <Building2 aria-hidden="true" />
                    <span>Building progress</span>
                  </div>
                  <div className="payment-milestone-row">
                    {paymentMilestones.slice(5).map((milestone, localIndex) => {
                      const index = localIndex + 5;
                      const Icon = milestone.phase === "handover" ? KeyRound : Building2;
                      return (
                        <button
                          className={`payment-milestone${selectedPaymentMilestone === index ? " is-selected" : ""}`}
                          data-active="false"
                          type="button"
                          aria-pressed={selectedPaymentMilestone === index}
                          onClick={() => selectPaymentMilestone(index)}
                          key={milestone.title}
                        >
                          <i />
                          <Icon aria-hidden="true" />
                          <strong>{milestone.percent}%</strong>
                          <span>{milestone.title}</span>
                          <small>{milestone.detail}</small>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="footer-reveal footer-section" id="contact">
            <div className="footer-reveal-shell">
              <img
                className="footer-background"
                src="/assets/hero/seven-x-seven-facade-evening.webp"
                alt="seven x seven residences illuminated at dusk"
              />
              <div className="footer-shade" aria-hidden="true" />

              <div className="footer-grid">
                <form className="footer-lead-form" onSubmit={(event) => submitLead(event, "Footer form")}>
                   <p className="footer-form-kicker">{text("register", "headline", "make it yours")}</p>
                   <p>{text("register", "body", "Explore availability, floor plans and purchase details with our team.")}</p>
                   <input type="text" name="FullName" placeholder="Full Name" aria-label="Full Name" required />
                   <input className="form-honeypot" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                  <div className="footer-phone-field">
                    <button type="button" aria-label="Change country code">UAE</button>
                    <input type="tel" name="PhoneNumber" placeholder="+971 123456789" aria-label="Phone Number" required />
                  </div>
                  <input type="email" name="Email" placeholder="Email Address" aria-label="Email Address" required />
                  <select name="TypeOfLead" aria-label="I am interested in">
                     {interestOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                   <button className="footer-submit everly-cta" type="submit" disabled={leadSubmission.source === "Footer form" && leadSubmission.state === "submitting"}>{leadSubmission.source === "Footer form" && leadSubmission.state === "submitting" ? "sending" : submitCta}</button>
                  {leadSubmission.source === "Footer form" && leadSubmission.state === "success" ? <p className="footer-legal-copy" role="status">Thank you. Your enquiry has been received.</p> : null}
                  {leadSubmission.source === "Footer form" && leadSubmission.state === "error" ? <p className="footer-legal-copy" role="alert">We could not submit your enquiry. Please try again.</p> : null}
                  <p className="footer-legal-copy">
                     {consentCopy} <a href="/privacy-policy">privacy policy</a>.
                  </p>
                </form>

                <div className="footer-brand">
                  <img src="/assets/brand/logo-stacked-white.png" alt="seven x seven" />
                   <p>{text("footer", "body", "seven x seven sees luxury as the freedom to live your way.")}</p>
                   <p className="footer-copyright">{text("footer", "copyright", "Copyright 2026 Kasumigaseki Properties Development")}</p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
