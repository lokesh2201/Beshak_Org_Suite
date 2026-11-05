/**
 * Wrapper for the vuejs-datepicker used on the proposal form.
 * The input is read-only, so a date is picked by navigating
 * day view -> month view -> year (decade) view.
 */
class DatePicker {
  /** @param {import('@playwright/test').Page} page  @param {import('@playwright/test').Locator} root  the .vdp-datepicker wrapper */
  constructor(page, root) {
    this.page = page;
    this.root = root;
    this.input = root.locator('input').first();
    this.calendar = root.locator('.vdp-datepicker__calendar').filter({ visible: true });
  }

  async open() {
    await this.input.click();
    await this.calendar.first().waitFor();
  }

  /** Header text shown when the calendar first opens, e.g. "Jan 1962". */
  async openedAt() {
    await this.open();
    const text = await this.calendar.locator('header span').nth(1).innerText();
    await this.page.keyboard.press('Escape');
    await this.root.page().mouse.click(5, 5);
    return text.trim();
  }

  async pick({ day, month, year }) {
    await this.open();
    await this.calendar.locator('.day__month_btn').click();
    await this.calendar.locator('.month__year_btn').click();
    for (let i = 0; i < 30; i++) {
      const [from, to] = (await this.calendar.locator('header span').nth(1).innerText()).split('-').map((s) => Number(s.trim()));
      if (year < from) await this.calendar.locator('.prev').click();
      else if (year > to) await this.calendar.locator('.next').click();
      else break;
    }
    await this.calendar.locator('span.cell.year', { hasText: String(year) }).click();
    await this.calendar.locator('span.cell.month').nth(month - 1).click();
    const dayCell = this.calendar.locator('span.cell.day:not(.blank)').nth(day - 1);
    const disabled = await dayCell.evaluate((el) => el.classList.contains('disabled'));
    await dayCell.click();
    return { disabled };
  }

  async value() {
    return this.input.inputValue();
  }
}

module.exports = { DatePicker };
