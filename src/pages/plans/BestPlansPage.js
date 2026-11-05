const { BasePage } = require('../BasePage');
const { PlanCard } = require('../../components/PlanCard');
const { CompareTray } = require('../../components/CompareTray');

/**
 * Shared page object for the Best Health and Best Term listing pages.
 * Both pages have the same layout: rating / insurer filters, sort, counter,
 * plan cards, Load More and the compare tray.
 */
class BestPlansPage extends BasePage {
  /** @param {import('@playwright/test').Page} page  @param {string} path  @param {object} data  expected page data */
  constructor(page, path, data) {
    super(page, path);
    this.data = data;
    this.cards = page.locator('.plan-listing-card');
    this.counter = page.locator('.plans-count');
    this.loadMoreButton = page.locator('.load-more-cta');
    this.dropdowns = page.locator('.plan-filters .filter-dropdown-wrapper');
    this.ratingDropdown = this.dropdowns.nth(0);
    this.insurerDropdown = this.dropdowns.nth(1);
    this.sortHeading = page.locator('.sort-plans .sort-heading');
    this.sortOptions = page.locator('.sort-plans .sort-option');
    this.compareTray = new CompareTray(page);
  }

  async waitForReady() {
    await super.waitForReady();
    await this.cards.first().waitFor();
  }

  // ---------- cards ----------

  card(index) {
    return new PlanCard(this.page, this.cards.nth(index));
  }

  async cardByName(name) {
    const names = await this.cardNames();
    const i = names.findIndex((n) => n.toLowerCase() === name.toLowerCase());
    if (i < 0) throw new Error(`Plan "${name}" is not on the page. Shown: ${names.join(', ')}`);
    return this.card(i);
  }

  async cardCount() {
    return this.cards.count();
  }

  async cardNames() {
    return this.cards.locator('.plan-name').evaluateAll((els) => els.map((e) => e.textContent.trim()));
  }

  /** Reads every visible card in one round trip. */
  async readCards() {
    return this.cards.evaluateAll((cards) =>
      cards.map((c) => {
        const text = (sel) => c.querySelector(sel)?.textContent.trim() ?? null;
        const href = c.querySelector('a.logo-name')?.getAttribute('href') ?? null;
        return {
          name: text('.plan-name'),
          rating: Number(text('.product-rating-wrap .rating-number')),
          priceTier: text('.pricing-text'),
          features: [...c.querySelectorAll('.plan-benefits-info .benefit-text p')].map((p) => p.textContent.trim()),
          href,
          compared: !!c.querySelector('.desktop-compare-check input[type=checkbox]')?.checked,
        };
      }),
    );
  }

  // ---------- counter & load more ----------

  /** Parses "Showing X of Y plans" into { shown, total, text }. */
  async readCounter() {
    const text = (await this.counter.innerText()).trim();
    const m = text.match(/Showing\s+(\d+)\s+of\s+(\d+)/i);
    return { text, shown: m ? Number(m[1]) : NaN, total: m ? Number(m[2]) : NaN };
  }

  async isLoadMoreVisible() {
    return this.loadMoreButton.isVisible();
  }

  /** Clicks Load More once and waits for new cards. Returns the state after the click. */
  async loadMore() {
    const before = await this.cardCount();
    await this.loadMoreButton.click();
    await this.page.waitForFunction((n) => document.querySelectorAll('.plan-listing-card').length > n, before, { timeout: 8_000 }).catch(() => {});
    await this.settle(300);
    return { before, after: await this.cardCount(), counter: await this.readCounter() };
  }

