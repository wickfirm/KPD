(function () {
  const header = document.querySelector(".site-header");
  const menu = document.querySelector(".menu-panel");
  const menuOpeners = document.querySelectorAll("[data-menu-open]");
  const menuClosers = document.querySelectorAll("[data-menu-close]");
  let modal = document.querySelector(".booking-modal");
  let floorModal = document.querySelector(".floor-modal");
  let lightbox = document.querySelector(".lightbox-modal");
  let bioModal = document.querySelector(".bio-modal");
  let goTop = document.querySelector(".go-top");
  let floatingContact = document.querySelector("[data-floating-contact]");
  const footer = document.querySelector(".section_footer");
  const bookingOpeners = document.querySelectorAll("[data-booking-open]");
  let lastY = window.scrollY;
  let bookingModalTouched = false;
  let bookingWidgetLauncher = null;
  const bookingLeadFormMarkup = "<form class=\"booking-lead-form\" action=\"mailto:info@kpd.ae?subject=KPD%20Meeting%20Request\" method=\"post\" enctype=\"text/plain\"><div class=\"booking-lead-grid\"><input class=\"booking-lead-field\" type=\"text\" name=\"Name\" placeholder=\"Full name\" autocomplete=\"name\" required><input class=\"booking-lead-field\" type=\"email\" name=\"Email\" placeholder=\"Email address\" autocomplete=\"email\" required><input class=\"booking-lead-field\" type=\"tel\" name=\"Phone\" placeholder=\"Phone number\" autocomplete=\"tel\"><select class=\"booking-lead-field\" name=\"Interest\" aria-label=\"Interest\"><option value=\"\">Interested in</option><option>Seven X Seven</option><option>Emerald Villa</option><option>Dubai Hills Mansion</option><option>Online call</option></select><textarea class=\"booking-lead-field booking-lead-message\" name=\"Message\" placeholder=\"Short message\"></textarea></div><button class=\"btn-pill booking-primary-button booking-lead-submit text-black\" type=\"submit\">Submit inquiry</button></form><p class=\"booking-privacy-note\">The KPD team will respond with the right advisory route.</p>";
  const bookingModalMarkup = "<div class=\"booking-backdrop\" aria-hidden=\"true\"></div><div class=\"booking-card\"><button class=\"modal-close\" type=\"button\" data-booking-close aria-label=\"Minimize inquiry form\"></button><h2 id=\"booking-title\">Inquiry Form</h2><p>Share a few contact details and the KPD team will coordinate the right advisory conversation.</p>" + bookingLeadFormMarkup + "</div>";

  if (!floatingContact) {
    floatingContact = document.createElement("div");
    floatingContact.className = "floating-contact";
    floatingContact.setAttribute("data-floating-contact", "");
    floatingContact.innerHTML = "<a href=\"mailto:info@kpd.com?subject=KPD%20Inquiry\" class=\"floating-contact__link\" aria-label=\"Send an enquiry\"><span class=\"floating-contact__icon\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\" fill=\"none\"><path d=\"M6.75 6.5H17.25C18.35 6.5 19.25 7.4 19.25 8.5V14.5C19.25 15.6 18.35 16.5 17.25 16.5H11.2L7.2 19.5V16.5H6.75C5.65 16.5 4.75 15.6 4.75 14.5V8.5C4.75 7.4 5.65 6.5 6.75 6.5Z\"></path><path d=\"M8.25 10H15.75\"></path><path d=\"M8.25 13H13.5\"></path></svg></span><span>Enquiry</span></a><a href=\"tel:+97143883099\" class=\"floating-contact__link\" aria-label=\"Call KPD\"><span class=\"floating-contact__icon\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\" fill=\"none\"><path d=\"M8.15 5.5L10.15 9.1L8.85 10.4C9.65 12 11 13.35 12.6 14.15L13.9 12.85L17.5 14.85L16.9 17.75C16.75 18.45 16.1 18.95 15.38 18.85C9.95 18.08 5.92 14.05 5.15 8.62C5.05 7.9 5.55 7.25 6.25 7.1L8.15 5.5Z\"></path></svg></span><span>Call</span></a><a href=\"https://wa.me/97143883099\" class=\"floating-contact__link\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"Contact KPD on WhatsApp\"><span class=\"floating-contact__icon\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\" fill=\"none\"><path d=\"M7.25 18.25L4.75 19.25L5.7 16.65C4.98 15.48 4.58 14.1 4.58 12.62C4.58 8.36 7.99 4.92 12.2 4.92C16.42 4.92 19.83 8.36 19.83 12.62C19.83 16.88 16.42 20.32 12.2 20.32C10.38 20.32 8.7 19.67 7.25 18.25Z\"></path><path d=\"M9.45 9.15C9.25 9.62 9.3 10.68 10.55 12.05C11.8 13.42 13.13 14.05 13.72 13.98L14.75 12.95L16.45 13.78C16.38 14.38 15.98 15.5 14.65 15.72C12.8 16.02 9.42 13.95 8.58 11.45C8.12 10.1 8.72 9.32 9.45 9.15Z\"></path></svg></span><span>WhatsApp</span></a>";
    document.body.appendChild(floatingContact);
  }

  if (!goTop) {
    goTop = document.createElement("button");
    goTop.className = "go-top";
    goTop.type = "button";
    goTop.setAttribute("aria-label", "Back to top");
    goTop.innerHTML = "<svg viewBox=\"0 0 32 32\" aria-hidden=\"true\"><path d=\"M16 8v16M9 15l7-7 7 7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"></path></svg>";
    document.body.appendChild(goTop);
  }

  bookingWidgetLauncher = document.querySelector("[data-booking-launcher]");
  if (!bookingWidgetLauncher) {
    bookingWidgetLauncher = document.createElement("button");
    bookingWidgetLauncher.className = "booking-widget-launcher visible";
    bookingWidgetLauncher.type = "button";
    bookingWidgetLauncher.setAttribute("data-booking-launcher", "");
    bookingWidgetLauncher.setAttribute("aria-label", "Open inquiry form");
    bookingWidgetLauncher.innerHTML = "<span>Inquiry</span>";
    document.body.appendChild(bookingWidgetLauncher);
  }

  function initDelayedNavigationReveal() {
    const delayedHeader = document.querySelector(".home-development-page .development-site-header.is-delayed-nav");
    if (!delayedHeader) return;
    const heroVideo = document.querySelector(".pdf-hero video");
    if (heroVideo) {
      heroVideo.muted = true;
      heroVideo.setAttribute("playsinline", "");
      const playPromise = heroVideo.play && heroVideo.play();
      if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => {});
    }
    window.setTimeout(() => delayedHeader.classList.add("is-nav-revealed"), 3000);
  }

  initDelayedNavigationReveal();

  function initSingleProjectHeroVideos() {
    document.querySelectorAll(".single-project-page .single-project-hero").forEach((hero) => {
      const video = hero.querySelector("video");
      const playButton = hero.querySelector(".single-project-play");
      if (!video || !playButton) return;

      video.loop = false;
      video.removeAttribute("loop");
      video.muted = true;
      video.setAttribute("playsinline", "");

      const markPlaying = () => {
        hero.classList.add("is-video-playing");
        hero.classList.remove("is-video-complete");
        playButton.setAttribute("aria-hidden", "true");
      };

      const markComplete = () => {
        hero.classList.remove("is-video-playing");
        hero.classList.add("is-video-complete");
        playButton.removeAttribute("aria-hidden");
      };

      video.addEventListener("play", markPlaying);
      video.addEventListener("playing", markPlaying);
      video.addEventListener("ended", markComplete);

      playButton.addEventListener("click", () => {
        video.currentTime = 0;
        const playPromise = video.play && video.play();
        markPlaying();
        if (playPromise && typeof playPromise.catch === "function") playPromise.catch(markComplete);
      });

      if (video.ended) {
        markComplete();
      } else {
        markPlaying();
        const playPromise = video.play && video.play();
        if (playPromise && typeof playPromise.catch === "function") playPromise.catch(markComplete);
      }
    });
  }

  initSingleProjectHeroVideos();

  function updateHeaderHeroState(scrollY = window.scrollY) {
    if (!header || !document.body.classList.contains("home-development-page")) return;
    const hero = document.querySelector(".pdf-hero");
    const headerHeight = header.getBoundingClientRect().height || 100;
    const switchPoint = hero ? hero.offsetTop + hero.offsetHeight - headerHeight : 120;
    header.classList.toggle("is-past-hero", scrollY >= switchPoint);
  }

  function updateFloatingContactState(scrollY = window.scrollY) {
    if (!floatingContact) return;
    const footerRect = footer ? footer.getBoundingClientRect() : null;
    const footerInView = footerRect ? footerRect.top < window.innerHeight && footerRect.bottom > 0 : false;
    floatingContact.classList.toggle("visible", scrollY > 420 && !footerInView);
  }

  updateHeaderHeroState();
  updateFloatingContactState();

  function initMediaFilters() {
    document.querySelectorAll("[data-media-filter-root]").forEach((root) => {
      const buttons = Array.from(root.querySelectorAll("[data-media-filter]"));
      const panels = Array.from(root.querySelectorAll("[data-media-filter-panel]"));
      if (!buttons.length || !panels.length) return;

      const normalizeFilter = (value) => {
        const clean = String(value || "").replace(/^#/, "").toLowerCase();
        if (clean === "blogs") return "blog";
        if (clean === "updates") return "all";
        return ["all", "news", "blog"].includes(clean) ? clean : "all";
      };

      const setFilter = (value, updateHash = false) => {
        const filter = normalizeFilter(value);
        root.setAttribute("data-media-filter-current", filter);
        buttons.forEach((button) => {
          const active = normalizeFilter(button.getAttribute("data-media-filter")) === filter;
          button.classList.toggle("is-active", active);
          button.setAttribute("aria-pressed", active ? "true" : "false");
        });
        panels.forEach((panel) => {
          const panelFilter = normalizeFilter(panel.getAttribute("data-media-filter-panel"));
          panel.hidden = filter !== "all" && panelFilter !== filter;
        });
        if (updateHash) {
          const hash = filter === "blog" ? "blogs" : filter;
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${hash}`);
        }
      };

      buttons.forEach((button) => {
        button.addEventListener("click", () => setFilter(button.getAttribute("data-media-filter"), true));
      });

      window.addEventListener("hashchange", () => setFilter(window.location.hash));
      setFilter(window.location.hash || root.getAttribute("data-media-filter-current") || "all");
    });
  }

  initMediaFilters();

  if (!modal) {
    modal = document.createElement("div");
    modal.className = "booking-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "booking-title");
    modal.innerHTML = bookingModalMarkup;
    document.body.appendChild(modal);
  }
  const bookingTitle = modal.querySelector("#booking-title");
  const bookingClose = modal.querySelector("[data-booking-close]");
  const bookingBackdrop = modal.querySelector(".booking-backdrop");
  if (bookingTitle) bookingTitle.textContent = "Inquiry Form";
  if (bookingClose) bookingClose.setAttribute("aria-label", "Minimize inquiry form");
  if (bookingBackdrop) bookingBackdrop.setAttribute("aria-hidden", "true");

  if (!floorModal) {
    floorModal = document.createElement("div");
    floorModal.className = "floor-modal";
    floorModal.innerHTML = "<div class=\"modal-backdrop\" data-floor-close></div><div class=\"floor-card\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"floor-title\"><button class=\"modal-close\" type=\"button\" data-floor-close aria-label=\"Close floor plan modal\"></button><h2 id=\"floor-title\">Request <span data-floor-project>KPD</span> Floor Plans</h2><form class=\"form-grid\" action=\"mailto:info@kpd.com\" method=\"post\" enctype=\"text/plain\"><input type=\"hidden\" name=\"project\" value=\"KPD\"><input class=\"field\" type=\"text\" name=\"name\" placeholder=\"Name\"><input class=\"field\" type=\"email\" name=\"email\" placeholder=\"Email\"><input class=\"field\" type=\"tel\" name=\"phone\" placeholder=\"Phone\"><select class=\"field\" name=\"interest\"><option>Investment Interest</option><option>End User</option><option>Broker Inquiry</option></select><button class=\"btn-pill text-black\" type=\"submit\">Submit Request</button></form></div>";
    document.body.appendChild(floorModal);
  }

  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.className = "lightbox-modal";
    lightbox.innerHTML = "<div class=\"modal-backdrop\" data-lightbox-close></div><div class=\"lightbox-card\" role=\"dialog\" aria-modal=\"true\" aria-label=\"Image preview\"><button class=\"modal-close light\" type=\"button\" data-lightbox-close aria-label=\"Close image preview\"></button><img data-lightbox-image alt=\"\"><p class=\"lightbox-caption\" data-lightbox-caption></p></div>";
    document.body.appendChild(lightbox);
  }

  if (!bioModal) {
    bioModal = document.createElement("div");
    bioModal.className = "bio-modal";
    bioModal.innerHTML = "<div class=\"modal-backdrop\" data-bio-close></div><article class=\"bio-card\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"bio-title\"><button class=\"modal-close\" type=\"button\" data-bio-close aria-label=\"Close biography\"></button><div class=\"bio-card-media\"><img data-bio-image alt=\"\"></div><div class=\"bio-card-copy\"><span class=\"bio-card-role\" data-bio-role></span><h2 id=\"bio-title\" data-bio-name></h2><p data-bio-text></p></div></article>";
    document.body.appendChild(bioModal);
  }

  const bookingClosers = document.querySelectorAll("[data-booking-close]");
  const floorOpeners = document.querySelectorAll("[data-floor-open]");
  const floorClosers = document.querySelectorAll("[data-floor-close]");
  const lightboxClosers = document.querySelectorAll("[data-lightbox-close]");
  const bioClosers = document.querySelectorAll("[data-bio-close]");

  function initSingleProjectRenderCarousel() {
    document.querySelectorAll("[data-render-carousel]").forEach((carousel) => {
      const slides = Array.from(carousel.querySelectorAll(".single-project-render-slide"));
      const dots = Array.from(carousel.querySelectorAll("[data-render-dot]"));
      const prev = carousel.querySelector("[data-render-prev]");
      const next = carousel.querySelector("[data-render-next]");
      if (!slides.length) return;
      let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));

      const setActive = (index) => {
        activeIndex = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => slide.classList.toggle("is-active", slideIndex === activeIndex));
        dots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === activeIndex));
      };

      if (prev) prev.addEventListener("click", () => setActive(activeIndex - 1));
      if (next) next.addEventListener("click", () => setActive(activeIndex + 1));
      dots.forEach((dot, index) => dot.addEventListener("click", () => setActive(index)));
      setActive(activeIndex);
    });
  }

  initSingleProjectRenderCarousel();

  function initProjectTravelTimeline() {
    document.querySelectorAll("[data-villa23-travel-timeline]").forEach((section) => {
      const car = section.querySelector("[data-villa23-travel-car]");
      const rail = section.querySelector("[data-villa23-travel-rail]");
      const steps = Array.from(section.querySelectorAll("[data-villa23-travel-step]"));
      const map = section.querySelector("[data-villa23-travel-map]");
      const defaultMapSrc = map ? map.getAttribute("src") : "";
      if (!car || !rail || !steps.length) return;
      let activeIndex = 0;

      const updateCarPosition = () => {
        const activeStep = steps[activeIndex];
        if (!activeStep) return;
        const railRect = rail.getBoundingClientRect();
        const stepRect = activeStep.getBoundingClientRect();
        if (!railRect.width || !stepRect.width) return;
        const x = stepRect.left - railRect.left + stepRect.width / 2 - car.offsetWidth / 2;
        car.style.transform = `translateX(${x}px) translateZ(0)`;
      };

      const setActiveStep = (index) => {
        activeIndex = Math.min(Math.max(Number(index) || 0, 0), steps.length - 1);
        steps.forEach((step) => {
          const isActive = Number(step.getAttribute("data-index")) === activeIndex;
          step.classList.toggle("is-active", isActive);
          step.setAttribute("aria-selected", isActive ? "true" : "false");
        });
        const activeStep = steps[activeIndex];
        const nextMapSrc = activeStep ? activeStep.getAttribute("data-map-src") || defaultMapSrc : defaultMapSrc;
        if (map && nextMapSrc && map.getAttribute("src") !== nextMapSrc) {
          map.classList.add("is-changing");
          map.setAttribute("src", nextMapSrc);
          map.addEventListener("load", () => map.classList.remove("is-changing"), { once: true });
          window.setTimeout(() => map.classList.remove("is-changing"), 900);
        }
        requestAnimationFrame(updateCarPosition);
      };

      steps.forEach((step) => {
        step.addEventListener("click", () => setActiveStep(step.getAttribute("data-index")));
      });

      window.addEventListener("resize", updateCarPosition);
      if (car.complete) {
        requestAnimationFrame(updateCarPosition);
      } else {
        car.addEventListener("load", updateCarPosition, { once: true });
      }
      setActiveStep(0);
    });
  }

  initProjectTravelTimeline();

  function enhanceBookingModal() {
    if (!modal) return;
    const card = modal.querySelector(".booking-card");
    if (!card) return;
    card.querySelectorAll(".booking-scheduler, .booking-slot-grid, .booking-slot").forEach((element) => element.remove());
    if (card.querySelector(".booking-lead-form")) return;
    const primary = card.querySelector(".booking-primary-button");
    if (primary) primary.remove();
    card.insertAdjacentHTML("beforeend", bookingLeadFormMarkup);
  }

  const getMenuImageUrl = (src) => new URL(src, window.location.href).href;

  function initMenuImageSwaps() {
    if (!menu) return;
    const links = Array.from(menu.querySelectorAll("a[href]"));
    if (!links.length) return;

    const menuImages = [
      ["single-project", "assets/images/project-media/sxs/facade%20front%202.png"],
      ["seven x seven", "assets/images/project-media/sxs/facade%20right%202.png"],
      ["emerald-villa", "assets/images/project-media/Emerald%20Villa/13_2.jpg"],
      ["emerald villa", "assets/images/project-media/Emerald%20Villa/8.jpg"],
      ["dubai-hills-mansion", "assets/images/project-media/Dubai%20Hills%20Mansion/6_plex_front_rev_final_1.jpg"],
      ["dubai hills mansion", "assets/images/project-media/Dubai%20Hills%20Mansion/4_plex_rev_02_final.jpg"],
      ["our-projects", "assets/images/library/futuristic-facade-of-apartment-houses-in-the-distr-2026-03-25-22-44-43-utc.jpg"],
      ["developments", "assets/images/library/modern-apartment-buildings-with-green-trees-in-sum-2026-03-24-10-05-01-utc.jpg"],
      ["legacy", "assets/images/about/about-hero.jpg"],
      ["our legacy", "assets/images/library/yokohama-bay-at-night-2026-03-24-23-17-41-utc.jpg"],
      ["about-us", "assets/images/library/real-estate-financial-center-high-office-buildin-2026-03-19-23-16-08-utc.jpg"],
      ["about", "assets/images/library/commercial-district-in-tokyo-2026-03-24-22-42-22-utc.jpg"],
      ["news", "assets/images/library/modern-office-glasses-buildings-cityscape-under-bl-2026-03-10-02-05-10-utc.jpg"],
      ["news & updates", "assets/images/library/office-buildings-property-real-estate-skyscrape-2026-03-17-04-25-11-utc.jpg"],
      ["invest-in-dubai", "assets/images/library/view-of-dubai-skyline-including-the-burj-khalifa-2026-03-18-08-25-37-utc.jpg"],
      ["invest in dubai", "assets/images/library/luxury-downtown-of-dubai-2026-03-19-09-24-48-utc.jpg"],
      ["contact", "assets/images/experience-center/hq/10.jpg"],
      ["home", "assets/images/experience-center/hq/8.jpg"],
      ["index", "assets/images/experience-center/hq/8.jpg"]
    ];
    const defaultImage = menuImages[menuImages.length - 1][1];

    const resolveImage = (link) => {
      const href = (link.getAttribute("href") || "").toLowerCase();
      const text = (link.textContent || "").trim().toLowerCase();
      const token = `${href} ${text}`;
      const match = menuImages.find(([key]) => token.includes(key));
      return match ? match[1] : defaultImage;
    };

    const setMenuImage = (src) => {
      menu.style.setProperty("--menu-bg-image", `url("${getMenuImageUrl(src)}")`);
    };

    Array.from(new Set(menuImages.map(([, src]) => src))).forEach((src) => {
      const image = new Image();
      image.src = getMenuImageUrl(src);
    });

    links.forEach((link) => {
      const image = resolveImage(link);
      link.setAttribute("data-menu-image", image);
      link.addEventListener("mouseenter", () => setMenuImage(image));
      link.addEventListener("focus", () => setMenuImage(image));
      link.addEventListener("touchstart", () => setMenuImage(image), { passive: true });
    });

    const currentPage = window.location.pathname.split("/").pop().toLowerCase() || "index.html";
    const activeLink = links.find((link) => (link.getAttribute("href") || "").toLowerCase().includes(currentPage)) || links[0];
    setMenuImage(activeLink ? activeLink.getAttribute("data-menu-image") || resolveImage(activeLink) : defaultImage);
  }

  function initMenuAccordions() {
    if (!menu || menu.hasAttribute("data-menu-accordion-ready")) return;
    menu.setAttribute("data-menu-accordion-ready", "true");
    menu.querySelectorAll(".menu-item.has-sub").forEach((item, index) => {
      const trigger = item.querySelector(":scope > a");
      const sublist = item.querySelector(":scope > .menu-sublist");
      if (!trigger || !sublist) return;
      const id = sublist.id || `site-menu-sublist-${index + 1}`;
      sublist.id = id;
      trigger.setAttribute("role", "button");
      trigger.setAttribute("aria-haspopup", "true");
      trigger.setAttribute("aria-controls", id);
      trigger.setAttribute("aria-expanded", "false");
      const setOpen = (open) => {
        item.classList.toggle("is-open", open);
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
      };
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        setOpen(!item.classList.contains("is-open"));
      });
      trigger.addEventListener("keydown", (event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          setOpen(!item.classList.contains("is-open"));
        }
      });
    });
  }

  function setMenu(open) {
    if (!menu) return;
    if (open) {
      const currentPage = window.location.pathname.split("/").pop().toLowerCase() || "index.html";
      const activeLink = Array.from(menu.querySelectorAll("a[href]")).find((link) => (link.getAttribute("href") || "").toLowerCase().includes(currentPage));
      const image = activeLink?.getAttribute("data-menu-image");
      if (image) menu.style.setProperty("--menu-bg-image", `url("${getMenuImageUrl(image)}")`);
    }
    menu.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
  }

  function setModal(open) {
    if (!modal) return;
    modal.classList.toggle("open", open);
    modal.classList.toggle("is-minimized", !open);
    if (bookingWidgetLauncher) {
      bookingWidgetLauncher.classList.toggle("visible", !open);
      bookingWidgetLauncher.setAttribute("aria-expanded", open ? "true" : "false");
    }
    document.body.classList.remove("modal-open");
  }

  function setFloorModal(open, project) {
    if (!floorModal) return;
    floorModal.classList.toggle("open", open);
    document.body.classList.toggle("modal-open", open);
    const label = floorModal.querySelector("[data-floor-project]");
    const hidden = floorModal.querySelector("[name='project']");
    if (project && label) label.textContent = project;
    if (project && hidden) hidden.value = project;
  }

  function setLightbox(open, image, caption) {
    if (!lightbox) return;
    const targetImage = lightbox.querySelector("[data-lightbox-image]");
    const targetCaption = lightbox.querySelector("[data-lightbox-caption]");
    if (image && targetImage) {
      targetImage.src = image;
      targetImage.alt = caption || "";
    }
    if (targetCaption) targetCaption.textContent = caption || "";
    lightbox.classList.toggle("open", open);
    document.body.classList.toggle("modal-open", open);
  }

  function setBioModal(open, card) {
    if (!bioModal) return;
    if (open && card) {
      const image = card.querySelector("img")?.getAttribute("src") || "";
      const name = card.getAttribute("data-management-name") || card.querySelector("strong")?.textContent.trim() || "Executive Management";
      const role = card.getAttribute("data-management-role") || card.querySelector("span")?.textContent.trim() || "";
      const bio = card.getAttribute("data-management-bio") || `${name} contributes to KPD's executive management platform, supporting disciplined development decisions, partner confidence, and long-horizon value creation.`;
      const targetImage = bioModal.querySelector("[data-bio-image]");
      const targetName = bioModal.querySelector("[data-bio-name]");
      const targetRole = bioModal.querySelector("[data-bio-role]");
      const targetText = bioModal.querySelector("[data-bio-text]");
      if (targetImage) {
        targetImage.src = image;
        targetImage.alt = name;
      }
      if (targetName) targetName.textContent = name;
      if (targetRole) targetRole.textContent = role;
      if (targetText) targetText.textContent = bio;
    }
    bioModal.classList.toggle("open", open);
    document.body.classList.toggle("modal-open", open);
  }

  function initDesktopNavigation() {
    document.querySelectorAll("[data-desktop-nav-shell]").forEach((shell) => {
      const panel = shell.querySelector(".desktop-nav-panel");
      const triggers = Array.from(shell.querySelectorAll(".nav-panel-trigger"));
      const groups = Array.from(shell.querySelectorAll(".desktop-nav-panel-group"));
      const links = Array.from(shell.querySelectorAll(".desktop-nav-link"));
      const images = Array.from(shell.querySelectorAll(".desktop-nav-preview-image"));
      const directLinks = Array.from(shell.querySelectorAll(":scope > a:not(.nav-panel-trigger)"));
      if (!panel || !triggers.length || !groups.length || !links.length || !images.length) return;

      const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
      const previewByPage = {
        "index.html": "home",
        "about.html": "aboutus",
        "developments.html": "developments",
        "collection.html": "developments",
        "seven-x-seven.html": "sevenxseven",
        "news.html": "news",
        "news-single.html": "news",
        "contact.html": "contact"
      };
      const groupPreviews = {
        development: ["developments", "sevenxseven"],
        about: ["aboutus"],
        media: ["news"]
      };
      const groupLandingPreviews = {
        development: "developments",
        about: "aboutus",
        media: "news"
      };
      const defaultPreview = previewByPage[currentPage] || "home";
      let activeGroup = null;
      let closeTimer;

      const setPreview = (previewKey) => {
        if (!previewKey) return;
        links.forEach((link) => link.classList.toggle("is-active", link.getAttribute("data-desktop-preview") === previewKey));
        images.forEach((image) => image.classList.toggle("active", image.getAttribute("data-desktop-preview-image") === previewKey));
      };

      const defaultPreviewForGroup = (groupKey) => {
        if (groupPreviews[groupKey] && groupPreviews[groupKey].includes(defaultPreview)) return defaultPreview;
        if (groupLandingPreviews[groupKey]) return groupLandingPreviews[groupKey];
        const group = groups.find((item) => item.getAttribute("data-desktop-panel") === groupKey);
        const firstLink = group ? group.querySelector(".desktop-nav-link") : null;
        return firstLink ? firstLink.getAttribute("data-desktop-preview") : defaultPreview;
      };

      const cancelClose = () => {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      };

      const openPanel = (groupKey) => {
        cancelClose();
        activeGroup = groupKey;
        shell.classList.add("is-panel-open");
        panel.setAttribute("aria-hidden", "false");
        triggers.forEach((trigger) => {
          const isActive = trigger.getAttribute("data-desktop-nav") === groupKey;
          trigger.classList.toggle("is-active", isActive);
          trigger.setAttribute("aria-expanded", isActive ? "true" : "false");
        });
        groups.forEach((group) => {
          group.classList.remove("is-hovering");
          group.classList.toggle("active", group.getAttribute("data-desktop-panel") === groupKey);
        });
        setPreview(defaultPreviewForGroup(groupKey));
      };

      const closePanel = () => {
        cancelClose();
        activeGroup = null;
        shell.classList.remove("is-panel-open");
        panel.setAttribute("aria-hidden", "true");
        triggers.forEach((trigger) => {
          trigger.classList.remove("is-active");
          trigger.setAttribute("aria-expanded", "false");
        });
        groups.forEach((group) => {
          group.classList.remove("active", "is-hovering");
        });
        setPreview(defaultPreview);
      };

      const queueClose = () => {
        cancelClose();
        closeTimer = window.setTimeout(closePanel, 120);
      };

      setPreview(defaultPreview);

      triggers.forEach((trigger) => {
        const groupKey = trigger.getAttribute("data-desktop-nav");
        ["mouseenter", "pointerenter", "mouseover", "mousemove", "focus"].forEach((eventName) => {
          trigger.addEventListener(eventName, () => openPanel(groupKey));
        });
        trigger.addEventListener("click", (event) => {
          if (trigger.tagName === "A" && trigger.getAttribute("href")) return;
          event.preventDefault();
          if (shell.classList.contains("is-panel-open") && activeGroup === groupKey) {
            closePanel();
          } else {
            openPanel(groupKey);
          }
        });
      });

      links.forEach((link) => {
        ["mouseenter", "pointerenter", "mouseover", "mousemove", "focus"].forEach((eventName) => {
          link.addEventListener(eventName, () => {
            groups.forEach((group) => group.classList.remove("is-hovering"));
            const group = link.closest(".desktop-nav-panel-group");
            if (group) group.classList.add("is-hovering");
            setPreview(link.getAttribute("data-desktop-preview"));
          });
        });
        link.addEventListener("mouseleave", () => {
          const group = link.closest(".desktop-nav-panel-group");
          if (group) group.classList.remove("is-hovering");
        });
      });

      directLinks.forEach((link) => {
        link.addEventListener("mouseenter", closePanel);
        link.addEventListener("focus", closePanel);
      });
      shell.addEventListener("mouseenter", cancelClose);
      shell.addEventListener("mouseleave", queueClose);
      panel.addEventListener("mouseenter", cancelClose);
      panel.addEventListener("mouseleave", queueClose);
      document.addEventListener("click", (event) => {
        if (!shell.contains(event.target)) closePanel();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closePanel();
      });
      shell.addEventListener("focusout", () => {
        window.setTimeout(() => {
          if (!shell.contains(document.activeElement)) closePanel();
        }, 0);
      });
    });
  }

  function initHeaderMegaDropdowns() {
    document.querySelectorAll(".header-nav-dropdown").forEach((dropdown) => {
      const trigger = dropdown.querySelector(".header-nav-trigger");
      const menu = dropdown.querySelector(".header-nav-menu");
      if (!trigger || !menu) return;
      let closeTimer;

      const setOpen = (open) => {
        window.clearTimeout(closeTimer);
        dropdown.classList.toggle("is-open", open);
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
      };

      const queueClose = () => {
        window.clearTimeout(closeTimer);
        closeTimer = window.setTimeout(() => setOpen(false), 120);
      };

      trigger.setAttribute("aria-expanded", "false");
      ["mouseenter", "pointerenter", "focus"].forEach((eventName) => {
        trigger.addEventListener(eventName, () => setOpen(true));
      });
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        setOpen(!dropdown.classList.contains("is-open"));
      });
      dropdown.addEventListener("mouseenter", () => setOpen(true));
      dropdown.addEventListener("mouseleave", queueClose);
      dropdown.addEventListener("focusout", () => {
        window.setTimeout(() => {
          if (!dropdown.contains(document.activeElement)) setOpen(false);
        }, 0);
      });
      document.addEventListener("click", (event) => {
        if (!dropdown.contains(event.target)) setOpen(false);
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setOpen(false);
      });
    });
  }

  enhanceBookingModal();
  initMenuImageSwaps();
  initMenuAccordions();
  initDesktopNavigation();
  initHeaderMegaDropdowns();

  menuOpeners.forEach((button) => {
    button.addEventListener("click", () => setMenu(true));
  });

  menuClosers.forEach((button) => {
    button.addEventListener("click", () => setMenu(false));
  });

  if (menu) {
    menu.addEventListener("click", (event) => {
      if (event.target === menu) setMenu(false);
    });
  }

  bookingOpeners.forEach((button) => {
    button.addEventListener("click", () => {
      bookingModalTouched = true;
      setModal(true);
    });
  });

  if (bookingWidgetLauncher) {
    bookingWidgetLauncher.addEventListener("click", () => {
      bookingModalTouched = true;
      setModal(true);
    });
  }

  bookingClosers.forEach((button) => {
    button.addEventListener("click", () => {
      bookingModalTouched = true;
      setModal(false);
    });
  });

  function initTimedBookingPopup() {
    if (!modal) return;
    setModal(false);
    const delay = 5000;
    const tryOpen = () => {
      if (bookingModalTouched || modal.classList.contains("open")) return;
      if (document.body.classList.contains("menu-open") || document.body.classList.contains("modal-open")) {
        window.setTimeout(tryOpen, 1000);
        return;
      }
      setModal(true);
    };
    window.setTimeout(tryOpen, delay);
  }

  initTimedBookingPopup();

  function initBackendInquiryForms() {
    const forms = Array.from(document.querySelectorAll(".booking-lead-form, .contact-adaptive-form"));
    if (!forms.length || !window.fetch) return;

    const apiBase = (() => {
      if (window.KPD_API_BASE) return String(window.KPD_API_BASE).replace(/\/$/, "");
      if (window.location.protocol.startsWith("http") && window.location.port === "8789") {
        return `${window.location.protocol}//${window.location.hostname}:8790`;
      }
      return "";
    })();

    const endpoint = `${apiBase}/api/inquiries`;

    const ensureStatus = (form) => {
      let status = form.querySelector("[data-form-status]");
      if (!status) {
        status = document.createElement("p");
        status.className = "backend-form-status";
        status.setAttribute("data-form-status", "");
        status.setAttribute("role", "status");
        form.appendChild(status);
      }
      return status;
    };

    const collectPayload = (form) => {
      const payload = {};
      Array.from(form.elements).forEach((field) => {
        if (!field.name || field.disabled || field.closest("[hidden], .is-hidden")) return;
        if ((field.type === "checkbox" || field.type === "radio") && !field.checked) return;
        if (field.type === "file") {
          payload[field.name] = Array.from(field.files || []).map((file) => file.name).join(", ");
          return;
        }
        payload[field.name] = field.value;
      });
      if (form.classList.contains("booking-lead-form") && !payload["Inquiry Type"]) {
        payload["Inquiry Type"] = "Online Call Inquiry";
      }
      return payload;
    };

    forms.forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const status = ensureStatus(form);
        const submit = form.querySelector("button[type='submit'], input[type='submit']");
        status.textContent = "Sending inquiry...";
        if (submit) submit.disabled = true;

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(collectPayload(form))
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || "Unable to send inquiry");
          status.textContent = "Inquiry received. The KPD team will be in touch.";
          form.reset();
          if (form.classList.contains("booking-lead-form")) {
            window.setTimeout(() => setModal(false), 1000);
          }
        } catch (error) {
          status.textContent = "Unable to send right now. Please try again or email info@kpd.com.";
        } finally {
          if (submit) submit.disabled = false;
        }
      });
    });
  }

  initBackendInquiryForms();

  function initInvestBenefitCarousels() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.querySelectorAll("[data-invest-carousel]").forEach((carousel) => {
      const track = carousel.querySelector(".invest-benefit-track");
      const cards = Array.from(carousel.querySelectorAll(".invest-benefit-card"));
      const progress = carousel.querySelector("[data-invest-carousel-progress]");
      if (!track || cards.length < 2) return;

      let index = 0;
      let timer = 0;
      let resizeTimer = 0;

      const getGap = () => {
        const styles = window.getComputedStyle(track);
        return parseFloat(styles.columnGap || styles.gap || "0") || 0;
      };

      const getStep = () => {
        const firstCard = cards[0];
        return firstCard.getBoundingClientRect().width + getGap();
      };

      const getVisibleCount = () => {
        const width = carousel.getBoundingClientRect().width;
        const step = getStep();
        if (!step) return 1;
        return Math.max(1, Math.floor((width + getGap()) / step));
      };

      const getMaxIndex = () => Math.max(0, cards.length - getVisibleCount());

      const setProgress = () => {
        if (!progress) return;
        const maxIndex = getMaxIndex();
        const amount = maxIndex ? ((index + 1) / (maxIndex + 1)) * 100 : 100;
        progress.style.width = `${amount}%`;
      };

      const setSlide = (nextIndex) => {
        const maxIndex = getMaxIndex();
        index = nextIndex > maxIndex ? 0 : Math.max(0, nextIndex);
        track.style.transform = `translate3d(${-index * getStep()}px, 0, 0)`;
        setProgress();
      };

      const stop = () => {
        window.clearInterval(timer);
        timer = 0;
      };

      const start = () => {
        stop();
        if (prefersReducedMotion || getMaxIndex() < 1) return;
        timer = window.setInterval(() => setSlide(index + 1), 3000);
      };

      carousel.addEventListener("pointerenter", stop);
      carousel.addEventListener("focusin", stop);
      carousel.addEventListener("pointerleave", start);
      carousel.addEventListener("focusout", () => {
        window.setTimeout(() => {
          if (!carousel.contains(document.activeElement)) start();
        }, 0);
      });

      window.addEventListener("resize", () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          setSlide(Math.min(index, getMaxIndex()));
          start();
        }, 120);
      });

      setSlide(0);
      start();
    });
  }

  initInvestBenefitCarousels();

  function initInvestScrollCarousels() {
    document.querySelectorAll("[data-invest-scroll-carousel]").forEach((carousel) => {
      const track = carousel.querySelector("[data-invest-scroll-track]");
      const prev = carousel.querySelector("[data-invest-scroll-prev]");
      const next = carousel.querySelector("[data-invest-scroll-next]");
      if (!track || !prev || !next) return;

      const getStep = () => {
        const firstCard = track.querySelector("article");
        const styles = window.getComputedStyle(track);
        const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
        return firstCard ? firstCard.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
      };

      const updateControls = () => {
        const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth - 2);
        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= maxScroll;
      };

      prev.addEventListener("click", () => {
        track.scrollTo({ left: Math.max(0, track.scrollLeft - getStep()), behavior: "smooth" });
      });

      next.addEventListener("click", () => {
        const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
        track.scrollTo({ left: Math.min(maxScroll, track.scrollLeft + getStep()), behavior: "smooth" });
      });

      track.addEventListener("scroll", () => {
        window.requestAnimationFrame(updateControls);
      }, { passive: true });

      window.addEventListener("resize", updateControls);
      updateControls();
      window.requestAnimationFrame(updateControls);
      window.setTimeout(updateControls, 300);
    });
  }

  initInvestScrollCarousels();

  floorOpeners.forEach((button) => {
    button.addEventListener("click", () => {
      setFloorModal(true, button.getAttribute("data-floor-project") || "KPD");
    });
  });

  floorClosers.forEach((button) => {
    button.addEventListener("click", () => setFloorModal(false));
  });

  document.querySelectorAll("[data-lightbox-src]").forEach((button) => {
    button.addEventListener("click", () => {
      const image = button.getAttribute("data-lightbox-src");
      const caption = button.getAttribute("data-lightbox-caption") || button.textContent.trim();
      setLightbox(true, image, caption);
    });
  });

  lightboxClosers.forEach((button) => {
    button.addEventListener("click", () => setLightbox(false));
  });

  document.querySelectorAll(".about-management-card").forEach((card) => {
    card.addEventListener("click", () => setBioModal(true, card));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setBioModal(true, card);
      }
    });
  });

  bioClosers.forEach((button) => {
    button.addEventListener("click", () => setBioModal(false));
  });

  const countTargets = Array.from(document.querySelectorAll(".pdf-stat strong, .stat strong"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const parseCountText = (text) => {
    const match = text.trim().match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
    if (!match) return null;
    const value = Number(match[2]);
    if (!Number.isFinite(value)) return null;
    return {
      prefix: match[1],
      target: value,
      suffix: match[3],
      decimals: (match[2].split(".")[1] || "").length
    };
  };
  const formatCount = (value, decimals) => value.toFixed(decimals);
  const animateCount = (element) => {
    if (element.dataset.counted === "true") return;
    const config = parseCountText(element.dataset.countOriginal || element.textContent);
    if (!config) return;
    element.dataset.counted = "true";
    element.dataset.countOriginal = element.textContent.trim();
    const render = (value) => {
      element.textContent = `${config.prefix}${formatCount(value, config.decimals)}${config.suffix}`;
    };
    if (reduceMotion) {
      render(config.target);
      return;
    }
    const duration = 1400;
    const start = window.performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      render(config.target * eased);
      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        render(config.target);
      }
    };
    render(0);
    window.requestAnimationFrame(tick);
  };

  countTargets.forEach((target) => {
    const parsed = parseCountText(target.textContent);
    if (!parsed) return;
    target.dataset.countOriginal = target.textContent.trim();
  });

  if ("IntersectionObserver" in window) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.25 });
    countTargets.forEach((target) => {
      if (parseCountText(target.dataset.countOriginal || target.textContent)) {
        countObserver.observe(target);
      }
    });
  } else {
    countTargets.forEach(animateCount);
  }

  document.querySelectorAll("[data-map-pan]").forEach((pan) => {
    const frame = pan.closest(".pdf-map-frame");
    if (!frame) return;

    let panX = 0;
    let panY = 0;
    let startX = 0;
    let startY = 0;
    let startPanX = 0;
    let startPanY = 0;
    let activePointer = null;
    let moved = false;
    let suppressClick = false;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const bounds = () => ({
      x: Math.max(0, (pan.offsetWidth - frame.clientWidth) / 2),
      y: Math.max(0, (pan.offsetHeight - frame.clientHeight) / 2)
    });
    const setPan = (nextX, nextY) => {
      const limit = bounds();
      panX = clamp(nextX, -limit.x, limit.x);
      panY = clamp(nextY, -limit.y, limit.y);
      pan.style.setProperty("--map-pan-x", `${panX}px`);
      pan.style.setProperty("--map-pan-y", `${panY}px`);
    };

    setPan(0, 0);

    frame.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      activePointer = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startPanX = panX;
      startPanY = panY;
      moved = false;
      frame.classList.add("is-dragging");
      if (frame.setPointerCapture) {
        try {
          frame.setPointerCapture(event.pointerId);
        } catch (error) {}
      }
    });

    frame.addEventListener("pointermove", (event) => {
      if (activePointer !== event.pointerId) return;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) moved = true;
      setPan(startPanX + deltaX, startPanY + deltaY);
      event.preventDefault();
    });

    const endDrag = (event) => {
      if (activePointer !== event.pointerId) return;
      if (moved) {
        suppressClick = true;
        window.setTimeout(() => {
          suppressClick = false;
        }, 0);
      }
      activePointer = null;
      frame.classList.remove("is-dragging");
      if (frame.releasePointerCapture) {
        try {
          frame.releasePointerCapture(event.pointerId);
        } catch (error) {}
      }
    };

    frame.addEventListener("pointerup", endDrag);
    frame.addEventListener("pointercancel", endDrag);
    frame.addEventListener("click", (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    window.addEventListener("resize", () => setPan(panX, panY), { passive: true });
  });

  document.querySelectorAll("[data-gallery-flex]").forEach((gallery) => {
    const panels = Array.from(gallery.querySelectorAll("[data-gallery-panel]"));
    if (!panels.length) return;
    const setActivePanel = (activePanel) => {
      gallery.classList.add("has-active");
      panels.forEach((panel) => panel.classList.toggle("is-active", panel === activePanel));
    };
    const clearActivePanel = () => {
      gallery.classList.remove("has-active");
      panels.forEach((panel) => panel.classList.remove("is-active"));
    };
    const activateFromEvent = (event) => {
      const panel = event.target.closest("[data-gallery-panel]");
      if (panel && gallery.contains(panel)) setActivePanel(panel);
    };

    clearActivePanel();
    panels.forEach((panel) => {
      panel.addEventListener("pointerenter", () => setActivePanel(panel));
      panel.addEventListener("mouseenter", () => setActivePanel(panel));
      panel.addEventListener("focus", () => setActivePanel(panel));
    });
    gallery.addEventListener("pointermove", activateFromEvent, { passive: true });
    gallery.addEventListener("mousemove", activateFromEvent, { passive: true });
    gallery.addEventListener("pointerleave", clearActivePanel);
    gallery.addEventListener("focusout", () => {
      window.setTimeout(() => {
        if (!gallery.contains(document.activeElement)) clearActivePanel();
      }, 0);
    });
  });

  document.querySelectorAll("[data-tabs]").forEach((tabs) => {
    const buttons = Array.from(tabs.querySelectorAll("[data-tab-target]"));
    const panels = Array.from(tabs.querySelectorAll("[data-tab-panel]"));
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.getAttribute("data-tab-target");
        buttons.forEach((item) => item.classList.toggle("active", item === button));
        panels.forEach((panel) => panel.classList.toggle("active", panel.getAttribute("data-tab-panel") === target));
      });
    });
  });

  document.querySelectorAll("[data-numbered-slider]").forEach((slider) => {
    const slides = Array.from(slider.querySelectorAll("[data-numbered-slide]"));
    const dots = Array.from(slider.querySelectorAll("[data-numbered-dot]"));
    if (!slides.length || !dots.length) return;
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        slides.forEach((slide, slideIndex) => slide.classList.toggle("active", slideIndex === index));
        dots.forEach((item, dotIndex) => item.classList.toggle("active", dotIndex === index));
      });
    });
  });

  document.querySelectorAll("[data-development-slider]").forEach((slider) => {
    const slides = Array.from(slider.querySelectorAll(".pdf-development-slide"));
    const dots = Array.from(slider.querySelectorAll("[data-development-dot]"));
    if (slides.length < 2) return;
    let index = Math.max(0, slides.findIndex((slide) => slide.classList.contains("active")));
    let timer;
    const setSlide = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => slide.classList.toggle("active", slideIndex === index));
      dots.forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === index));
    };
    const startTimer = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => setSlide(index + 1), 4200);
    };

    setSlide(index);
    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const nextIndex = Number(dot.getAttribute("data-development-dot"));
        setSlide(Number.isNaN(nextIndex) ? 0 : nextIndex);
        startTimer();
      });
    });
    startTimer();
  });

  document.querySelectorAll("[data-intuitive-stage]").forEach((stage) => {
    const image = stage.querySelector("[data-intuitive-image]");
    const title = stage.querySelector("[data-intuitive-title]");
    const copy = stage.querySelector("[data-intuitive-copy]");
    const prev = stage.querySelector("[data-intuitive-prev]");
    const next = stage.querySelector("[data-intuitive-next]");
    const slides = Array.from(stage.querySelectorAll("[data-intuitive-slide]"))
      .map((slide) => ({
        image: slide.getAttribute("data-image") || "",
        alt: slide.getAttribute("data-alt") || "",
        title: slide.getAttribute("data-title") || "",
        copy: slide.getAttribute("data-copy") || "",
      }))
      .filter((slide) => slide.image);

    if (!image || !title || !copy || slides.length < 2) return;

    let activeIndex = 0;
    let switchTimer;

    const applySlide = (slide) => {
      image.src = slide.image;
      image.alt = slide.alt;
      title.textContent = slide.title;
      copy.textContent = slide.copy;
      stage.setAttribute("data-intuitive-current", String(activeIndex + 1));
    };

    const setSlide = (nextIndex) => {
      activeIndex = (nextIndex + slides.length) % slides.length;
      window.clearTimeout(switchTimer);
      stage.classList.add("is-switching");
      switchTimer = window.setTimeout(() => {
        applySlide(slides[activeIndex]);
        window.requestAnimationFrame(() => stage.classList.remove("is-switching"));
      }, 140);
    };

    applySlide(slides[activeIndex]);
    if (prev) prev.addEventListener("click", () => setSlide(activeIndex - 1));
    if (next) next.addEventListener("click", () => setSlide(activeIndex + 1));
  });

  document.querySelectorAll("[data-directional-media]").forEach((media) => {
    const image = media.querySelector("[data-directional-image]");
    const prev = media.querySelector("[data-directional-prev]");
    const next = media.querySelector("[data-directional-next]");
    const slides = Array.from(media.querySelectorAll("[data-directional-slide]"))
      .map((slide) => ({
        image: slide.getAttribute("data-image") || "",
        alt: slide.getAttribute("data-alt") || "",
      }))
      .filter((slide) => slide.image);

    if (!image || slides.length < 2) return;

    let activeIndex = Math.max(0, slides.findIndex((slide) => slide.image === image.getAttribute("src")));
    let switchTimer;

    const applySlide = (slide) => {
      image.src = slide.image;
      image.alt = slide.alt;
      media.setAttribute("data-directional-current", String(activeIndex + 1));
    };

    const setSlide = (nextIndex) => {
      activeIndex = (nextIndex + slides.length) % slides.length;
      window.clearTimeout(switchTimer);
      media.classList.add("is-switching");
      switchTimer = window.setTimeout(() => {
        applySlide(slides[activeIndex]);
        window.requestAnimationFrame(() => media.classList.remove("is-switching"));
      }, 120);
    };

    applySlide(slides[activeIndex]);
    if (prev) prev.addEventListener("click", () => setSlide(activeIndex - 1));
    if (next) next.addEventListener("click", () => setSlide(activeIndex + 1));
  });

  document.querySelectorAll("[data-video-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const wrapper = button.closest(".story-video-media, .video-band");
      const video = wrapper ? wrapper.querySelector("video") : null;
      if (!video) return;
      if (video.paused) {
        video.play();
        button.textContent = "Pause";
      } else {
        video.pause();
        button.textContent = "Play";
      }
    });
  });

  document.querySelectorAll("[data-mute-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const wrapper = button.closest(".story-video-media, .video-band");
      const video = wrapper ? wrapper.querySelector("video") : null;
      if (!video) return;
      video.muted = !video.muted;
      button.textContent = video.muted ? "Unmute" : "Mute";
    });
  });

  function initLegacyAutoTimeline() {
    const timeline = document.querySelector(".legacy-timeline");
    if (!timeline) return;
    const cards = Array.from(timeline.querySelectorAll(".legacy-timeline-item"));
    if (!cards.length) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let activeIndex = -1;
    let frame = null;

    const setTimelineExpanded = (card, expand, immediate = false) => {
      const body = card.querySelector(".legacy-timeline-body");
      const summary = card.querySelector("summary");
      const row = card.closest(".legacy-timeline-row");
      if (!body || !summary) return;

      const setMediaHeight = (height) => {
        if (!row) return;
        row.style.setProperty("--legacy-media-height", `${Math.ceil(height)}px`);
      };

      const clearMediaHeight = () => {
        if (!row) return;
        row.style.removeProperty("--legacy-media-height");
      };

      const measureExpandedCardHeight = () => {
        const host = document.createElement("div");
        const clone = card.cloneNode(true);
        const cloneBody = clone.querySelector(".legacy-timeline-body");
        host.className = row ? row.className : "legacy-timeline-row is-left";
        host.classList.add("is-expanded", "legacy-measure-row");
        host.style.position = "absolute";
        host.style.inset = "0 auto auto -99999px";
        host.style.width = row ? `${row.getBoundingClientRect().width}px` : `${timeline.getBoundingClientRect().width}px`;
        host.style.height = "auto";
        host.style.visibility = "hidden";
        host.style.pointerEvents = "none";
        clone.open = true;
        clone.classList.add("is-expanded");
        clone.classList.remove("motion-reveal", "motion-reveal-left", "is-revealed");
        clone.style.height = "auto";
        clone.style.transition = "none";
        clone.style.transform = "none";
        if (cloneBody) {
          cloneBody.style.height = "auto";
          cloneBody.style.opacity = "1";
          cloneBody.style.transform = "none";
          cloneBody.style.transition = "none";
        }
        host.appendChild(clone);
        timeline.appendChild(host);
        const height = Math.ceil(clone.getBoundingClientRect().height);
        host.remove();
        return height;
      };

      card.open = true;
      summary.setAttribute("aria-expanded", expand ? "true" : "false");

      if (prefersReducedMotion || immediate) {
        card.classList.toggle("is-expanded", expand);
        body.style.height = expand ? "auto" : "0px";
        if (row) row.classList.toggle("is-expanded", expand);
        if (expand) {
          setMediaHeight(card.getBoundingClientRect().height);
        } else {
          clearMediaHeight();
        }
        return;
      }

      if (expand) {
        if (card.classList.contains("is-expanded")) {
          setMediaHeight(card.getBoundingClientRect().height);
          if (row) row.classList.add("is-expanded");
          return;
        }
        body.style.height = "0px";
        const targetCardHeight = measureExpandedCardHeight();
        card.classList.add("is-expanded");
        setMediaHeight(targetCardHeight);
        if (row) row.classList.add("is-expanded");
        body.getBoundingClientRect();
        body.style.height = `${body.scrollHeight}px`;
        body.addEventListener("transitionend", function onEnd(event) {
          if (event.propertyName !== "height") return;
          body.removeEventListener("transitionend", onEnd);
          if (card.classList.contains("is-expanded")) {
            body.style.height = "auto";
            setMediaHeight(card.getBoundingClientRect().height);
          }
        });
        return;
      }

      if (!card.classList.contains("is-expanded")) return;
      setMediaHeight(card.getBoundingClientRect().height);
      if (body.style.height === "auto" || !body.style.height) {
        body.style.height = `${body.scrollHeight}px`;
      }
      body.getBoundingClientRect();
      card.classList.remove("is-expanded");
      if (row) row.classList.remove("is-expanded");
      body.style.height = "0px";
      body.addEventListener("transitionend", function onEnd(event) {
        if (event.propertyName !== "height") return;
        body.removeEventListener("transitionend", onEnd);
        if (!card.classList.contains("is-expanded")) clearMediaHeight();
      });
    };

    cards.forEach((card, index) => {
      const summary = card.querySelector("summary");
      const startsOpen = card.hasAttribute("open");
      card.open = true;
      card.classList.add("legacy-smooth-ready");
      setTimelineExpanded(card, startsOpen, true);
      card.classList.toggle("is-center-active", startsOpen);
      if (startsOpen) activeIndex = index;

      if (summary) {
        summary.addEventListener("click", (event) => {
          event.preventDefault();
          if (card.classList.contains("is-expanded")) {
            activeIndex = index;
            card.classList.add("is-center-active");
            setTimelineExpanded(card, true);
            return;
          }
          setActive(index);
        });
      }
    });

    const setActive = (index) => {
      if (index < 0) return;
      if (index === activeIndex && cards[index] && cards[index].classList.contains("is-expanded")) {
        syncExpandedMediaHeights();
        return;
      }
      activeIndex = index;
      cards.forEach((card, cardIndex) => {
        const isActive = cardIndex === index;
        setTimelineExpanded(card, isActive);
        card.classList.toggle("is-center-active", isActive);
      });
    };

    const updateActiveCard = () => {
      frame = null;
      const viewportCenter = (window.innerHeight || document.documentElement.clientHeight) / 2;
      let nearestIndex = -1;
      let nearestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenter - viewportCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      if (nearestIndex >= 0) setActive(nearestIndex);
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveCard);
    };

    const syncExpandedMediaHeights = () => {
      cards.forEach((card) => {
        const row = card.closest(".legacy-timeline-row");
        if (!row || !card.classList.contains("is-expanded")) return;
        row.style.setProperty("--legacy-media-height", `${Math.ceil(card.getBoundingClientRect().height)}px`);
      });
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", () => {
      syncExpandedMediaHeights();
      scheduleUpdate();
    }, { passive: true });
    window.addEventListener("load", scheduleUpdate, { once: true });
  }

  initLegacyAutoTimeline();

  function initMotionEnhancements() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.classList.add("motion-js");
    document.documentElement.classList.toggle("motion-reduced", prefersReducedMotion);

    const revealGroups = [
      ".pdf-hero, .hero, .page-hero, .project-hero, .pdf-intro-grid, .editorial-wrap, .section-head, .kpd-section-head, .kpd-section, .kpd-page-intro, .kpd-detail-grid, .kpd-contact-grid, .kpd-media-band, .kpd-legal-block, .about-story-grid, .about-dual-block, .about-chairman, .about-ceo, .about-value-band, .about-management, .news-feature-grid, .single-project-intro-grid, .single-project-section-head, .single-project-contact-grid, .single-project-gallery, .single-project-value, .single-project-location, .single-project-travel, .image-band, .experience-gallery, .pdf-vertical-gallery, .pdf-development-banner, .pdf-contact-block, .pdf-experience-map, .pdf-events-head, .pdf-sunset-band, .dark-band, .projects-collection-opening, .projects-collection-statement, .projects-featured-card, .footer_header, .footer_legal_social",
      ".pdf-stat, .stat, .pdf-dev-card, .pdf-event-card, .kpd-card, .kpd-news-card, .kpd-property-card, .kpd-press-card, .kpd-update-card, .kpd-info-card, .kpd-form-card, .project-card, .projects-pdf-card, .news-card, .feature-card, .gallery-card, .gallery-feature, .about-story-copy, .about-story-media, .about-dual-block article, .about-mission-card, .about-chairman-media, .about-chairman-copy, .about-ceo-media, .about-ceo-copy, .about-management-card, .news-feature-media, .single-project-render-carousel, .single-project-amenities-board, .single-project-amenity-card, .single-project-form, .about-expertise-panel.active, .about-expertise-icons > div, .footer_links_col, .footer_links_newsletter",
      ".pdf-contact-block h2, .pdf-events-head h2, .kpd-title, .editorial-title, .about-expertise-tabs, .collection-card, .timeline-item, .contact-route, .investor-card"
    ];
    const revealTargets = [];
    revealGroups.forEach((selector, groupIndex) => {
      document.querySelectorAll(selector).forEach((element, index) => {
        if (element.closest(".site-header, .menu-panel, .booking-modal, .floor-modal, .lightbox-modal, .bio-modal")) return;
        if (!element.classList.contains("motion-reveal")) element.classList.add("motion-reveal");
        if (groupIndex === 2) element.classList.add("motion-reveal-left");
        if (!element.style.getPropertyValue("--motion-delay")) {
          element.style.setProperty("--motion-delay", `${Math.min(index % 6, 5) * 70}ms`);
        }
        if (!revealTargets.includes(element)) revealTargets.push(element);
      });
    });
    document.querySelectorAll(".motion-reveal").forEach((element, index) => {
      if (element.closest(".site-header, .menu-panel, .booking-modal, .floor-modal, .lightbox-modal, .bio-modal")) return;
      if (!element.style.getPropertyValue("--motion-delay")) {
        element.style.setProperty("--motion-delay", `${Math.min(index % 6, 5) * 70}ms`);
      }
      if (!revealTargets.includes(element)) revealTargets.push(element);
    });

    const reveal = (element) => element.classList.add("is-revealed");
    const revealVisible = () => {
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      revealTargets.forEach((element) => {
        if (element.classList.contains("is-revealed")) return;
        const rect = element.getBoundingClientRect();
        if (rect.top < viewportHeight * 0.9 && rect.bottom > viewportHeight * 0.04) reveal(element);
      });
    };
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealVisible();
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });

      revealTargets.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
          reveal(element);
        } else {
          observer.observe(element);
        }
      });
    }
    let revealFrame = null;
    const scheduleReveal = () => {
      if (revealFrame) return;
      revealFrame = window.requestAnimationFrame(() => {
        revealFrame = null;
        revealVisible();
      });
    };
    window.addEventListener("scroll", scheduleReveal, { passive: true });
    window.addEventListener("resize", scheduleReveal);
    window.addEventListener("load", scheduleReveal, { once: true });
    window.setTimeout(revealVisible, 120);

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!prefersReducedMotion && finePointer) {
      const interactiveCards = document.querySelectorAll(".pdf-dev-card, .pdf-event-card, .kpd-card, .kpd-news-card, .kpd-property-card, .kpd-press-card, .kpd-update-card, .kpd-info-card, .project-card, .projects-featured-card, .projects-pdf-card, .news-card, .feature-card, .gallery-card, .about-mission-card, .about-management-card, .single-project-amenity-card");
      interactiveCards.forEach((card) => {
        card.classList.add("motion-tilt");
        const resetMotion = () => {
          card.classList.remove("is-tilting", "is-pressing");
          card.style.setProperty("--motion-rotate-x", "0deg");
          card.style.setProperty("--motion-rotate-y", "0deg");
          card.style.setProperty("--motion-image-x", "0px");
          card.style.setProperty("--motion-image-y", "0px");
        };

        card.addEventListener("pointermove", (event) => {
          const rect = card.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          card.classList.add("is-tilting");
          card.style.setProperty("--motion-rotate-x", `${(-y * 4).toFixed(2)}deg`);
          card.style.setProperty("--motion-rotate-y", `${(x * 4).toFixed(2)}deg`);
          card.style.setProperty("--motion-image-x", `${(-x * 8).toFixed(2)}px`);
          card.style.setProperty("--motion-image-y", `${(-y * 8).toFixed(2)}px`);
        }, { passive: true });
        card.addEventListener("pointerleave", resetMotion);
        card.addEventListener("pointerdown", () => card.classList.add("is-pressing"));
        card.addEventListener("pointerup", () => card.classList.remove("is-pressing"));
        card.addEventListener("blur", resetMotion);
      });
    }
  }

  initMotionEnhancements();

  if (goTop) {
    goTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenu(false);
      setModal(false);
      setFloorModal(false);
      setLightbox(false);
      setBioModal(false);
    }
  });

  window.addEventListener("scroll", () => {
    if (!header || document.body.classList.contains("menu-open")) return;
    const nextY = window.scrollY;
    updateHeaderHeroState(nextY);
    if (nextY > lastY && nextY > 120) {
      header.classList.add("hide");
    } else {
      header.classList.remove("hide");
    }
    if (goTop) {
      const footerRect = footer ? footer.getBoundingClientRect() : null;
      const footerInView = footerRect ? footerRect.top < window.innerHeight && footerRect.bottom > 0 : false;
      goTop.classList.toggle("visible", nextY > 700 && !footerInView);
    }
    updateFloatingContactState(nextY);
    document.querySelectorAll(".project-anchor-inner a[href^='#']").forEach((link) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      const rect = target.getBoundingClientRect();
      link.classList.toggle("active", rect.top <= 160 && rect.bottom >= 160);
    });
    lastY = nextY;
  }, { passive: true });

  window.addEventListener("resize", () => updateHeaderHeroState(), { passive: true });

  document.querySelectorAll("[data-fade-slider]").forEach((slider) => {
    const slides = Array.from(slider.querySelectorAll(".slide"));
    if (slides.length < 2) return;
    let index = 0;
    window.setInterval(() => {
      slides[index].classList.remove("active");
      index = (index + 1) % slides.length;
      slides[index].classList.add("active");
    }, 4200);
  });
})();
