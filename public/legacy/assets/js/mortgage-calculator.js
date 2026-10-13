(() => {
  const formatNumber = new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 });

  const parseNumber = (value) => {
    const number = Number(String(value).replace(/[^0-9.]/g, ""));
    return Number.isFinite(number) ? number : 0;
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const formatAed = (value) => `AED ${formatNumber.format(Math.round(value))}`;

  document.querySelectorAll("[data-mortgage-calculator]").forEach((calculator) => {
    const priceInput = calculator.querySelector("#mortgage-price");
    const priceRange = calculator.querySelector("#mortgage-price-range");
    const depositInput = calculator.querySelector("#mortgage-deposit");
    const depositRange = calculator.querySelector("#mortgage-deposit-range");
    const termInput = calculator.querySelector("#mortgage-term");
    const termRange = calculator.querySelector("#mortgage-term-range");
    const rateInput = calculator.querySelector("#mortgage-rate");
    const rateRange = calculator.querySelector("#mortgage-rate-range");
    const statusButtons = Array.from(calculator.querySelectorAll("[data-residency]"));
    const costToggle = calculator.querySelector("[data-cost-toggle]");
    const costClose = calculator.querySelector("[data-cost-close]");
    const costBreakdown = calculator.querySelector("#mortgage-cost-breakdown");

    if (!priceInput || !priceRange || !depositInput || !depositRange || !termInput || !termRange || !rateInput || !rateRange) return;

    let residency = "Non-resident";

    const paintRange = (range) => {
      const min = Number(range.min);
      const max = Number(range.max);
      const progress = ((Number(range.value) - min) / (max - min)) * 100;
      range.style.setProperty("--range-progress", `${clamp(progress, 0, 100)}%`);
    };

    const setText = (selector, value) => {
      const node = calculator.querySelector(selector);
      if (node) node.textContent = value;
    };

    const setValue = (selector, value) => {
      const node = calculator.querySelector(selector);
      if (node) node.value = value;
    };

    const calculate = () => {
      const price = clamp(parseNumber(priceInput.value), Number(priceRange.min), Number(priceRange.max));
      const depositPercent = clamp(Number(depositRange.value), Number(depositRange.min), Number(depositRange.max));
      const deposit = price * (depositPercent / 100);
      const loan = Math.max(0, price - deposit);
      const loanPercent = Math.max(0, 100 - depositPercent);
      const years = clamp(parseNumber(termInput.value), Number(termRange.min), Number(termRange.max));
      const annualRate = clamp(parseNumber(rateInput.value), Number(rateRange.min), Number(rateRange.max));
      const months = years * 12;
      const monthlyRate = annualRate / 100 / 12;
      const monthlyPayment = monthlyRate === 0
        ? loan / months
        : loan * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);

      const dldCost = price * 0.04;
      const trusteeCost = 4200;
      const registrationCost = (loan * 0.0025) + 290;
      const agencyCost = price * 0.02 * 1.05;
      const bankCost = loan * 0.01 * 1.05;
      const valuationCost = 3000 * 1.05;
      const purchaseCosts = dldCost + trusteeCost + registrationCost + agencyCost + bankCost + valuationCost;
      const totalUpfront = deposit + purchaseCosts;

      priceInput.value = formatNumber.format(price);
      depositInput.value = formatNumber.format(deposit);
      termInput.value = String(years);
      termRange.value = String(years);
      rateInput.value = annualRate.toFixed(2);
      rateRange.value = String(annualRate);

      setText("[data-deposit-percent]", `${depositPercent}%`);
      setText("[data-loan-percent]", `${loanPercent}% LTV`);
      setText("[data-loan-amount]", formatNumber.format(loan));
      setText("[data-monthly-payment]", formatAed(monthlyPayment));
      setText("[data-rate-output]", `${annualRate.toFixed(2)}%`);
      setText("[data-term-output]", `${years} ${years === 1 ? "year" : "years"}`);
      setText("[data-dld-cost]", formatAed(dldCost));
      setText("[data-trustee-cost]", formatAed(trusteeCost));
      setText("[data-registration-cost]", formatAed(registrationCost));
      setText("[data-agency-cost]", formatAed(agencyCost));
      setText("[data-bank-cost]", formatAed(bankCost));
      setText("[data-valuation-cost]", formatAed(valuationCost));
      setText("[data-upfront-deposit]", formatAed(deposit));
      setText("[data-purchase-costs]", formatAed(purchaseCosts));
      setText("[data-total-upfront]", formatAed(totalUpfront));
      setText("[data-cost-monthly]", formatAed(monthlyPayment));
      setText("[data-cost-rate]", `${annualRate.toFixed(2)}%`);
      setText("[data-cost-loan]", formatAed(loan));
      setText("[data-cost-term]", `${years} ${years === 1 ? "year" : "years"}`);

      const loanMeter = calculator.querySelector("[data-loan-meter]");
      if (loanMeter) loanMeter.style.width = `${loanPercent}%`;

      setValue("[data-form-price]", formatAed(price));
      setValue("[data-form-residency]", residency);
      setValue("[data-form-deposit]", `${formatAed(deposit)} (${depositPercent}%)`);
      setValue("[data-form-loan]", formatAed(loan));
      setValue("[data-form-term]", `${years} ${years === 1 ? "year" : "years"}`);
      setValue("[data-form-rate]", `${annualRate.toFixed(2)}%`);
      setValue("[data-form-monthly]", formatAed(monthlyPayment));
      setValue("[data-form-purchase-costs]", formatAed(purchaseCosts));
      setValue("[data-form-total-upfront]", formatAed(totalUpfront));

      [priceRange, depositRange, termRange, rateRange].forEach(paintRange);
    };

    priceRange.addEventListener("input", () => {
      priceInput.value = formatNumber.format(Number(priceRange.value));
      calculate();
    });

    priceInput.addEventListener("change", () => {
      const price = clamp(parseNumber(priceInput.value), Number(priceRange.min), Number(priceRange.max));
      priceRange.value = String(price);
      calculate();
    });

    depositRange.addEventListener("input", calculate);
    depositInput.addEventListener("change", () => {
      const price = Math.max(1, parseNumber(priceInput.value));
      const percentage = Math.round((parseNumber(depositInput.value) / price) * 100);
      depositRange.value = String(clamp(percentage, Number(depositRange.min), Number(depositRange.max)));
      calculate();
    });

    termRange.addEventListener("input", () => {
      termInput.value = termRange.value;
      calculate();
    });
    termInput.addEventListener("change", () => {
      termRange.value = String(clamp(parseNumber(termInput.value), Number(termRange.min), Number(termRange.max)));
      calculate();
    });

    rateRange.addEventListener("input", () => {
      rateInput.value = Number(rateRange.value).toFixed(2);
      calculate();
    });
    rateInput.addEventListener("change", () => {
      rateRange.value = String(clamp(parseNumber(rateInput.value), Number(rateRange.min), Number(rateRange.max)));
      calculate();
    });

    statusButtons.forEach((button) => {
      button.addEventListener("click", () => {
        residency = button.dataset.residency || "Non-resident";
        const minimum = Number(button.dataset.minDeposit || 40);
        statusButtons.forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        depositRange.min = String(minimum);
        depositRange.value = String(minimum);
        setText("[data-deposit-minimum]", `Minimum ${minimum}%`);
        calculate();
      });
    });

    if (costToggle && costBreakdown) {
      const setCostBreakdown = (open) => {
        costToggle.setAttribute("aria-expanded", String(open));
        costBreakdown.hidden = !open;
        if (open && costClose) costClose.focus({ preventScroll: true });
        if (!open) costToggle.focus({ preventScroll: true });
      };

      costToggle.addEventListener("click", () => setCostBreakdown(true));
      if (costClose) costClose.addEventListener("click", () => setCostBreakdown(false));
      costBreakdown.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setCostBreakdown(false);
      });
    }

    calculate();
  });
})();
