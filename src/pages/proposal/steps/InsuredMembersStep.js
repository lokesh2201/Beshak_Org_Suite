/** Step 6: Insured Member Details. One member is shown at a time; arrows switch members. */
class InsuredMembersStep {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.yes = page.locator('label[for="proposer-is-insured-radio-yes"]');
    this.no = page.locator('label[for="proposer-is-insured-radio-no"]');
    this.nav = page.locator('.navigation-btns .active-nav');
    this.prevBtn = page.locator('.navigation-btns .nav-btn').first();
    this.nextBtn = page.locator('.navigation-btns .nav-btn').last();
    this.addBtn = page.locator('.add-member-btn');
    this.removeBtn = page.locator('.member-index-text .remove-member');
    this.form = page.locator('.insured-member-form-wrapper');
    this.name = page.locator('#insured_person_name');
  }

  /** Returns { current, total } from the "1/2" indicator. */
  async position() {
    const [current, total] = (await this.nav.innerText()).trim().split('/').map(Number);
    return { current, total };
  }

  async goTo(index) {
    for (let i = 0; i < 20; i++) {
      const { current } = await this.position();
      if (current === index) return;
      await (current < index ? this.nextBtn : this.prevBtn).click();
      await this.page.waitForTimeout(300);
    }
  }

  /** Opens the "1. Basic Details" section of the shown member if it is collapsed. */
  async expandBasic() {
    if (!(await this.name.isVisible())) {
      await this.form.locator('.basic-detail-wrap .collapse-btn').first().click();
      await this.name.waitFor({ state: 'visible' });
    }
  }

  /** Name and relationship of the member currently shown. */
  async currentMember() {
    await this.expandBasic();
    const relationship = this.form.locator('select[id^="relationship-"]').filter({ visible: true }).first();
    return { name: await this.name.inputValue(), relationship: await relationship.inputValue().catch(() => '') };
  }

  /** Reads every member: [{ name, relationship }]. */
  async allMembers() {
    const { total } = await this.position();
    const members = [];
    for (let i = 1; i <= total; i++) {
      await this.goTo(i);
      members.push(await this.currentMember());
    }
    return members;
  }

  async setProposerIsInsured(yes) {
    await (yes ? this.yes : this.no).click();
    await this.page.waitForTimeout(500);
  }

  async addMember() {
    await this.addBtn.click();
    await this.page.waitForTimeout(500);
  }

  async removeCurrentMember() {
    await this.removeBtn.click();
    await this.page.waitForTimeout(500);
  }

  async visibleErrors() {
    return this.form.locator('.text-red-600').filter({ visible: true }).evaluateAll((els) => els.map((e) => e.textContent.trim()).filter(Boolean));
  }

  /** Fills the empty required fields that are visible for the shown member. */
  async fillVisibleRequired(i) {
    const ids = await this.form.locator('input[id], select[id]').filter({ visible: true }).evaluateAll((els) => els.map((e) => e.id));
    for (const id of ids) {
      const field = this.page.locator(`#${id}`).first();
      if (await field.inputValue().catch(() => 'x')) continue;
      if (id === 'insured_person_name') await field.fill(`Member ${i}`);
      else if (/^email-/.test(id)) await field.fill(`member${i}@example.com`);
      else if (/^weight-/.test(id)) await field.selectOption('70');
      else if (/^height-/.test(id)) await field.selectOption('5 ft - 6 in');
      else if (/^relationship-/.test(id)) await field.selectOption(i ? 'spouse' : 'father');
    }
  }
}

module.exports = { InsuredMembersStep };
