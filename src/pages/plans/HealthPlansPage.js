const { BestPlansPage } = require('./BestPlansPage');
const urls = require('../../data/urls');
const data = require('../../data/health.data');

class HealthPlansPage extends BestPlansPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, urls.healthPlans, data);
  }
}

module.exports = { HealthPlansPage };
