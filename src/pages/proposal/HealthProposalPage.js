const { BasePage } = require('../BasePage');
const { BasicDetailsStep } = require('./steps/BasicDetailsStep');
const { KycBankStep } = require('./steps/KycBankStep');
const { NomineeStep } = require('./steps/NomineeStep');
const { UploadDocumentsStep } = require('./steps/UploadDocumentsStep');
const { InsuredMembersStep } = require('./steps/InsuredMembersStep');
const data = require('../../data/proposal.data');
const urls = require('../../data/urls');

const STEPS = ['Basic Details', 'Bank Details', 'KYC Information', 'Nominee Details', 'Upload Documents', 'Insured Member Details'];
const STORAGE_KEY = 'proposalFormData';

/**
 * Health proposal form: /insurance/forms/proposal/<id>/
 * Steps: Basic -> Bank -> KYC -> Nominee -> Upload -> Insured Members -> Review -> Submit.
 * Progress is kept in localStorage; nothing is sent to the server before Submit.
 */
class HealthProposalPage extends BasePage {
  static STEPS = STEPS;

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.basic = new BasicDetailsStep(page);
    this.kycBank = new KycBankStep(page);
    this.nominee = new NomineeStep(page);
    this.uploads = new UploadDocumentsStep(page);
    this.members = new InsuredMembersStep(page);
    this.form = page.locator('.form-container');
    this.activeStepLabel = page.locator('.tab-index-wrapper .active-label');
    this.continueButton = page.locator('.form-wrapper .btn-wrapper .submit-btn');
    this.backButton = page.locator('.form-wrapper .btn-wrapper .back-btn');
    this.submitButton = page.locator('button.submit-btn', { hasText: /^\s*Submit\s*$/ });
  }

  /** Opens a proposal link. Does not require the form to render (invalid links show none). */
  async openProposal(id) {
    const response = await this.page.goto(urls.proposal(id), { waitUntil: 'domcontentloaded' });
    await this.settle(1000);
    return response;
  }

  async waitForForm() {
    // The form may reopen on a saved step, so wait for the step's buttons rather than a step-1 field.
    await this.form.waitFor({ state: 'visible' });
    await this.continueButton.or(this.submitButton).first().waitFor({ state: 'visible' });
  }

  async isFormVisible() {
    return this.form.isVisible();
  }

  async pageText() {
    return (await this.page.locator('.page-content, #__layout').first().innerText()).replace(/\s+/g, ' ').trim();
  }

  async activeStep() {
    if (await this.isReview()) return 'Review';
    return (await this.activeStepLabel.innerText()).trim();
  }

  async isReview() {
    return /Review Proposer Details/i.test(await this.h1.innerText().catch(() => ''));
  }

  async clickContinue() {
    await this.continueButton.click();
    await this.settle(400);
  }

  /** Visible, non-empty validation messages on the current step. */
  async errors() {
    return this.page.locator('.form-wrapper .text-red-600').filter({ visible: true })
      .evaluateAll((els) => els.map((e) => e.textContent.trim()).filter(Boolean));
  }

  // ---------- step navigation with valid dummy data ----------

  async completeBasic(d = data.validBasic) {
    await this.basic.fill(d);
    await this.clickContinue();
  }

  async completeBank(d = data.validBank) {
    await this.kycBank.fillBank(d);
    await this.clickContinue();
  }

  async completeKyc(d = data.validKyc) {
    await this.kycBank.fillKyc(d);
    await this.clickContinue();
  }

  async completeNominee(d = data.validNominee) {
    await this.nominee.fill(d);
    await this.clickContinue();
  }

  async completeUploads(files) {
    await this.uploads.upload('aadhaarFront', files.imageA);
    await this.uploads.upload('pan', files.smallPdf);
    await this.uploads.upload('cheque', files.smallPdf);
    await this.clickContinue();
  }

  /** Clicks Review, fills whatever member fields it flags, and repeats until the review page opens. */
  async completeMembersAndReview(maxRounds = 8) {
    for (let round = 0; round < maxRounds; round++) {
      await this.clickContinue();
      if (await this.isReview()) return true;
      const { current } = await this.members.position();
      await this.members.fillVisibleRequired(current - 1);
    }
    return this.isReview();
  }

  /**
   * Fills every step with valid dummy data up to (and showing) `stepName`.
   * Pass `files` (from createUploadFiles) to go past Upload Documents.
   */
  async goToStep(stepName, { files } = {}) {
    await this.waitForForm();
    const actions = {
      'Basic Details': () => this.completeBasic(),
      'Bank Details': () => this.completeBank(),
      'KYC Information': () => this.completeKyc(),
      'Nominee Details': () => this.completeNominee(),
      'Upload Documents': () => {
        if (!files) throw new Error('goToStep needs { files } to pass Upload Documents');
        return this.completeUploads(files);
      },
      'Insured Member Details': () => this.completeMembersAndReview(),
    };
    for (let i = 0; i < 10; i++) {
      const current = await this.activeStep();
      if (current === stepName) return;
      if (!actions[current]) throw new Error(`Unexpected step "${current}" while going to "${stepName}"`);
      await actions[current]();
      const after = await this.activeStep();
      if (after === current) throw new Error(`Stuck on "${current}": ${JSON.stringify(await this.errors())}`);
    }
  }

  // ---------- saved progress ----------

  async savedData() {
    return this.page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), STORAGE_KEY);
  }

  async storageKeys() {
    return this.page.evaluate(() => Object.keys(localStorage));
  }

  static get storageKey() {
    return STORAGE_KEY;
  }
}

module.exports = { HealthProposalPage };
