/** YouTube pop-up opened from a video card. */
class VideoModal {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.iframe = page.locator('iframe[id^="youtube-player"]').filter({ visible: true });
    this.root = page.locator('.modal-wrapper').filter({ has: page.locator('iframe[id^="youtube-player"]') });
    this.closeButton = this.root.locator('.modal-close-icon');
  }

  async waitOpen() {
    await this.iframe.first().waitFor({ state: 'visible' });
  }

  async isOpen() {
    return this.iframe.first().isVisible();
  }

  async src() {
    return (await this.iframe.first().getAttribute('src')) || '';
  }

  async videoId() {
    return VideoModal.idFromUrl(await this.src());
  }

  async isAutoplay() {
    return /[?&]autoplay=1/.test(await this.src());
  }

  async title() {
    return (await this.iframe.first().getAttribute('title')) || '';
  }

  async close() {
    const button = this.closeButton.filter({ visible: true }).first();
    // A real click sometimes never settles while the YouTube iframe is busy; fall back to a DOM click.
    await button.click({ timeout: 5_000 }).catch(() => button.dispatchEvent('click'));
    await this.iframe.first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
  }

  /** True when no YouTube player is left playing in the page (iframe removed, hidden or src cleared). */
  async isStopped() {
    const players = await this.page.locator('iframe[id^="youtube-player"]').evaluateAll((els) =>
      els.map((e) => ({ visible: !!(e.offsetWidth || e.offsetHeight), src: e.getAttribute('src') || '' })),
    );
    return players.every((p) => !p.src.includes('youtube.com/embed/'));
  }

  static idFromUrl(url) {
    const m = String(url).match(/(?:embed\/|vi\/|v=|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }
}

module.exports = { VideoModal };
