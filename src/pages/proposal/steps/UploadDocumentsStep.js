/** Step 5: Upload Documents. All inputs accept multiple files; uploads only leave the browser on Submit. */
class UploadDocumentsStep {
  static FIELDS = {
    aadhaarFront: { input: '#multiple-aadhar-front', wrapper: '.multiple-aadhar-front-upload' },
    aadhaarBack: { input: '#multiple-aadhar-back', wrapper: '.multiple-aadhar-back-upload' },
    pan: { input: '#pan-card', wrapper: '.pan-card-upload' },
    cheque: { input: '#cancelled-cheque', wrapper: '.cancelled-cheque-upload' },
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  wrapper(field) {
    return this.page.locator(UploadDocumentsStep.FIELDS[field].wrapper);
  }

  async upload(field, files) {
    await this.page.setInputFiles(UploadDocumentsStep.FIELDS[field].input, files);
    await this.page.waitForTimeout(600);
  }

  /** File names the field currently shows ("doc-name" chips, or "Selected File: x"). */
  async fileNames(field) {
    return this.wrapper(field).evaluate((w) => {
      const chips = [...w.querySelectorAll('.doc-name span')].map((s) => s.textContent.trim());
      if (chips.length) return chips;
      const sel = [...w.querySelectorAll('div')].find((d) => /Selected File:/.test(d.textContent) && d.children.length <= 2);
      return sel ? [sel.textContent.replace(/Selected File:/, '').trim()].filter(Boolean) : [];
    });
  }

  async error(field) {
    return ((await this.wrapper(field).locator('.text-red-600').textContent()) || '').trim();
  }

  async labels() {
    return this.page.locator('.form-wrapper .upload-labels p').allTextContents();
  }

  async toasts() {
    return this.page.locator('.toasted').allInnerTexts().catch(() => []);
  }
}

module.exports = { UploadDocumentsStep };
