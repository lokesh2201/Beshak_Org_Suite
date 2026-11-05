const { BasePage } = require('../BasePage');
const { ContentSwitch } = require('../../components/ContentSwitch');
const urls = require('../../data/urls');

/** /insurance/health-insurance/articles/ */
class ArticlesPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, urls.articles);
    this.switch = new ContentSwitch(page);
    this.featuredMain = page.locator('.first-feature-card');
    this.featuredOthers = page.locator('.other-feature-cards-wrapper .feature-card');
    this.listCards = page.locator('.article-page-cards .article-card');
    this.tags = page.locator('.tags-filter .tag');
    this.activeTag = page.locator('.tags-filter .active-tag');
    this.search = page.locator('.articles-filter .search-input-field');
  }

  async listTitles() {
    return this.listCards.locator('.card-title').evaluateAll((els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
  }

  async listCount() {
    return this.listCards.count();
  }

  async featuredMainTitle() {
    return (await this.featuredMain.locator('.card-title').textContent()).trim();
  }

  /** Clicks a card (SPA navigation) and waits for the article URL. Returns the card title. */
  async openCard(cardLocator, titleLocator) {
    const title = (await titleLocator.textContent()).replace(/\s+/g, ' ').trim();
    const listPath = new URL(this.page.url()).pathname;
    const listH1 = (await this.h1.textContent()).trim();
    await cardLocator.click();
    // SPA navigation: some cards link to /blog/... URLs, and the old H1 lingers for a moment.
    await this.page.waitForURL((u) => u.pathname !== listPath, { waitUntil: 'commit' });
    await this.page.waitForFunction((old) => {
      const h = document.querySelector('h1');
      return h && h.textContent.trim() && h.textContent.trim() !== old;
    }, listH1, { timeout: 30_000 });
    return title;
  }

  async openFeaturedMain() {
    return this.openCard(this.featuredMain, this.featuredMain.locator('.card-title'));
  }

  /** @param {number} position 1-based position in "All Articles". Scrolls to load more if needed. */
  async openListCard(position) {
    await this.ensureLoaded(position);
    const card = this.listCards.nth(position - 1);
    await card.scrollIntoViewIfNeeded();
    return this.openCard(card, card.locator('.card-title'));
  }

  async articleH1() {
    return (await this.page.locator('h1').first().innerText()).replace(/\s+/g, ' ').trim();
  }

  async backToList() {
    await this.page.goBack();
    await this.page.waitForURL(/\/articles\/?$/);
    await this.listCards.first().waitFor();
  }

  async selectCategory(id) {
    await this.page.locator(`.tags-filter #${id}`).click();
    await this.settle();
  }

  async activeTagId() {
    return this.activeTag.getAttribute('id');
  }

  async searchFor(term) {
    await this.search.fill('');
    await expect(this.search).toHaveValue(term);
  }

  async clearSearch() {
    await this.search.fill('');
    await this.settle(800);
  }

  /** Scrolls to the bottom `times` times; returns the card count after each scroll. */
  async scrollToBottom(times = 3) {
    const counts = [];
    for (let i = 0; i < times; i++) {
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await this.page.mouse.wheel(0, 3000);
      await this.settle(1200);
      counts.push(await this.listCount());
    }
    return counts;
  }

  /** Scrolls until at least `n` cards are loaded or nothing new appears. */
  async ensureLoaded(n) {
    for (let i = 0; i < 20 && (await this.listCount()) < n; i++) {
      const before = await this.listCount();
      await this.scrollToBottom(1);
      if ((await this.listCount()) === before) break;
    }
  }
}

module.exports = { ArticlesPage };
