
/** Shared behaviour for every page object. */
class BasePage {
  /** @param {import('@playwright/test').Page} page  @param {string} path */
  constructor(page, path = '/') {
    this.page = page;
    this.path = path;
    this.h1 = page.locator('h1').first();
  }

  /** Opens the page and returns the HTTP response. */
  async open(path = this.path) {
    const response = await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    await this.waitForReady();
    return response;
  }

  /** Nuxt renders on the server, then hydrates; waiting for the H1 plus a quiet network is enough. */
  async waitForReady() {
    await this.h1.waitFor({ state: 'visible' });
    await this.settle();
  }

  /** Waits briefly for network activity to calm down after a UI action (filters, sort, load more). */
  async settle(ms = 400) {
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.page.waitForTimeout(ms);
  }

  async heading() {
    return (await this.h1.innerText()).trim();
  }
}

module.exports = { BasePage };
