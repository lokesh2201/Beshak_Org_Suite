const { BasePage } = require('../BasePage');

/** A single plan page, e.g. /insurance/health-insurance/best-health-insurance-plans/<slug>/ */
class PlanDetailPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.title = page.locator('h1.product-title');
    this.ratingNumber = page.locator('.side-product-rating .rating-number').first();
    this.priceText = page.locator('.side-price-rating .pricing-text').first();
    this.ratingBoxes = page.locator('.ratings-footer .rating-box');
    this.detailTabs = page.locator('.tab-title');
  }

  async read() {
    const subRatings = Object.fromEntries(
      await this.ratingBoxes.evaluateAll((boxes) =>
        boxes.map((b) => {
          const label = b.querySelector('p').textContent.replace(':', '').trim();
          const value = Number((b.innerText.replace(b.querySelector('p').innerText, '').match(/\d+(\.\d+)?/) || [NaN])[0]);
          return [label, value];
        }),
      ),
    );
    return {
      name: (await this.title.innerText()).trim(),
      rating: Number((await this.ratingNumber.textContent()).trim()),
      priceTier: (await this.priceText.textContent())?.trim() ?? null,
      subRatings,
      bodyText: await this.page.locator('.plan-detail-page-wrapper').innerText(),
    };
  }

  /** Reads label -> value rows of one "Detailed Product Overview" tab, e.g. "Limits and Exclusions". */
  async readDetailTab(tabName) {
    await this.detailTabs.filter({ hasText: new RegExp(`^\\s*${tabName}\\s*$`) }).first().click();
    await this.page.waitForTimeout(400);
    return Object.fromEntries(
      await this.page.locator('.item-row').filter({ visible: true }).evaluateAll((rows) =>
        rows.map((r) => [r.querySelector('.item-title')?.textContent.trim(), r.querySelector('.item-value')?.textContent.trim()]),
      ),
    );
  }
}

module.exports = { PlanDetailPage };
