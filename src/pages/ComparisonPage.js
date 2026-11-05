const { BasePage } = require('./BasePage');

/** /insurance/<type>/compare/<a>-vs-<b>[-vs-<c>]/ */
class ComparisonPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.planCards = page.locator('.plan-compare-cards-container .plan-compare-card');
    this.detailToggle = page.getByText('View detail comparison', { exact: true });
    this.sections = page.locator('.plans-compare-details-container .experience-service');
  }

  async waitForReady() {
    await super.waitForReady();
    await this.planCards.first().waitFor();
  }

  /** Top summary cards: [{ name, rating, priceTier, href }] */
  async readPlans() {
    return this.planCards.evaluateAll((cards) =>
      cards.map((c) => ({
        name: c.querySelector('.plan-title')?.textContent.trim(),
        rating: Number(c.querySelector('.rating-number')?.textContent.trim()),
        priceTier: c.querySelector('.pricing-text')?.textContent.trim() ?? null,
        href: c.querySelector('a')?.getAttribute('href'),
      })),
    );
  }

  async openDetailComparison() {
    if (!(await this.sections.first().isVisible().catch(() => false))) {
      await this.detailToggle.click();
      await this.sections.first().waitFor();
    }
  }

  /**
   * Reads the detailed comparison: { '<section>': { ratings: [planA, planB], rows: { '<label>': [valA, valB] } } }.
   * Section names are cleaned of their "01." prefixes.
   */
  async readDetail() {
    await this.openDetailComparison();
    return Object.fromEntries(
      await this.sections.evaluateAll((sections) =>
        sections.map((s) => {
          const title = s.querySelector('.experience-service-title')?.textContent.replace(/^\s*\d+\.\s*/, '').trim();
          const ratings = [...s.querySelectorAll('.experience-service-rating > span')].map((e) => Number(e.textContent.trim()));
          const rows = Object.fromEntries(
            [...s.querySelectorAll('.experience-service-item')].map((row) => [
              row.querySelector('.title-desc .title')?.textContent.trim(),
              [...row.querySelectorAll('.item-detail')].map((d) => d.textContent.replace(/\s+/g, ' ').trim()),
            ]),
          );
          return [title, { ratings, rows }];
        }),
      ),
    );
  }
}

module.exports = { ComparisonPage };
