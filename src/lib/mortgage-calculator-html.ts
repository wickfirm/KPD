/// The client's mortgage calculator, exactly as delivered (public/legacy/invest-in-dubai.html on
/// https://kpd.kmere.com, saved 2026-10-14): the INNER markup of
///   <section class="mortgage-calculator kpd-section kpd-section--compact" aria-labelledby="mortgage-calculator-title" data-mortgage-calculator>
/// Do not edit it by hand. When the client sends a new version, paste the new inner markup here.
/// public/legacy/assets/js/mortgage-calculator.js (also delivered) drives every id and data-attribute
/// below, and mortgage-calculator.test.ts checks that they all still exist.
/// The section's own attributes (its opening tag), as delivered. The inner markup follows.
export const mortgageCalculatorSectionProps = {
  className: "mortgage-calculator kpd-section kpd-section--compact",
  "aria-labelledby": "mortgage-calculator-title",
  "data-mortgage-calculator": "",
} as const;

export const mortgageCalculatorHtml = `
      <div class="invest-editorial-grid invest-editorial-grid--top">
        <div class="motion-reveal">
          <h2 id="mortgage-calculator-title">Plan the numbers before the viewing.</h2>
        </div>
        <div class="invest-copy motion-reveal" style="--motion-delay: 80ms;">
          <p>Adjust the purchase price, buyer profile and finance terms to see an illustrative monthly payment and estimated upfront costs.</p>
        </div>
      </div>

      <div class="mortgage-calculator-shell motion-reveal">
        <div class="mortgage-calculator-controls">
          <div class="mortgage-control-group mortgage-control-price">
            <label for="mortgage-price">Purchase price</label>
            <div class="mortgage-value-field">
              <span>AED</span>
              <input id="mortgage-price" type="text" inputmode="numeric" value="5,000,000" aria-describedby="mortgage-price-range">
            </div>
            <input id="mortgage-price-range" class="mortgage-range" type="range" min="300000" max="200000000" step="50000" value="5000000" aria-label="Purchase price in AED">
            <div class="mortgage-range-limits"><span>AED 300K</span><span>AED 200M</span></div>
          </div>

          <fieldset class="mortgage-status-group mortgage-control-status">
            <legend>Residency status</legend>
            <div class="mortgage-status-options" role="group" aria-label="Residency status">
              <button type="button" data-residency="UAE national" data-min-deposit="15" aria-pressed="false">UAE national</button>
              <button type="button" data-residency="UAE resident" data-min-deposit="20" aria-pressed="false">UAE resident</button>
              <button class="is-active" type="button" data-residency="Non-resident" data-min-deposit="40" aria-pressed="true">Non-resident</button>
            </div>
          </fieldset>

          <div class="mortgage-control-group mortgage-control-deposit">
            <div class="mortgage-label-row">
              <label for="mortgage-deposit">Down payment</label>
              <output for="mortgage-deposit-range" data-deposit-percent>40%</output>
            </div>
            <div class="mortgage-value-field">
              <span>AED</span>
              <input id="mortgage-deposit" type="text" inputmode="numeric" value="2,000,000">
            </div>
            <input id="mortgage-deposit-range" class="mortgage-range" type="range" min="40" max="90" step="1" value="40" aria-label="Down payment percentage">
            <div class="mortgage-range-limits"><span data-deposit-minimum>Minimum 40%</span><span>90%</span></div>
          </div>

          <div class="mortgage-control-group mortgage-control-loan">
            <div class="mortgage-label-row">
              <span>Loan amount</span>
              <output data-loan-percent>60% LTV</output>
            </div>
            <div class="mortgage-value-field mortgage-value-field--readonly">
              <span>AED</span>
              <output data-loan-amount>3,000,000</output>
            </div>
            <div class="mortgage-loan-meter" aria-hidden="true"><span data-loan-meter></span></div>
          </div>

          <div class="mortgage-controls-split">
            <div class="mortgage-control-group">
              <label for="mortgage-term">Loan period</label>
              <div class="mortgage-value-field mortgage-value-field--suffix">
                <input id="mortgage-term" type="number" min="1" max="25" step="1" value="25">
                <span>years</span>
              </div>
              <input id="mortgage-term-range" class="mortgage-range" type="range" min="1" max="25" step="1" value="25" aria-label="Loan period in years">
              <div class="mortgage-range-limits"><span>1 year</span><span>25 years</span></div>
            </div>
            <div class="mortgage-control-group">
              <label for="mortgage-rate">Interest rate</label>
              <div class="mortgage-value-field mortgage-value-field--suffix">
                <input id="mortgage-rate" type="number" min="1" max="10" step="0.01" value="4.54">
                <span>%</span>
              </div>
              <input id="mortgage-rate-range" class="mortgage-range" type="range" min="1" max="10" step="0.01" value="4.54" aria-label="Annual interest rate">
              <div class="mortgage-range-limits"><span>1%</span><span>10%</span></div>
            </div>
          </div>
        </div>

        <aside class="mortgage-calculator-result" aria-label="Mortgage estimate">
          <span class="kpd-eyebrow">Your estimate</span>
          <div class="mortgage-result-primary" aria-live="polite">
            <span>Monthly payment</span>
            <strong data-monthly-payment>AED 16,743</strong>
          </div>
          <div class="mortgage-result-meta">
            <div><span>Interest rate</span><strong data-rate-output>4.54%</strong></div>
            <div><span>Loan period</span><strong data-term-output>25 years</strong></div>
          </div>
          <button class="mortgage-cost-toggle" type="button" aria-expanded="false" aria-controls="mortgage-cost-breakdown" data-cost-toggle>View upfront costs</button>
          <div class="mortgage-cost-breakdown" id="mortgage-cost-breakdown" role="region" aria-label="Estimated upfront costs" hidden>
            <div class="mortgage-cost-header">
              <div>
                <span class="kpd-eyebrow">Estimated upfront costs</span>
                <h4>Payment breakdown</h4>
              </div>
              <button class="mortgage-cost-close" type="button" aria-label="Close upfront costs" data-cost-close></button>
            </div>
            <div class="mortgage-cost-card">
              <div class="mortgage-cost-row mortgage-cost-deposit"><span>Down payment</span><strong data-upfront-deposit>AED 2,000,000</strong></div>
              <div class="mortgage-cost-row mortgage-cost-subtotal"><span>Total purchase costs</span><strong data-purchase-costs>AED 351,640</strong></div>
              <div class="mortgage-cost-fees">
                <div class="mortgage-cost-row"><span class="mortgage-fee-label" title="4% of purchase price">Land department fee</span><strong data-dld-cost>AED 200,000</strong></div>
                <div class="mortgage-cost-row"><span class="mortgage-fee-label" title="Registration trustee fee">Registration trustee fee</span><strong data-trustee-cost>AED 4,200</strong></div>
                <div class="mortgage-cost-row"><span class="mortgage-fee-label" title="0.25% of loan amount plus AED 290">Mortgage registration fee</span><strong data-registration-cost>AED 7,790</strong></div>
                <div class="mortgage-cost-row"><span class="mortgage-fee-label" title="2% of purchase price plus 5% VAT">Real estate agency fee</span><strong data-agency-cost>AED 105,000</strong></div>
                <div class="mortgage-cost-row"><span class="mortgage-fee-label" title="1% of loan amount plus 5% VAT">Bank arrangement fee</span><strong data-bank-cost>AED 31,500</strong></div>
                <div class="mortgage-cost-row"><span class="mortgage-fee-label" title="AED 3,000 plus 5% VAT">Mortgage valuation fee</span><strong data-valuation-cost>AED 3,150</strong></div>
              </div>
              <div class="mortgage-cost-row mortgage-cost-total"><span>Total amount required upfront</span><strong data-total-upfront>AED 2,351,640</strong></div>
            </div>
            <div class="mortgage-cost-basis">
              <h5>Calculations based on</h5>
              <div>
                <span>Monthly payment<strong data-cost-monthly>AED 16,743</strong></span>
                <span>Interest rate<strong data-cost-rate>4.54%</strong></span>
                <span>Loan amount<strong data-cost-loan>AED 3,000,000</strong></span>
                <span>Loan duration<strong data-cost-term>25 years</strong></span>
              </div>
            </div>
            <p>Illustrative fees only. Lender, insurance and property-specific charges may vary.</p>
          </div>

          <form class="mortgage-lead-form contact-adaptive-form" action="mailto:info@kpd.ae?subject=Mortgage%20Eligibility%20Review" method="post" enctype="text/plain">
            <div class="mortgage-form-heading">
              <h4>Review your eligibility</h4>
              <p>Share your details and the KPD team will contact you.</p>
            </div>
            <input type="hidden" name="Inquiry Type" value="Mortgage Eligibility Review">
            <input type="hidden" name="Purchase Price" data-form-price value="AED 5,000,000">
            <input type="hidden" name="Residency Status" data-form-residency value="Non-resident">
            <input type="hidden" name="Down Payment" data-form-deposit value="AED 2,000,000 (40%)">
            <input type="hidden" name="Loan Amount" data-form-loan value="AED 3,000,000">
            <input type="hidden" name="Loan Period" data-form-term value="25 years">
            <input type="hidden" name="Interest Rate" data-form-rate value="4.54%">
            <input type="hidden" name="Estimated Monthly Payment" data-form-monthly value="AED 16,743">
            <input type="hidden" name="Estimated Purchase Costs" data-form-purchase-costs value="AED 351,640">
            <input type="hidden" name="Estimated Total Upfront" data-form-total-upfront value="AED 2,351,640">
            <div class="mortgage-form-grid">
              <label><span>Name</span><input type="text" name="Name" autocomplete="name" required></label>
              <label><span>Email</span><input type="email" name="Email" autocomplete="email" required></label>
              <label class="mortgage-form-phone"><span>Phone number</span><input type="tel" name="Phone" autocomplete="tel" placeholder="+971"></label>
            </div>
            <button class="btn-pill mortgage-submit" type="submit">Check your eligibility</button>
          </form>
          <p class="mortgage-disclaimer">Illustrative estimate only. Rates, lending criteria and fees vary by lender and applicant; this is not a financing offer.</p>
        </aside>
      </div>
`;
