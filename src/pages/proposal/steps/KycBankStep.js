/** Step 2 (Bank Details) and Step 3 (KYC Information). They are small, so one object covers both. */
class KycBankStep {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.bankName = page.locator('#bank-name');
    this.accountNo = page.locator('#bank-account-no');
    this.ifsc = page.locator('#bank-ifsc-code');
    this.occupation = page.locator('#proposer_occupation');
    this.income = page.locator('#proposer_annual_income');
  }

  async fillBank({ name, accountNo, ifsc }) {
    await this.bankName.fill(name);
    await this.accountNo.fill(accountNo);
    await this.ifsc.fill(ifsc);
  }

  async fillKyc({ occupation, income }) {
    await this.occupation.selectOption(occupation);
    await this.income.selectOption(income);
  }
}

module.exports = { KycBankStep };
