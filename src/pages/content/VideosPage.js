const { BasePage } = require('../BasePage');
const { ContentSwitch } = require('../../components/ContentSwitch');
const { VideoModal } = require('../../components/VideoModal');
const urls = require('../../data/urls');

/** /insurance/health-insurance/videos/ */
class VideosPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, urls.videos);
    this.switch = new ContentSwitch(page);
    this.modal = new VideoModal(page);
    this.featuredCards = page.locator('.featured-cards-wrapper').locator('.first-feature-card, .feature-card');
    this.listCards = page.locator('.video-page-cards .video-card');
    this.search = page.locator('.videos-filter .search-input-field');
  }

  /** Reads a card's title and YouTube ID (from the thumbnail URL). */
  async readCard(card) {
    await card.scrollIntoViewIfNeeded();
    // List thumbnails are lazy-loaded: wait (max 5 s) until the img gets its src.
    await card.locator('img.video-thumbnail').evaluate((img) => new Promise((resolve) => {
      if (img.getAttribute('src')) return resolve();
      const obs = new MutationObserver(() => { if (img.getAttribute('src')) { obs.disconnect(); resolve(); } });
      obs.observe(img, { attributes: true });
      setTimeout(() => { obs.disconnect(); resolve(); }, 5000);
    }));
    return card.evaluate((c) => {
      const t = c.querySelector('.card-title, .font-bold');
      const img = c.querySelector('img.video-thumbnail');
      return { title: t?.textContent.replace(/\s+/g, ' ').trim(), thumb: img?.getAttribute('src') || '', alt: img?.getAttribute('alt') || '' };
    }).then((c) => ({ ...c, videoId: VideoModal.idFromUrl(c.thumb) }));
  }

  async featuredCount() {
    return this.featuredCards.count();
  }

  async listCount() {
    return this.listCards.count();
  }

  async listTitles() {
    return this.listCards.locator('.font-bold').evaluateAll((els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
  }

  async thumbnailsLoaded(cards) {
    return cards.locator('img.video-thumbnail').evaluateAll((imgs) => imgs.map((i) => !!i.getAttribute('src') && i.complete && i.naturalWidth > 0));
  }

  /** Opens a card's pop-up and returns what the card and the player show. */
  async play(card) {
    const info = await this.readCard(card);
    await card.locator('.thumbnail-wrapper').click();
    await this.modal.waitOpen();
    return { card: info, player: { videoId: await this.modal.videoId(), title: await this.modal.title(), autoplay: await this.modal.isAutoplay() } };
  }

  async closePlayer() {
    await this.modal.close();
    await this.page.waitForTimeout(500);
  }

  async searchFor(term) {
    await this.search.fill('');
    await this.search.pressSequentially(term, { delay: 30 });
    await this.settle(800);
  }

  async clearSearch() {
    await this.search.fill('');
    await this.settle(800);
  }
}

module.exports = { VideosPage };
