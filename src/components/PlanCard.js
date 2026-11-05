/** One plan card on the Best Health / Best Term listing pages. */
class PlanCard {
  /** @param {import('@playwright/test').Page} page  @param {import('@playwright/test').Locator} root */
  constructor(page, root) {
    this.page = page;
    this.root = root;
    this.nameLink = root.locator('a.logo-name');
    this.compareBox = root.locator('.desktop-compare-check');
  }

  async name() {
    return (await this.root.locator('.plan-name').first().textContent()).trim();
  }

  async rating() {
    return Number((await this.root.locator('.product-rating-wrap .rating-number').first().textContent()).trim());
  }

  /** Price tier label (Economical / Fair / Expensive). It is in the DOM but only shown on mobile. */
  async priceTier() {
    return (await this.root.locator('.pricing-text').first().textContent())?.trim();
  }

  async features() {
    return (await this.root.locator('.plan-benefits-info .benefit-text p').allTextContents()).map((t) => t.trim());
  }

  async href() {
    return this.nameLink.getAttribute('href');
  }

  /** Hovers the rating and reads the sub-rating popover: { 'Claims Experience': 5, ... }. */
  async subRatings() {
    await this.root.locator('.product-rating-wrap .product-star-rating-comp').first().hover();
    const popover = this.page.locator('.popover.open .plans-popover-ratings').last();
    await popover.waitFor();
    const items = await popover.locator('.plan-rating-item').evaluateAll((els) =>
      els.map((el) => [el.querySelector('.rating-text').textContent.trim(), Number(el.querySelector('.star-value').textContent.trim())]),
    );
    await this.page.mouse.move(0, 0);
    await popover.waitFor({ state: 'hidden' }).catch(() => {});
    return Object.fromEntries(items);
  }

  async isCompared() {
    return this.compareBox.locator('input[type=checkbox]').isChecked();
  }

  async toggleCompare() {
    await this.compareBox.locator('.checkmark').click();
  }
}

module.exports = { PlanCard };
