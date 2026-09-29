"use client";

import { useEffect } from "react";

/// Restores the legacy floating contact chrome (Enquiry / Call / WhatsApp,
/// back-to-top, bottom-right "Inquiry" launcher) and the booking modal on
/// migrated public routes, which do not load the legacy site.js bundle.
/// Markup and class names mirror public/legacy/assets/js/site.js so the
/// delivered stylesheet styles it unchanged. The lead form posts to
/// /api/contact instead of mailto so enquiries reach the CMS and Salesforce.
export function BookingWidget() {
  useEffect(() => {
    const cleanups: (() => void)[] = [];

    // ── Floating contact ───────────────────────────────────────────────
    let floatingContact = document.querySelector<HTMLElement>("[data-floating-contact]");
    if (!floatingContact) {
      floatingContact = document.createElement("div");
      floatingContact.className = "floating-contact visible";
      floatingContact.setAttribute("data-floating-contact", "");
      floatingContact.innerHTML =
        '<a href="mailto:info@kpd.com?subject=KPD%20Inquiry" class="floating-contact__link" aria-label="Send an enquiry"><span class="floating-contact__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M6.75 6.5H17.25C18.35 6.5 19.25 7.4 19.25 8.5V14.5C19.25 15.6 18.35 16.5 17.25 16.5H11.2L7.2 19.5V16.5H6.75C5.65 16.5 4.75 15.6 4.75 14.5V8.5C4.75 7.4 5.65 6.5 6.75 6.5Z"></path><path d="M8.25 10H15.75"></path><path d="M8.25 13H13.5"></path></svg></span><span>Enquiry</span></a><a href="tel:+97143883099" class="floating-contact__link" aria-label="Call KPD"><span class="floating-contact__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M8.15 5.5L10.15 9.1L8.85 10.4C9.65 12 11 13.35 12.6 14.15L13.9 12.85L17.5 14.85L16.9 17.75C16.75 18.45 16.1 18.95 15.38 18.85C9.95 18.08 5.92 14.05 5.15 8.62C5.05 7.9 5.55 7.25 6.25 7.1L8.15 5.5Z"></path></svg></span><span>Call</span></a><a href="https://wa.me/97143883099" class="floating-contact__link" target="_blank" rel="noopener noreferrer" aria-label="Contact KPD on WhatsApp"><span class="floating-contact__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7.25 18.25L4.75 19.25L5.7 16.65C4.98 15.48 4.58 14.1 4.58 12.62C4.58 8.36 7.99 4.92 12.2 4.92C16.42 4.92 19.83 8.36 19.83 12.62C19.83 16.88 16.42 20.32 12.2 20.32C10.38 20.32 8.7 19.67 7.25 18.25Z"></path><path d="M9.45 9.15C9.25 9.62 9.3 10.68 10.55 12.05C11.8 13.42 13.13 14.05 13.72 13.98L14.75 12.95L16.45 13.78C16.38 14.38 15.98 15.5 14.65 15.72C12.8 16.02 9.42 13.95 8.58 11.45C8.12 10.1 8.72 9.32 9.45 9.15Z"></path></svg></span><span>WhatsApp</span></a>';
      document.body.appendChild(floatingContact);
    }

    // ── Back to top ────────────────────────────────────────────────────
    let goTop = document.querySelector<HTMLButtonElement>(".go-top");
    if (!goTop) {
      goTop = document.createElement("button");
      goTop.className = "go-top";
      goTop.type = "button";
      goTop.setAttribute("aria-label", "Back to top");
      goTop.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 8v16M9 15l7-7 7 7" fill="none" stroke="currentColor" stroke-width="1.5"></path></svg>';
      document.body.appendChild(goTop);
    }
    const goTopClick = () => window.scrollTo({ top: 0, behavior: "smooth" });
    goTop.addEventListener("click", goTopClick);
    cleanups.push(() => goTop?.removeEventListener("click", goTopClick));

    // ── Inquiry launcher (bottom-right pill) ───────────────────────────
    let launcher = document.querySelector<HTMLButtonElement>("[data-booking-launcher]");
    if (!launcher) {
      launcher = document.createElement("button");
      launcher.className = "booking-widget-launcher visible";
      launcher.type = "button";
      launcher.setAttribute("data-booking-launcher", "");
      launcher.setAttribute("aria-label", "Open inquiry form");
      launcher.innerHTML = "<span>Inquiry</span>";
      document.body.appendChild(launcher);
    }

    // ── Booking modal (approved legacy markup/classes) ─────────────────
    let modal = document.querySelector<HTMLElement>(".booking-modal");
    let ownedModal = false;
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "booking-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "booking-title");
      modal.innerHTML =
        '<div class="booking-backdrop" aria-hidden="true" data-booking-close></div>' +
        '<div class="booking-card"><button class="modal-close" type="button" data-booking-close aria-label="Minimize inquiry form"></button>' +
        '<h2 id="booking-title">Inquiry Form</h2>' +
        "<p>Share a few contact details and the KPD team will coordinate the right advisory conversation.</p>" +
        '<p class="booking-plan-note" data-booking-plan-note hidden><strong>From your plan:</strong> <span data-booking-plan-text></span></p>' +
        '<form class="booking-lead-form"><div class="booking-lead-grid">' +
        '<input class="booking-lead-field" type="text" name="name" placeholder="Full name" autocomplete="name" required>' +
        '<input class="booking-lead-field" type="email" name="email" placeholder="Email address" autocomplete="email" required>' +
        '<input class="booking-lead-field" type="tel" name="phone" placeholder="Phone number" autocomplete="tel">' +
        '<select class="booking-lead-field" name="interest" aria-label="Interest"><option value="">Interested in</option><option>Seven X Seven</option><option>Emerald Villa</option><option>Dubai Hills Mansion</option><option>Online call</option></select>' +
        '<textarea class="booking-lead-field booking-lead-message" name="message" placeholder="Short message"></textarea></div>' +
        '<button class="btn-pill booking-primary-button booking-lead-submit text-black" type="submit">Submit inquiry</button>' +
        '<p class="booking-privacy-note" data-booking-status aria-live="polite">The KPD team will respond with the right advisory route.</p></form></div>';
      document.body.appendChild(modal);
      ownedModal = true;
    }

    const form = modal.querySelector<HTMLFormElement>(".booking-lead-form");
    const note = modal.querySelector<HTMLElement>("[data-booking-plan-note]");
    const noteText = modal.querySelector<HTMLElement>("[data-booking-plan-text]");
    const statusLine = modal.querySelector<HTMLElement>("[data-booking-status]");

    let touched = false;

    /// Prefill the message with the planner scenario saved by
    /// ownership-cost-planner.js ("Discuss this plan").
    const applyScenario = () => {
      const scenario = sessionStorage.getItem("kpdPlannerScenario");
      if (!scenario || !form || !note || !noteText) return;
      const message = form.elements.namedItem("message") as HTMLTextAreaElement | null;
      if (message && !message.value) message.value = scenario;
      noteText.textContent = scenario;
      note.hidden = false;
    };

    const setOpen = (open: boolean) => {
      if (!modal || !launcher) return;
      modal.classList.toggle("open", open);
      document.body.classList.toggle("modal-open", open);
      launcher.classList.toggle("visible", !open);
      launcher.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        touched = true;
        applyScenario();
      }
    };

    const launcherClick = () => setOpen(true);
    launcher.addEventListener("click", launcherClick);
    cleanups.push(() => launcher?.removeEventListener("click", launcherClick));

    // Delegated: any [data-booking-open] control anywhere on the page
    // (header "Book online call", Investor Guide CTAs, planner follow-up).
    const documentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && target.closest("[data-booking-open]")) {
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("click", documentClick);
    cleanups.push(() => document.removeEventListener("click", documentClick));

    const modalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && target.closest("[data-booking-close]")) setOpen(false);
    };
    modal.addEventListener("click", modalClick);
    cleanups.push(() => modal?.removeEventListener("click", modalClick));

    const keyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", keyDown);
    cleanups.push(() => document.removeEventListener("keydown", keyDown));

    // ── Lead submission (persists locally, mirrors to Salesforce) ──────
    const submit = (event: Event) => {
      event.preventDefault();
      if (!form || !statusLine) return;
      const data = new FormData(form);
      const payload = {
        name: String(data.get("name") || ""),
        email: String(data.get("email") || ""),
        phone: String(data.get("phone") || ""),
        interest: String(data.get("interest") || ""),
        message: String(data.get("message") || ""),
        sourcePage: "booking-widget",
      };
      const button = form.querySelector<HTMLButtonElement>(".booking-lead-submit");
      if (button) button.disabled = true;
      statusLine.textContent = "Sending your inquiry…";
      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(async (response) => {
          const result = (await response.json().catch(() => ({}))) as { error?: string };
          if (!response.ok) throw new Error(result.error || "Submission failed.");
          sessionStorage.removeItem("kpdPlannerScenario");
          sessionStorage.removeItem("kpdPlannerProject");
          if (note) note.hidden = true;
          form.reset();
          statusLine.textContent = "Thank you — your inquiry has been received. The KPD team will be in touch shortly.";
        })
        .catch((error: unknown) => {
          statusLine.textContent = error instanceof Error ? error.message : "Something went wrong. Please try again.";
        })
        .finally(() => {
          if (button) button.disabled = false;
        });
    };
    form?.addEventListener("submit", submit);
    cleanups.push(() => form?.removeEventListener("submit", submit));

    // ── Legacy parity: open once shortly after arrival unless touched ──
    const timer = window.setTimeout(() => {
      if (!touched) setOpen(true);
    }, 5000);
    cleanups.push(() => window.clearTimeout(timer));

    return () => {
      cleanups.forEach((fn) => fn());
      // Only remove nodes this component created; legacy pages keep theirs.
      if (ownedModal) modal?.remove();
    };
  }, []);

  return null;
}
