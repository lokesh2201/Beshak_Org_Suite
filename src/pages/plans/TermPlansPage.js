const { BestPlansPage } = require('./BestPlansPage');
const urls = require('../../data/urls');
const data = require('../../data/term.data');

class TermPlansPage extends BestPlansPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, urls.termPlans, data);
  }
}

module.exports = { TermPlansPage };
