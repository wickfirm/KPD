"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Maximize2, Menu, X } from "lucide-react";
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
  FaWaterLadder,
} from "react-icons/fa6";
import { arrowGlyph, localeHref, type Locale } from "@/lib/locales";
import { formMessage, t } from "@/lib/i18n";
import { sxsWord } from "@/lib/sxs-language";
import { LanguageSwitcher } from "../language-switcher";

type MediaItem = { src: string; alt: string; label?: string; position?: string };
type NavigationItem = { id: string; label: string; progress: number };
type FloorPlan = {
  image: string;
  alt: string;
  title: string;
  unit: string;
  totalSqft: string;
  totalSqm: string;
  suiteSqft: string;
  suiteSqm: string;
  balconySqft: string;
  balconySqm: string;
  legend: readonly (readonly [string, string, string])[];
};
type Milestone = { percent: number; title: string; detail: string; phase: string };

export type MobilePublicSiteProps = {
  preview: boolean;
  locale: Locale;
  switcherLocales: Locale[];
  heroScenes: MediaItem[];
  heroIndex: number;
  onHeroChange: (index: number) => void;
  heroEyebrow: string;
  heroHeadline: string;
  heroBody: string;
  heroVideo: string;
  aboutImage: string;
  aboutHeadline: string;
  aboutBody: string;
  manifesto: string;
  apartmentsHeadline: string;
  apartmentsBody: string;
  apartmentScenes: MediaItem[];
  galleryHeadline: string;
  galleryNote?: string;
  galleryScenes: MediaItem[];
  logo?: string;
  markWhite?: string;
  markBlack?: string;
  mapImage?: string;
  apartmentLead?: MediaItem[];
  exteriorImage: string;
  exteriorHeadline: string;
  exteriorBody: string;
  amenitiesHeadline: string;
  amenityScenes: MediaItem[];
  amenityLabels: string[];
  activeAmenity: number;
  onAmenityChange: (index: number) => void;
  communityHeadline: string;
  communityBody: string;
  communityScenes: MediaItem[];
  activeCommunity: number;
  onCommunityChange: (index: number) => void;
  locationHeadline: string;
  locationBody: string;
  distancePlaces: ReadonlyArray<{ name: string; minutes: string }>;
  floorPlan: FloorPlan;
  floorPlanKey: string;
  onFloorPlanChange: (key: "one" | "two" | "three") => void;
  paymentHeadline: string;
  paymentBody: string;
  milestones: readonly Milestone[];
  selectedMilestone: number;
  onMilestoneChange: (index: number) => void;
  paymentPlaying: boolean;
  onTogglePayment: () => void;
  footerBody: string;
  footerCopyright: string;
  registerHeadline: string;
  registerBody: string;
  interestOptions: string[];
  consentCopy: string;
  primaryCta: string;
  secondaryCta: string;
  submitCta: string;
  onSubmitLead: (event: FormEvent<HTMLFormElement>, source: "Register modal" | "Footer form") => void;
  leadSubmission: { source: string; state: "idle" | "submitting" | "success" | "error" };
  navigation: NavigationItem[];
  activeSection: string;
  menuOpen: boolean;
  menuTransitioning: boolean;
  onMenuToggle: () => void;
  onNavigate: (progress: number, id?: string) => void;
  modalOpen: boolean;
  onModalOpen: () => void;
  onModalClose: () => void;
  mobileScrolled: boolean;
  mobileProgress: number;
  lightbox: { src: string; alt: string } | null;
  onLightbox: (value: { src: string; alt: string } | null) => void;
};

