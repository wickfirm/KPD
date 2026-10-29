// Current enquiry copy, kept separate from the delivered interaction layer so
// every React-rendered page and its persisted modal receive the same wording.
(function () {
  const copy = window.__KPD_CONTACT || {};
  function updateInquiryForm() {
    const modal = document.querySelector(".booking-modal");
    const card = modal && modal.querySelector(".booking-card");
    if (!card) return;

    const title = card.querySelector("#booking-title");
    if (title) title.textContent = copy.popupTitle || "Start a conversation.";

    const intro = card.querySelector("#booking-title + p");
    if (intro) intro.textContent = copy.popupIntro || "Tell us about your property enquiry.";

    const form = card.querySelector(".booking-lead-form");
    if (!form) return;
    const fields = form.querySelectorAll("input.booking-lead-field");
    if (fields[0]) fields[0].setAttribute("placeholder", "Full name");
    if (fields[1]) fields[1].setAttribute("placeholder", "Email address");
    if (fields[2]) fields[2].setAttribute("placeholder", "Phone number");

    const interest = form.querySelector('select[name="Interest"]');
    if (interest) {
      const projects = Array.isArray(copy.projects) ? copy.projects : [];
      const extras = ["Online Call", "Customer Experience Centre Visit", "Investing", "Broker Partnership"];
      const choices = Array.isArray(copy.popupInterests) && copy.popupInterests.length ? copy.popupInterests : projects.concat(extras);
      const escape = (value) => String(value).replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]));
      interest.innerHTML = `<option value="">Interested in:</option>${choices.map((name) => `<option>${escape(name)}</option>`).join("")}`;
    }

    const message = form.querySelector('textarea[name="Message"]');
    if (message) message.setAttribute("placeholder", "Message");
    const submit = form.querySelector(".booking-lead-submit");
    if (submit) submit.textContent = copy.popupSubmitLabel || "Send enquiry";

    const note = card.querySelector(".booking-privacy-note");
    if (note) note.textContent = copy.popupNote || "Our team will be in touch personally to discuss your enquiry. A member of our team will respond personally.";
  }

  updateInquiryForm();
})();
