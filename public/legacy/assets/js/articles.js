(function () {
  const articles = {
    news: {
      "design-underwriting-endurance": {
        type: "News",
        date: "June 10, 2026",
        title: "Design, Underwriting & Endurance Forum",
        summary: "A closed-room discussion on land logic, delivery discipline, design intent, and how long-horizon value is protected before a project reaches market.",
        image: "assets/images/library/bottom-up-view-of-modern-office-building-in-hong-k-2026-03-26-06-21-57-utc.jpg",
        imageAlt: "Dubai financial district and real estate context",
        body: [
          "KPD convened a focused forum around the relationship between design, underwriting, and long-term project relevance. The conversation centered on how early feasibility decisions shape every later layer of a development, from frontage and arrival to operations, maintenance, leasing, and resale confidence.",
          "The session treated design as a commercial discipline rather than a decorative layer. Participants discussed why enduring residential value depends on a project being clear about its audience, its service logic, its public edges, and the daily routines it supports.",
          "For KPD, this is where development begins: with the patience to test assumptions, the restraint to avoid unnecessary complexity, and the discipline to make places that remain useful and memorable beyond launch."
        ]
      },
      "seven-x-seven-project-note": {
        type: "News",
        date: "Project Note",
        title: "Seven X Seven: A Denser Urban Brief",
        summary: "A sharper urban mixed-use brief built around positioning, movement, and future delivery logic.",
        image: "assets/images/project-media/sxs/facade%20left%202.png",
        imageAlt: "Seven X Seven facade render",
        body: [
          "Seven X Seven is shaped around an urban reading of density, frontage, and movement. The project is positioned to make its address, arrival sequence, and residential experience feel coherent from the street to the private interior.",
          "Rather than relying on scale alone, the project uses measured facade rhythm, amenity logic, and material restraint to create a residential experience that is composed and commercially legible.",
          "The development reflects KPD's wider approach: every spatial decision should carry operational, experiential, and long-term value."
        ]
      },
      "emerald-villa-private-preview": {
        type: "News",
        date: "May 22, 2026",
        title: "Emerald Villa Private Preview",
        summary: "An invitation-only preview of Emerald Villa's planning, amenity story, and garden-led residential experience.",
        image: "assets/images/project-media/Emerald%20Villa/12_2.jpg",
        imageAlt: "Emerald Villa exterior arrival",
        body: [
          "Emerald Villa was presented through a private preview focused on the relationship between arrival, landscape, privacy, and interior calm. The walkthrough introduced the project as a residential environment shaped for family-scaled living and long-horizon ownership.",
          "The preview highlighted the role of garden rooms, shaded outdoor areas, and warm interior materiality in creating a home that feels generous without becoming performative.",
          "KPD's team framed the project as a quieter expression of luxury: one built around clarity, daily use, and a composed sense of permanence."
        ]
      }
    },
    blog: {
      "land-logic-before-form": {
        type: "Blog",
        date: "Market Notes",
        title: "Land Logic Before Form",
        summary: "Why site constraints, arrival, frontage, and address behavior shape the earliest development decisions.",
        image: "assets/images/blog/blog-4.jpg",
        imageAlt: "Urban skyline and development context",
        body: [
          "Every durable project begins before architecture. It starts with land logic: what a site allows, what it resists, how it is approached, and how its edges will be read over time.",
          "Frontage, visibility, service access, arrival rhythm, and surrounding movement patterns all influence the kind of product a site can support. Treating those inputs carefully gives a project its first layer of discipline.",
          "When form follows that logic, the architecture has a clearer job. It does not need to compensate for weak positioning; it can refine a proposition that already understands its place."
        ]
      },
      "what-makes-yield-durable": {
        type: "Blog",
        date: "Investor Lens",
        title: "What Makes Yield Durable",
        summary: "A note on rental readiness, service-charge discipline, and product features that remain relevant beyond launch.",
        image: "assets/images/blog/blog-5.jpg",
        imageAlt: "Residential landscape and market context",
        body: [
          "Yield durability is rarely created by one headline number. It is built through a sequence of small decisions that make a property easy to understand, easy to operate, and easy to live in.",
          "Rental readiness depends on product clarity, furnishing logic, maintenance discipline, and amenities that support real routines rather than marketing lists. Service-charge control matters because it protects the net experience for owners and tenants alike.",
          "The strongest projects remain legible after launch. They offer a clear reason to be chosen again, not just a reason to be noticed once."
        ]
      },
      "quiet-architecture": {
        type: "Blog",
        date: "Design Notes",
        title: "Quiet Architecture",
        summary: "How restraint, material clarity, and practical operations can create a stronger residential experience.",
        image: "assets/images/blog/blog-6.jpg",
        imageAlt: "Modern facade and residential materiality",
        body: [
          "Quiet architecture does not mean passive architecture. It means design that knows when to hold back, when to frame, and when to let daily life take priority.",
          "In residential development, restraint can be a form of confidence. Clear materials, controlled light, practical circulation, and durable details often create a stronger experience than excessive visual noise.",
          "For KPD, the aim is not to make buildings that shout at first glance. It is to make places that continue to feel considered after years of use."
        ]
      }
    }
  };

  function getArticle(kind, slug) {
    const bucket = articles[kind] || articles.news;
    return bucket[slug] || bucket[Object.keys(bucket)[0]];
  }

  function initArticlePage() {
    const root = document.querySelector("[data-article-page]");
    if (!root) return;

    const kind = root.getAttribute("data-article-kind") || "news";
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("article");
    const article = getArticle(kind, slug);

    document.title = `${article.title} | Kasumigaseki Properties Development`;

    const type = root.querySelector("[data-article-type]");
    const date = root.querySelector("[data-article-date]");
    const title = root.querySelector("[data-article-title]");
    const summary = root.querySelector("[data-article-summary]");
    const image = root.querySelector("[data-article-image]");
    const body = root.querySelector("[data-article-body]");

    if (type) type.textContent = article.type;
    if (date) date.textContent = article.date;
    if (title) title.textContent = article.title;
    if (summary) summary.textContent = article.summary;
    if (image) {
      image.src = article.image;
      image.alt = article.imageAlt;
    }
    if (body) {
      body.innerHTML = "";
      article.body.forEach((paragraph) => {
        const p = document.createElement("p");
        p.textContent = paragraph;
        body.appendChild(p);
      });
    }
  }

  initArticlePage();
})();
