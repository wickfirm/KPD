(() => {
  const formatMoney = new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 });
  const formatDate = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });
  const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const money = (value) => formatMoney.format(Math.max(0, value));
  const date = (value) => {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.valueOf()) ? "Date to be confirmed" : formatDate.format(parsed);
  };
  const payment = (principal, annualRate, years) => {
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12;
    if (!monthlyRate) return principal / months;
    return principal * (monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1);
  };
  const escape = (value) => String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]));

  function plannerMarkup(compact) {
    return `<section class="ownership-planner${compact ? " ownership-planner--compact" : ""}" aria-label="Ownership Cost Planner">
      <div class="ownership-planner__intro"><span class="kpd-eyebrow">Ownership Cost Planner</span><h2>Plan the path to ownership.</h2><p>Review indicative payment milestones, fees and optional handover financing for your selected KPD residence.</p></div>
      <div class="ownership-planner__body"><form class="ownership-planner__form" novalidate>
        <label><span>Development</span><select data-planner-project></select></label>
        <label><span>Purchase price</span><div class="ownership-planner__price"><details class="ownership-planner__price-acc" data-planner-price-acc><summary><span><span class="ownership-planner__price-current" data-planner-price-label></span><em class="ownership-planner__price-source" data-planner-price-source></em></span><i aria-hidden="true"></i></summary><div class="ownership-planner__price-list" data-planner-price-list></div><button type="button" class="ownership-planner__price-custom" data-planner-price-custom>Enter a custom amount</button></details><div class="ownership-planner__amount ownership-planner__amount--manual" data-planner-price-manual hidden><span>AED</span><input data-planner-price type="number" min="100000" step="50000" inputmode="numeric" aria-label="Custom purchase price"></div></div></label>
        <label><span>Residency status</span><select data-planner-residency><option value="resident">UAE resident</option><option value="national">UAE national</option><option value="nonResident">Non-resident</option></select></label>
        <label class="ownership-planner__toggle"><input data-planner-finance type="checkbox"><span>Finance handover balance</span></label>
        <div class="ownership-planner__finance" data-planner-finance-fields hidden>
          <label><span>Loan amount <b data-planner-loan-label></b></span><input data-planner-loan type="range" min="0" step="1"><small data-planner-loan-help></small></label>
          <div class="ownership-planner__finance-grid"><label><span>Loan period</span><select data-planner-period><option value="5">5 years</option><option value="10">10 years</option><option value="15">15 years</option><option value="20">20 years</option><option value="25" selected>25 years</option></select></label><label><span>Interest rate</span><div class="ownership-planner__amount"><input data-planner-rate type="number" min="0" max="20" step="0.01" inputmode="decimal"><span>%</span></div></label></div>
        </div>
      </form><div class="ownership-planner__results" aria-live="polite"><div class="ownership-planner__result-head"><span>Indicative plan</span><strong data-planner-before-keys></strong></div><ol class="ownership-planner__timeline" data-planner-timeline></ol><div class="ownership-planner__fees"><h3>One-off fees</h3><dl data-planner-fees></dl></div><div class="ownership-planner__mortgage" data-planner-mortgage hidden><span>Monthly payment after handover</span><strong data-planner-monthly></strong><small data-planner-mortgage-detail></small></div><button class="btn-pill ownership-planner__cta" type="button" data-planner-discuss>Discuss this plan</button><p class="ownership-planner__disclaimer" data-planner-disclaimer></p></div></div>
    </section>`;
  }

  function mount(holder, settings) {
    const compact = holder.dataset.plannerCompact === "true";
    // Server-rendered pages include the calculator HTML in the initial paint;
    // only build it here when the mount point is empty (static fallback).
    if (!holder.querySelector(".ownership-planner")) {
      holder.innerHTML = plannerMarkup(compact);
    }
    const find = (selector) => holder.querySelector(selector);
    const projectField = find("[data-planner-project]"); const priceField = find("[data-planner-price]"); const residencyField = find("[data-planner-residency]");
    const financeField = find("[data-planner-finance]"); const financeFields = find("[data-planner-finance-fields]"); const loanField = find("[data-planner-loan]"); const rateField = find("[data-planner-rate]"); const periodField = find("[data-planner-period]");
    const initialProject = holder.dataset.plannerProject;
    projectField.innerHTML = settings.projects.map((project) => `<option value="${escape(project.slug)}">${escape(project.name)}</option>`).join("");
    if (settings.projects.some((project) => project.slug === initialProject)) projectField.value = initialProject;
    const selected = () => settings.projects.find((project) => project.slug === projectField.value) || settings.projects[0];
    // ── Purchase price accordion: selected development's starting price + manual entry ──
    const priceAcc = find("[data-planner-price-acc]"); const priceList = find("[data-planner-price-list]"); const priceLabel = find("[data-planner-price-label]"); const priceSource = find("[data-planner-price-source]"); const priceManual = find("[data-planner-price-manual]");
    const buildPriceList = () => {
      const project = selected();
      priceList.innerHTML = `<button type="button" class="ownership-planner__price-option is-active" data-planner-price-option="${escape(project.slug)}"><strong>${escape(project.name)}</strong><em>from ${money(project.startingPrice)}</em></button>`;
    };
    buildPriceList();
    const syncPriceUi = () => {
      const project = selected(); const price = number(priceField.value); const custom = priceAcc.classList.contains("is-custom");
      priceLabel.textContent = money(price);
      priceSource.textContent = project.name;
      priceManual.hidden = !custom;
      priceList.querySelectorAll("[data-planner-price-option]").forEach((option) => option.classList.toggle("is-active", !custom && option.getAttribute("data-planner-price-option") === project.slug && price === project.startingPrice));
    };
    priceList.addEventListener("click", (event) => {
      const option = event.target.closest("[data-planner-price-option]");
      if (!option) return;
      const project = settings.projects.find((item) => item.slug === option.getAttribute("data-planner-price-option"));
      if (!project) return;
      priceAcc.classList.remove("is-custom");
      priceField.value = project.startingPrice;
      priceAcc.removeAttribute("open");
      update();
    });
    find("[data-planner-price-custom]").addEventListener("click", () => {
      priceAcc.classList.add("is-custom");
      priceManual.hidden = false;
      priceAcc.removeAttribute("open");
      priceField.focus();
      update();
    });
    const update = ({ resetPrice = false } = {}) => {
      const project = selected();
      if (resetPrice || !number(priceField.value)) priceField.value = project.startingPrice;
      if (resetPrice || !number(rateField.value)) rateField.value = project.interestRate;
      const price = number(priceField.value); const handover = project.milestones[project.milestones.length - 1] || { percentage: 0 };
      syncPriceUi();
      const maximumLoan = Math.min(number(settings.ltv[residencyField.value]) / 100 * price, handover.percentage / 100 * price);
      loanField.max = String(Math.round(maximumLoan / price * 100));
      if (resetPrice || number(loanField.value) > number(loanField.max) || !number(loanField.value)) loanField.value = loanField.max;
      const finance = financeField.checked; const loan = price * number(loanField.value) / 100;
      financeFields.hidden = !finance;
      find("[data-planner-loan-label]").textContent = `${loanField.value}% of price`;
      find("[data-planner-loan-help]").textContent = `Capped at ${Math.round(maximumLoan / price * 100)}% based on the selected residency status and handover balance.`;
      const dld = price * number(settings.dldRate) / 100; const baseFees = dld + number(settings.registrationFee);
      const mortgageRegistration = finance ? loan * number(settings.mortgageRegistrationRate) / 100 + number(settings.mortgageAdminFee) : 0;
      const bankFee = finance ? loan * number(settings.bankArrangementRate) / 100 * (1 + number(settings.vatRate) / 100) : 0;
      const milestoneCash = project.milestones.reduce((sum, milestone, index) => sum + (finance && index === project.milestones.length - 1 ? 0 : price * milestone.percentage / 100), 0);
      const beforeKeys = milestoneCash + baseFees + mortgageRegistration + bankFee;
      find("[data-planner-before-keys]").textContent = money(beforeKeys);
      find("[data-planner-timeline]").innerHTML = project.milestones.map((milestone, index) => { const financed = finance && index === project.milestones.length - 1; return `<li><span>${escape(milestone.label)}<small>${date(milestone.date)}</small></span><strong>${financed ? `${money(loan)} financed` : money(price * milestone.percentage / 100)}</strong></li>`; }).join("");
      find("[data-planner-fees]").innerHTML = `<div><dt>DLD transfer fee</dt><dd>${money(dld)}</dd></div><div><dt>Registration and admin</dt><dd>${money(number(settings.registrationFee))}</dd></div>${finance ? `<div><dt>Mortgage registration</dt><dd>${money(mortgageRegistration)}</dd></div><div><dt>Bank arrangement fee</dt><dd>${money(bankFee)}</dd></div>` : ""}`;
      const mortgage = find("[data-planner-mortgage]"); mortgage.hidden = !finance;
      if (finance) { find("[data-planner-monthly]").textContent = money(payment(loan, number(rateField.value), number(periodField.value))); find("[data-planner-mortgage-detail]").textContent = `${money(loan)} over ${periodField.value} years at ${rateField.value}% p.a.`; }
      find("[data-planner-disclaimer]").textContent = settings.disclaimer;
      find("[data-planner-discuss]").onclick = () => { const scenario = `${project.name}: purchase price ${money(price)}; ${finance ? `financing ${money(loan)} at ${rateField.value}% over ${periodField.value} years; ` : ""}cash required before keys ${money(beforeKeys)}.`; sessionStorage.setItem("kpdPlannerScenario", scenario); sessionStorage.setItem("kpdPlannerProject", project.name); const opener = document.querySelector("[data-booking-launcher]"); if (opener) { opener.click(); } else { window.location.href = "/contact#experience-center"; } };
    };
    projectField.addEventListener("change", () => { priceAcc.classList.remove("is-custom"); buildPriceList(); update({ resetPrice: true }); });
    [priceField, residencyField, financeField, loanField, rateField, periodField].forEach((field) => field.addEventListener("input", () => update()));
    update({ resetPrice: true });
  }

  const holders = document.querySelectorAll("[data-kpd-planner]");
  if (!holders.length) return;
  holders.forEach((holder) => {
    holder.innerHTML = `<div class="ownership-planner-loading"><div class="ownership-planner-loading__form"><div class="ownership-planner-loading__label"><span>Development</span><div class="ownership-planner-loading__field"></div></div><div class="ownership-planner-loading__label"><span>Purchase price</span><div class="ownership-planner-loading__field"></div></div><div class="ownership-planner-loading__label"><span>Residency status</span><div class="ownership-planner-loading__field"></div></div></div><div class="ownership-planner-loading__results"><div class="ownership-planner-loading__row" style="width:60%"></div><div class="ownership-planner-loading__row" style="width:100%"></div><div class="ownership-planner-loading__row" style="width:80%"></div><div class="ownership-planner-loading__row" style="width:90%"></div><div class="ownership-planner-loading__row" style="width:50%"></div></div></div>`;
  });
  fetch("/api/calculator/kpd").then((response) => response.ok ? response.json() : Promise.reject()).then((settings) => holders.forEach((holder) => mount(holder, settings))).catch(() => holders.forEach((holder) => { holder.innerHTML = '<p class="ownership-planner__unavailable">The planner is temporarily unavailable. Please contact the KPD team for a tailored payment plan.</p>'; }));

  // ── Prefill the booking modal with a saved planner scenario. Works with
  // both the legacy site.js modal (textarea name="Message") and the migrated
  // React booking widget (textarea name="message"). ──
  const bookingModal = document.querySelector(".booking-modal");
  if (bookingModal && typeof MutationObserver === "function") {
    const fillScenario = () => {
      if (!bookingModal.classList.contains("open")) return;
      const scenario = sessionStorage.getItem("kpdPlannerScenario");
      if (!scenario) return;
      const message = bookingModal.querySelector("textarea[name='Message'], textarea[name='message']");
      if (message && !message.value) message.value = scenario;
    };
    new MutationObserver(fillScenario).observe(bookingModal, { attributes: true, attributeFilter: ["class"] });
    fillScenario();
  }
})();
