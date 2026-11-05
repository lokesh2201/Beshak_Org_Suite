/** The "Compare Plans" tray that slides up from the bottom of the listing page. */
class CompareTray {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.root = page.locator('.pcf-wrapper');
    this.compareNow = this.root.locator('.pfc-compare-btn');
    this.clearAll = this.root.locator('.pcf-clear-all');
    this.message = this.root.locator('.empty-column-text');
    this.toast = page.locator('.toasted');
  }

  async isOpen() {
    return (await this.root.getAttribute('class')).includes('visible');
  }

  async planNames() {
    return (await this.root.locator('.pcf-plan .plan-name').allTextContents()).map((t) => t.trim());
  }

  async messageText() {
    if (!(await this.message.count())) return '';
    return (await this.message.innerText()).trim();
  }

  async isCompareEnabled() {
    return !(await this.compareNow.getAttribute('class')).includes('disabled');
  }

  async toastText() {
    if (!(await this.toast.count())) return '';
    return (await this.toast.allInnerTexts()).join(' | ');
  }

  async clickCompareNow() {
    await this.compareNow.scrollIntoViewIfNeeded();
    await Promise.all([this.page.waitForURL(/\/compare\//), this.compareNow.click()]);
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async clickClearAll() {
    await this.clearAll.click();
  }
}

module.exports = { CompareTray };