export function MobilePublicSite(props: MobilePublicSiteProps) {
  const touchStart = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const galleryTrackRef = useRef<HTMLDivElement>(null);
  const manifestoRef = useRef<HTMLElement>(null);
  const amenityListRef = useRef<HTMLDivElement>(null);
  const amenityLockUntil = useRef(0);
  const [galleryProgress, setGalleryProgress] = useState(0);
  const [manifestoProgress, setManifestoProgress] = useState(0);
  const { activeAmenity, onAmenityChange } = props;
  const activeNav = props.navigation.find((item) => item.id === props.activeSection) ?? props.navigation[0];
  const selectedPayment = props.milestones[props.selectedMilestone];
  const paid = props.milestones.slice(0, props.selectedMilestone + 1).reduce((sum, milestone) => sum + milestone.percent, 0);
  const moveHero = (direction: number) => props.onHeroChange((props.heroIndex + direction + props.heroScenes.length) % props.heroScenes.length);
  const moveCommunity = (direction: number) => props.onCommunityChange((props.activeCommunity + direction + props.communityScenes.length) % props.communityScenes.length);
  const selectAmenity = (index: number) => {
    amenityLockUntil.current = Date.now() + 900;
    props.onAmenityChange(index);
  };
  const moveAmenity = (direction: number) => selectAmenity((props.activeAmenity + direction + props.amenityScenes.length) % props.amenityScenes.length);
  const amenityIcons = [FaCouch, FaBuilding, FaElevator, FaShower, FaPersonSwimming, FaSpa, FaDumbbell, FaPersonPraying, FaDroplet, FaWaterLadder, FaUmbrellaBeach, FaChildren, FaPersonRunning, FaTree, FaFireFlameCurved];
  const openVideoFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      void video.requestFullscreen();
      return;
    }
    const iosVideo = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    iosVideo.webkitEnterFullscreen?.();
  };
  /// A swipe drags the picture the way the finger goes. On an Arabic page the
  /// next one lies to the left, so the same gesture means the opposite.
  const swipe = props.locale === "ar" ? -1 : 1;
  const syncGalleryProgress = () => {
    const track = galleryTrackRef.current;
    if (!track) return;
    const maximum = Math.max(track.scrollWidth - track.clientWidth, 1);
    // On a right-to-left page the browser counts the scroll from 0 down to -maximum.
    const progress = Math.min(Math.max(Math.abs(track.scrollLeft) / maximum, 0), 1);
    setGalleryProgress(progress * 100);
  };
  const manifestoCharacters = Array.from(props.manifesto);
  const manifestoIndex = manifestoProgress >= 0.999 ? manifestoCharacters.length : Math.floor(manifestoProgress * manifestoCharacters.length);
  const sortedDistancePlaces = [...props.distancePlaces].sort((first, second) => Number.parseInt(first.minutes, 10) - Number.parseInt(second.minutes, 10));

  useEffect(() => {
    let frame = 0;
    const updateScrollEffects = () => {
      frame = 0;
      const height = window.innerHeight;
      const manifesto = manifestoRef.current;
      if (manifesto) {
        const top = manifesto.getBoundingClientRect().top;
        const progress = Math.min(Math.max((height * 0.85 - top) / (height * 0.85 - 64 + manifesto.offsetHeight * 0.1), 0), 1);
        setManifestoProgress((current) => Math.abs(current - progress) > 0.004 ? progress : current);
      }

      if (Date.now() < amenityLockUntil.current) return;
      const items = amenityListRef.current?.querySelectorAll<HTMLButtonElement>("button");
      if (!items?.length) return;
      const activationLine = 64 + 16 + 260 + 16 + 40;
      let active = 0;
      items.forEach((item, index) => {
        if (item.getBoundingClientRect().top <= activationLine) active = index;
      });
      if (active !== activeAmenity) onAmenityChange(active);
    };
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateScrollEffects);
    };
    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [activeAmenity, onAmenityChange]);

  return (
    <main className={`mobile-public${props.preview ? " is-cms-preview" : ""}`}>
      <header className={`mobile-site-header${props.mobileScrolled ? " is-scrolled" : ""}${props.menuOpen ? " menu-open" : ""}`}>
          <a href="#home" aria-label={t(props.locale, "sxs.returnToHome")} onClick={(event) => { event.preventDefault(); props.onNavigate(0, "home"); }}>
          <img src={props.logo ?? "/assets/brand/logo-stacked-white.png"} alt={t(props.locale, "sxs.mobileLogoAlt")} />
        </a>
        <span>{activeNav?.label ?? sxsWord(props.locale, "home")}</span>
        <button type="button" aria-label={props.menuOpen ? t(props.locale, "sxs.closeNavigation") : t(props.locale, "sxs.openNavigation")} aria-expanded={props.menuOpen} onClick={props.onMenuToggle}>
          {props.menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <i style={{ width: `${props.mobileProgress}%` }} />
      </header>

      <div className={`mobile-menu${props.menuOpen ? " is-open" : ""}`} aria-hidden={!props.menuOpen}>
        <img src={props.logo ?? "/assets/brand/logo-stacked-white.png"} alt="seven x seven" />
        <nav aria-label={t(props.locale, "sxs.sections")}>
          <p>{t(props.locale, "sxs.exploreResidences")}</p>
          {props.navigation.map((item, index) => (
            <a className={item.id === props.activeSection ? "is-active" : ""} href={`#${item.id}`} tabIndex={props.menuOpen ? 0 : -1} onClick={(event) => { event.preventDefault(); props.onNavigate(item.progress, item.id); }} key={item.id}>
              <span>{String(index + 1).padStart(2, "0")}</span><strong>{item.label}</strong>
            </a>
          ))}
        </nav>
        {props.switcherLocales.length ? <LanguageSwitcher locale={props.locale} published={props.switcherLocales} variant="overlay" /> : null}
      </div>

      {props.menuTransitioning ? <div className="mobile-anchor-loader" role="status"><img src={props.markWhite ?? "/assets/brand/s-mark-white.png"} alt="" /></div> : null}

      <section className="mobile-hero is-visible" id="home" aria-label="seven x seven residences">
        <div className="mobile-hero-gallery" onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={(event) => { const distance = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(distance) > 42) moveHero((distance < 0 ? 1 : -1) * swipe); }} onClick={() => moveHero(1)}>
          {props.heroScenes.map((scene, index) => <img className={index === props.heroIndex ? "is-active" : ""} src={scene.src} alt={scene.alt} style={{ objectPosition: scene.position ?? "68% 50%" }} key={scene.src} />)}
        </div>
        <div className="mobile-hero-copy">
          <p>{props.heroEyebrow}</p>
          <h1>{props.heroHeadline}</h1>
          <span>{props.heroBody}</span>
          <div className="mobile-hero-controls"><div>{props.heroScenes.map((scene, index) => <button className={index === props.heroIndex ? "is-active" : ""} type="button" aria-label={t(props.locale, "sxs.showHeroImage", { index: index + 1 })} onClick={(event) => { event.stopPropagation(); props.onHeroChange(index); }} key={scene.src} />)}</div><small>{t(props.locale, "sxs.tapOrSwipe")}</small></div>
        </div>
      </section>

      <section className="mobile-video-fold mobile-section" aria-label={t(props.locale, "sxs.residencesReveal")}>
        <video ref={videoRef} src={props.heroVideo} autoPlay muted loop playsInline preload="metadata" />
        <button type="button" aria-label={t(props.locale, "sxs.viewVideoFullScreen")} onClick={openVideoFullscreen}><Maximize2 aria-hidden="true" /><span>{t(props.locale, "sxs.fullScreen")}</span></button>
      </section>

      <section className="mobile-about mobile-section" id="about-sevenxseven">
        <div className="mobile-section-copy mobile-light-copy">
          <h2>{props.aboutHeadline}</h2>
          <p>{props.aboutBody}</p>
          <button className="mobile-outline-button" type="button" onClick={() => props.onNavigate(4)}>{props.secondaryCta}</button>
          <div className="mobile-unit-fact"><span>{t(props.locale, "sxs.availableUnitTypes")}</span><strong>{t(props.locale, "sxs.residencesWithPenthouses")}</strong></div>
        </div>
        <img className="mobile-about-image" src={props.aboutImage} alt={t(props.locale, "sxs.withinMeydanAlt")} />
      </section>

      <section ref={manifestoRef} className="mobile-manifesto mobile-section" aria-label={t(props.locale, "sxs.livingStatement")}>
        <div className="mobile-manifesto-mark" aria-hidden="true" />
        <p>{manifestoCharacters.map((character, index) => <span className={index < manifestoIndex ? "is-revealed" : index === manifestoIndex && manifestoProgress < 0.999 ? "is-active" : ""} key={`${character}-${index}`}>{character}</span>)}</p>
        <div className="mobile-manifesto-progress"><span><i style={{ transform: `scaleX(${manifestoProgress})` }} /></span><b style={{ color: manifestoProgress >= 0.999 ? "#050504" : "#d9b061", transform: `rotate(${manifestoProgress * 360}deg)` }}>/</b><span><i style={{ transform: `scaleX(${manifestoProgress})` }} /></span></div>
      </section>

      <section className="mobile-apartments mobile-section" id="apartments">
        <div className="mobile-section-copy mobile-light-copy">
          <h2>{t(props.locale, "sxs.interiors")}</h2>
          <h3>{props.apartmentsHeadline}</h3>
          <p>{props.apartmentsBody}</p>
          <button className="mobile-solid-button" type="button" onClick={() => props.onNavigate(28.5)}>{t(props.locale, "sxs.exploreFloorPlans")}</button>
        </div>
        <div className="mobile-apartment-track" aria-label={t(props.locale, "sxs.apartmentGallery")}>
          {[...(props.apartmentLead ?? [{ src: "/assets/sxs%20apartments/1.png", alt: t(props.locale, "sxs.livingRoomWorkspaceAlt") }, { src: "/assets/sxs%20apartments/2.png", alt: t(props.locale, "sxs.livingRoomWaterfrontAlt") }]), ...props.apartmentScenes].map((scene, index) => (
            <figure key={`${scene.src}-${index}`}><img src={scene.src} alt={scene.alt} /><figcaption>{index === 1 ? t(props.locale, "sxs.designedForYourPace") : index === 2 ? t(props.locale, "sxs.slowMorningsShort") : index === 4 ? t(props.locale, "sxs.precisionYouCanFeel") : index === 5 ? t(props.locale, "sxs.oakAndWalnutShort") : String(index + 1).padStart(2, "0")}</figcaption></figure>
          ))}
        </div>
      </section>

      <section className="mobile-gallery mobile-section" id="gallery">
        <header><h2>{props.galleryHeadline}</h2><p>{props.galleryNote ?? t(props.locale, "sxsFallback.galleryNote")}</p><div className="mobile-gallery-progress"><i style={{ transform: `scaleX(${galleryProgress / 100})` }} />{/* The label's place is an inline style, which no stylesheet can mirror: on an Arabic page it is measured from the right. */}<small style={props.locale === "ar" ? { right: `clamp(19px, ${galleryProgress}%, calc(100% - 19px))` } : { left: `clamp(19px, ${galleryProgress}%, calc(100% - 19px))` }}>{Math.round(galleryProgress)}%</small><img src={props.markWhite ?? "/assets/brand/s-mark-white.png"} alt="" /></div></header>
        <div ref={galleryTrackRef} className="mobile-gallery-carousel" onScroll={syncGalleryProgress}>
          {props.galleryScenes.map((scene, index) => <figure onClick={() => props.onLightbox(scene)} key={scene.src}><img src={scene.src} alt={scene.alt} /><figcaption>{String(index + 1).padStart(2, "0")} / {String(props.galleryScenes.length).padStart(2, "0")}</figcaption></figure>)}
        </div>
      </section>

      <section className="mobile-exterior mobile-section" id="exterior">
        <img src={props.exteriorImage} alt={t(props.locale, "sxs.residencesExteriorAlt")} />
        <div className="mobile-exterior-shade" />
        <div className="mobile-section-copy"><h2>{props.exteriorHeadline}</h2><p>{props.exteriorBody}</p><button className="mobile-outline-button" type="button" onClick={() => props.onNavigate(2)}>{t(props.locale, "sxs.exploreResidences")}</button></div>
        <footer><span>{t(props.locale, "sxs.disconnectAtArrival")}</span><i /></footer>
      </section>

      <section className="mobile-amenities mobile-section" id="amenities">
        <div className="mobile-section-copy mobile-light-copy"><p>{t(props.locale, "sxs.ownYourRitual")}</p><h2>{props.amenitiesHeadline}</h2></div>
        <figure className="mobile-amenity-feature" onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={(event) => { const distance = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(distance) > 42) moveAmenity((distance < 0 ? 1 : -1) * swipe); }}>
          <div className="mobile-amenity-images">{props.amenityScenes.map((scene, index) => <img className={index === props.activeAmenity ? "is-active" : ""} src={scene.src} alt={scene.alt} key={scene.src} />)}</div>
          <figcaption><span>{props.amenityLabels[props.activeAmenity]}</span><small>{String(props.activeAmenity + 1).padStart(2, "0")} / {String(props.amenityScenes.length).padStart(2, "0")}</small></figcaption>
        </figure>
        <div ref={amenityListRef} className="mobile-amenity-grid">{props.amenityLabels.map((label, index) => { const Icon = amenityIcons[index % amenityIcons.length]; return <button className={index === props.activeAmenity ? "is-active" : ""} type="button" onClick={() => selectAmenity(index)} key={`${label}-${index}`}><Icon aria-hidden="true" /><strong>{label}</strong></button>; })}</div>
      </section>

      <section className="mobile-community mobile-section" id="community">
        <div className="mobile-section-copy mobile-light-copy"><h2>{props.communityHeadline}</h2><p>{props.communityBody}</p><button className="mobile-outline-button" type="button" onClick={props.onModalOpen}>{props.primaryCta}</button></div>
        <div className="mobile-community-carousel" onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={(event) => { const distance = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(distance) > 42) moveCommunity((distance < 0 ? 1 : -1) * swipe); }}>
          {props.communityScenes.map((scene, index) => <img className={index === props.activeCommunity ? "is-active" : ""} src={scene.src} alt={scene.alt} key={scene.src} />)}
          <div><button type="button" aria-label={t(props.locale, "sxs.previousCommunityImage")} onClick={() => moveCommunity(-1)}>←</button><span>{props.communityScenes.map((scene, index) => <button className={index === props.activeCommunity ? "is-active" : ""} type="button" aria-label={t(props.locale, "sxs.showCommunityImage", { index: index + 1 })} onClick={() => props.onCommunityChange(index)} key={scene.src} />)}</span><button type="button" aria-label={t(props.locale, "sxs.nextCommunityImage")} onClick={() => moveCommunity(1)}>{arrowGlyph(props.locale, "→")}</button></div>
        </div>
      </section>

      <section className="mobile-location mobile-section" id="location">
        <div className="mobile-section-copy mobile-dark-copy"><h2>{props.locationHeadline}</h2><p>{props.locationBody}</p></div>
        <div className="mobile-location-map"><img src={props.mapImage ?? "/assets/maps/mobile-driving-distances.png"} alt={t(props.locale, "sxs.mapAlt")} /><div className="mobile-residence-marker"><span><img src={props.markBlack ?? "/assets/brand/s-mark-black.png"} alt="" /></span><strong>seven x seven residences</strong></div></div>
        <div className="mobile-distance-list">{sortedDistancePlaces.map((place) => <div key={place.name}><strong>{place.name}</strong><span>{place.minutes}</span></div>)}</div>
      </section>

      <section className="mobile-floor-plans mobile-section" id="floor-plans">
        <div className="mobile-section-copy mobile-light-copy"><p>{t(props.locale, "sxsFallback.floorplansHeadline")}</p><h2>{props.floorPlan.title}</h2></div>
        <div className="mobile-floor-tabs" role="tablist">{(["one", "two", "three"] as const).map((key) => <button className={props.floorPlanKey === key ? "is-active" : ""} type="button" role="tab" aria-selected={props.floorPlanKey === key} onClick={() => props.onFloorPlanChange(key)} key={key}>{t(props.locale, key === "one" ? "sxsFallback.tabOne" : key === "two" ? "sxsFallback.tabTwo" : "sxsFallback.tabThree")}</button>)}</div>
        <div className="mobile-area-table"><header><span>{t(props.locale, "sxs.unit")}</span><span>{t(props.locale, "sxs.totalArea")}</span></header><p><strong>{props.floorPlan.unit}</strong><span>{props.floorPlan.totalSqft}</span><span>{props.floorPlan.totalSqm}</span></p><p><strong>{t(props.locale, "sxs.suiteArea")}</strong><span>{props.floorPlan.suiteSqft}</span><span>{props.floorPlan.suiteSqm}</span></p><p><strong>{t(props.locale, "sxs.balconyArea")}</strong><span>{props.floorPlan.balconySqft}</span><span>{props.floorPlan.balconySqm}</span></p></div>
        <button className="mobile-plan-image" type="button" onClick={() => props.onLightbox({ src: props.floorPlan.image, alt: props.floorPlan.alt })}><img src={props.floorPlan.image} alt={props.floorPlan.alt} /><span>{t(props.locale, "sxs.tapPlanToEnlarge")}</span></button>
        <div className="mobile-plan-legend"><h3>{t(props.locale, "sxs.legend")}</h3>{props.floorPlan.legend.map(([number, name, size]) => <p key={number}><b>{number}</b><span>{name}</span><small>{size}</small></p>)}</div>
      </section>

      <section className="mobile-payment mobile-section" id="payment-plan">
        <div className="mobile-section-copy mobile-dark-copy"><h2>{props.paymentHeadline}</h2><p>{props.paymentBody}</p><button className="mobile-outline-button" type="button" onClick={props.onModalOpen}>{props.primaryCta}</button></div>
        <div className="mobile-payment-current"><strong>{selectedPayment.percent}%</strong><div><h3>{selectedPayment.title}</h3><p>{selectedPayment.detail}</p></div></div>
        <button className="mobile-payment-play" type="button" onClick={props.onTogglePayment}>{props.paymentPlaying ? t(props.locale, "sxs.pauseTimeline") : t(props.locale, "sxs.playPaymentTimeline")}</button>
        <div className="mobile-payment-progress"><i><b style={{ width: `${paid}%` }} /></i><p><span>0%</span><strong>{t(props.locale, "sxs.paidToDate") + " "}{paid}%</strong><span>100%</span></p></div>
        {[{ title: t(props.locale, "sxs.reservationCalendar"), start: 0, end: 5 }, { title: t(props.locale, "sxs.buildingProgress"), start: 5, end: props.milestones.length }].map((phase) => <div className="mobile-payment-phase" key={phase.title}><h3>{phase.title}</h3><div>{props.milestones.slice(phase.start, phase.end).map((milestone, localIndex) => { const index = phase.start + localIndex; return <button className={index === props.selectedMilestone ? "is-active" : ""} type="button" onClick={() => props.onMilestoneChange(index)} key={milestone.title}><strong>{milestone.percent}%</strong><span>{milestone.title}</span></button>; })}</div></div>)}
      </section>

      <footer className="mobile-contact mobile-section" id="contact">
        <img className="mobile-contact-bg" src="/assets/hero/seven-x-seven-facade-evening.webp" alt="" />
        <div className="mobile-contact-shade" />
        <form onSubmit={(event) => props.onSubmitLead(event, "Footer form")}>
          <p>{props.registerHeadline}</p><p>{props.registerBody}</p><input name="FullName" type="text" placeholder={t(props.locale, "sxs.fullName")} aria-label={t(props.locale, "sxs.fullName")} required /><input className="form-honeypot" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" /><div><button type="button">{t(props.locale, "sxs.uae")}</button><input name="PhoneNumber" type="tel" placeholder="+971 123456789" aria-label={t(props.locale, "sxs.phoneNumber")} required /></div><input name="Email" type="email" placeholder={t(props.locale, "sxs.emailAddress")} aria-label={t(props.locale, "sxs.emailAddress")} required /><select name="TypeOfLead" aria-label={t(props.locale, "sxs.interestedIn")}>{props.interestOptions.map((option) => <option key={option}>{option}</option>)}</select><button className="mobile-contact-submit" type="submit" disabled={props.leadSubmission.source === "Footer form" && props.leadSubmission.state === "submitting"}>{props.leadSubmission.source === "Footer form" && props.leadSubmission.state === "submitting" ? t(props.locale, "sxs.sending") : props.submitCta}</button>
          {props.leadSubmission.source === "Footer form" && props.leadSubmission.state === "success" ? <small role="status">{formMessage(props.locale, "Thank you. Your enquiry has been received.", "form.success")}</small> : null}{props.leadSubmission.source === "Footer form" && props.leadSubmission.state === "error" ? <small role="alert">{formMessage(props.locale, "We could not submit your enquiry. Please try again.", "form.error")}</small> : null}<small>{props.consentCopy} <a href={localeHref("/privacy-policy", props.locale)}>{t(props.locale, "sxs.privacyPolicy")}</a>.</small>
        </form>
        <div className="mobile-contact-brand"><img src={props.logo ?? "/assets/brand/logo-stacked-white.png"} alt="seven x seven" /><p>{props.footerBody}</p><small>{props.footerCopyright}</small>{props.switcherLocales.length ? <LanguageSwitcher locale={props.locale} published={props.switcherLocales} variant="footer" /> : null}</div>
      </footer>

      {props.modalOpen ? <div className="mobile-modal" role="dialog" aria-modal="true" aria-labelledby="mobile-modal-title" onMouseDown={(event) => { if (event.target === event.currentTarget) props.onModalClose(); }}><div><button className="mobile-modal-close" type="button" aria-label={t(props.locale, "sxs.closeRegistrationForm")} onClick={props.onModalClose}><X /></button><form onSubmit={(event) => props.onSubmitLead(event, "Register modal")}><p>seven x seven residences</p><h2 id="mobile-modal-title">{props.registerHeadline}</h2><p>{props.registerBody}</p><input name="FullName" type="text" placeholder={t(props.locale, "sxs.fullName")} aria-label={t(props.locale, "sxs.fullName")} required /><input className="form-honeypot" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" /><div><button type="button">{t(props.locale, "sxs.uae")}</button><input name="PhoneNumber" type="tel" placeholder="+971 123456789" aria-label={t(props.locale, "sxs.phoneNumber")} required /></div><input name="Email" type="email" placeholder={t(props.locale, "sxs.emailAddress")} aria-label={t(props.locale, "sxs.emailAddress")} required /><select name="TypeOfLead">{props.interestOptions.map((option) => <option key={option}>{option}</option>)}</select><button className="mobile-contact-submit" type="submit">{props.submitCta}</button><small>{props.consentCopy} <a href={localeHref("/privacy-policy", props.locale)}>{t(props.locale, "sxs.privacyPolicy")}</a>.</small></form></div></div> : null}
      {props.lightbox ? <div className="mobile-lightbox" role="dialog" aria-modal="true" aria-label={t(props.locale, "sxs.imagePreview")} onClick={() => props.onLightbox(null)}><button type="button" aria-label={t(props.locale, "sxs.closeImagePreview")}><X /></button><img src={props.lightbox.src} alt={props.lightbox.alt} /></div> : null}
    </main>
  );
}