  /**
   * Clicks Load More until it disappears or stops adding cards. Returns one entry per click.
   * If the counter says more plans exist, waits briefly for the button (it re-renders after filters).
   */
  async loadAll(maxClicks = 20) {
    const steps = [];
    for (let i = 0; i < maxClicks; i++) {
      const { shown, total } = await this.readCounter();
      if (shown < total) await this.loadMoreButton.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => {});
      if (!(await this.isLoadMoreVisible())) break;
      const step = await this.loadMore();
      steps.push(step);
      if (step.after === step.before) break; // button shown but nothing more to load
    }
    return steps;
  }

  // ---------- dropdowns ----------

  async openDropdown(dropdown) {
    const toggle = dropdown.locator('.filter-dropdown');
    if (!(await toggle.getAttribute('class')).includes('open-filter-dropdown')) await toggle.click();
    await dropdown.locator('.filter_menu').waitFor({ state: 'visible' });
  }

  async closeDropdown(dropdown) {
    const toggle = dropdown.locator('.filter-dropdown');
    if ((await toggle.getAttribute('class')).includes('open-filter-dropdown')) await toggle.click();
  }

  // ---------- rating filter ----------

  async ratingOptions() {
    await this.openDropdown(this.ratingDropdown);
    const list = await this.ratingDropdown.locator('input[name="rate-radio"]').evaluateAll((els) =>
      els.map((e) => ({ id: e.id, label: document.querySelector(`label[for="${e.id}"]`)?.textContent.trim(), checked: e.checked })),
    );
    await this.closeDropdown(this.ratingDropdown);
    return list;
  }

  /** @param {'All'|'Claims Experience'|'Customer Service'|'Product Benefits'} label */
  async selectRating(label) {
    await this.openDropdown(this.ratingDropdown);
    await this.ratingDropdown.locator('label.radio-label').filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) }).click();
    await this.closeDropdown(this.ratingDropdown);
    await this.settle();
  }

  // ---------- insurer filter ----------

  async insurerScopeOptions() {
    await this.openDropdown(this.insurerDropdown);
    const list = await this.insurerDropdown.locator('input[name="radio"]').evaluateAll((els) =>
      els.map((e) => ({ value: e.value, label: document.querySelector(`label[for="${e.id}"]`)?.childNodes[0]?.textContent.trim(), checked: e.checked })),
    );
    await this.closeDropdown(this.insurerDropdown);
    return list;
  }

  /** Every insurer checkbox: { value, checked }. Values are raw (may contain trailing spaces). */
  async insurerCheckboxes() {
    await this.openDropdown(this.insurerDropdown);
    const list = await this.insurerDropdown.locator('.insurer-list input[type=checkbox]').evaluateAll((els) =>
      els.map((e) => ({ value: e.value, checked: e.checked })),
    );
    await this.closeDropdown(this.insurerDropdown);
    return list;
  }

  selectAllCheckbox() {
    return this.insurerDropdown.locator('label.cb-wrapper', { hasText: 'Select All' });
  }

  insurerCheckbox(value) {
    return this.insurerDropdown.locator(`.insurer-list label.cb-wrapper:has(input[value="${value}"])`);
  }

  async setSelectAll(checked) {
    await this.openDropdown(this.insurerDropdown);
    const box = this.selectAllCheckbox();
    if ((await box.locator('input').isChecked()) !== checked) await box.locator('.checkmark').click();
    await this.settle(200);
  }

  async setInsurer(value, checked) {
    await this.openDropdown(this.insurerDropdown);
    const box = this.insurerCheckbox(value);
    if ((await box.locator('input').isChecked()) !== checked) await box.locator('.checkmark').click();
    await this.settle(200);
  }

  /** Unticks Select All, then ticks only `value`. Leaves the dropdown closed. */
  async filterByOnlyInsurer(value) {
    await this.setSelectAll(false);
    for (const other of await this.insurerCheckboxes()) {
      if (other.checked && other.value !== value) await this.setInsurer(other.value, false);
    }
    await this.setInsurer(value, true);
    await this.closeDropdown(this.insurerDropdown);
    await this.settle();
  }

  // ---------- sort ----------

  async selectedSort() {
    await this.sortHeading.click();
    const text = (await this.page.locator('.sort-plans .selected-sort-option').innerText()).trim();
    await this.sortHeading.click();
    return text;
  }

  /** @param {'Rating: High to Low'|'Price: Low to High'} label */
  async sortBy(label) {
    await this.sortHeading.click();
    await this.sortOptions.filter({ hasText: label }).click();
    await this.settle();
  }

  // ---------- filters visible ----------

  async filtersVisible() {
    return {
      rating: await this.ratingDropdown.isVisible(),
      insurer: await this.insurerDropdown.isVisible(),
      sort: await this.sortHeading.isVisible(),
    };
  }
}

module.exports = { BestPlansPage };
