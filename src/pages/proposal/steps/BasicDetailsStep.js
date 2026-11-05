const { DatePicker } = require('../../../components/DatePicker');

/** Step 1: Basic Details (proposer). */
class BasicDetailsStep {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.firstName = page.locator('#proposer_first_name');
    this.lastName = page.locator('#proposer_last_name');
    this.dob = new DatePicker(page, page.locator('.form-wrapper .date-of-birth-select .vdp-datepicker').first());
    this.mobile = page.locator('#mobile');
    this.email = page.locator('#email');
    this.address = page.locator('#address');
    this.pincode = page.locator('#pincode');
    this.maritalStatus = page.locator('#proposer_marital_status');
    this.education = page.locator('#proposer_education');
  }

  /** The field wrappers of this step, in screen order, with the text a user sees as each label. */
  static FIELDS = [
    { key: 'firstName', wrapper: '.first-name' },
    { key: 'lastName', wrapper: '.last-name' },
    { key: 'gender', wrapper: '.gender-select' },
    { key: 'dob', wrapper: '.date-of-birth-select' },
    { key: 'mobile', wrapper: '.mobile-input' },
    { key: 'email', wrapper: '.email-input' },
    { key: 'address', wrapper: '.address-input' },
    { key: 'pincode', wrapper: '.pincode-input' },
    { key: 'maritalStatus', wrapper: '.marital-status-select' },
    { key: 'education', wrapper: '.education-input' },
  ];

  async selectGender(gender) {
    await this.page.locator('.gender-select .gender-option').filter({ hasText: new RegExp(`^\\s*${gender}\\s*$`) }).first().click();
  }

  async fill(d) {
    await this.firstName.fill(d.firstName);
    await this.lastName.fill(d.lastName);
    await this.selectGender(d.gender);
    await this.dob.pick(d.dob);
    await this.mobile.fill(d.mobile);
    await this.email.fill(d.email);
    await this.address.fill(d.address);
    await this.pincode.fill(d.pincode);
    await this.maritalStatus.selectOption(d.maritalStatus);
    await this.education.fill(d.education);
  }

  async clearAll() {
    for (const f of [this.firstName, this.lastName, this.mobile, this.email, this.address, this.pincode, this.education]) await f.fill('');
  }

  /**
   * For every field: its visible label/placeholder text, whether it shows "*", and its error text.
   * Labels come from <label>, the select's first option, or the placeholder (DOB, address).
   */
  async fieldStates() {
    return this.page.evaluate((fields) => fields.map(({ key, wrapper }) => {
      const w = document.querySelector(`.form-wrapper ${wrapper}`);
      if (!w) return { key, missing: true };
      const label = w.querySelector('label.b-label')?.textContent
        || w.querySelector('select option[disabled]')?.textContent
        || w.querySelector('input[placeholder], textarea[placeholder]')?.getAttribute('placeholder')
        || w.closest('.wrapper')?.querySelector(`${wrapper} .fields-label`)?.textContent
        || '';
      const error = w.querySelector('.text-red-600')?.textContent.trim() || '';
      return { key, label: label.trim(), required: /\*/.test(label), error };
    }), BasicDetailsStep.FIELDS);
  }
}

module.exports = { BasicDetailsStep };
