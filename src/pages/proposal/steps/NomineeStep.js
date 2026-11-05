const { DatePicker } = require('../../../components/DatePicker');

/** Step 4: Nominee Details. */
class NomineeStep {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.name = page.locator('#nominee-name');
    this.relationship = page.locator('#nominee-relationship');
    this.dob = new DatePicker(page, page.locator('.nominee-dob-select .vdp-datepicker'));
    this.mobile = page.locator('#nominee-mobile');
    this.appointeeFields = page.locator('.form-wrapper [id*="appointee"], .form-wrapper [name*="appointee"]').filter({ visible: true });
  }

  async values() {
    return {
      name: await this.name.inputValue(),
      relationship: await this.relationship.inputValue(),
      dob: await this.dob.value(),
      mobile: await this.mobile.inputValue(),
    };
  }

  async fill({ name, relationship, dob, mobile }) {
    await this.name.fill(name);
    await this.relationship.selectOption(relationship);
    await this.dob.pick(dob);
    await this.mobile.fill(mobile);
  }

  async appointeeVisible() {
    return (await this.appointeeFields.count()) > 0;
  }
}

module.exports = { NomineeStep };
