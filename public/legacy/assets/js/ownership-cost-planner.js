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
        <label><span>Purchase price</span><div class="ownership-planner__amount"><span>AED</span><input data-planner-price type="number" min="100000" step="50000" inputmode="numeric"></div></label>
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
    holder.innerHTML = plannerMarkup(compact);
    const find = (selector) => holder.querySelector(selector);
    const projectField = find("[data-planner-project]"); const priceField = find("[data-planner-price]"); const residencyField = find("[data-planner-residency]");
    const financeField = find("[data-planner-finance]"); const financeFields = find("[data-planner-finance-fields]"); const loanField = find("[data-planner-loan]"); const rateField = find("[data-planner-rate]"); const periodField = find("[data-planner-period]");
    const initialProject = holder.dataset.plannerProject;
    projectField.innerHTML = settings.projects.map((project) => `<option value="${escape(project.slug)}">${escape(project.name)}</option>`).join("");
    if (settings.projects.some((project) => project.slug === initialProject)) projectField.value = initialProject;
    const selected = () => settings.projects.find((project) => project.slug === projectField.value) || settings.projects[0];
    const update = ({ resetPrice = false } = {}) => {
      const project = selected();
      if (resetPrice || !number(priceField.value)) priceField.value = project.startingPrice;
      if (resetPrice || !number(rateField.value)) rateField.value = project.interestRate;
      const price = number(priceField.value); const handover = project.milestones[project.milestones.length - 1] || { percentage: 0 };
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
      find("[data-planner-discuss]").onclick = () => { const scenario = `${project.name}: purchase price ${money(price)}; ${finance ? `financing ${money(loan)} at ${rateField.value}% over ${periodField.value} years; ` : ""}cash required before keys ${money(beforeKeys)}.`; sessionStorage.setItem("kpdPlannerScenario", scenario); sessionStorage.setItem("kpdPlannerProject", project.name); window.location.href = "/contact#experience-center"; };
    };
    projectField.addEventListener("change", () => update({ resetPrice: true }));
    [priceField, residencyField, financeField, loanField, rateField, periodField].forEach((field) => field.addEventListener("input", () => update()));
    update({ resetPrice: true });
  }

  const holders = document.querySelectorAll("[data-kpd-planner]");
  if (!holders.length) return;
  fetch("/api/calculator/kpd").then((response) => response.ok ? response.json() : Promise.reject()).then((settings) => holders.forEach((holder) => mount(holder, settings))).catch(() => holders.forEach((holder) => { holder.innerHTML = '<p class="ownership-planner__unavailable">The planner is temporarily unavailable. Please contact the KPD team for a tailored payment plan.</p>'; }));
})();
