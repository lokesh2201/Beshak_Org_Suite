/** The Articles / Videos toggle shown next to the "Featured ..." heading. */
class ContentSwitch {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.articles = page.locator('.feature-selector .article-option');
    this.videos = page.locator('.feature-selector .video-option');
  }

  async activeTab() {
    const active = this.page.locator('.feature-selector .active-feature');
    return (await active.innerText()).trim();
  }

  async goToVideos() {
    await this.videos.click();
    await this.page.waitForURL(/\/videos\/?$/);
  }

  async goToArticles() {
    await this.articles.click();
    await this.page.waitForURL(/\/articles\/?$/);
  }
}

module.exports = { ContentSwitch };
