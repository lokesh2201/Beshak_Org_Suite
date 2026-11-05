const base = require('@playwright/test');
const env = require('../config/env');
const { blockTrackers } = require('../utils/network');
const { ConsoleErrors } = require('../utils/consoleErrors');
const { HealthPlansPage } = require('../pages/plans/HealthPlansPage');
const { TermPlansPage } = require('../pages/plans/TermPlansPage');
const { PlanDetailPage } = require('../pages/plans/PlanDetailPage');
const { ComparisonPage } = require('../pages/ComparisonPage');
const { ArticlesPage } = require('../pages/content/ArticlesPage');
const { VideosPage } = require('../pages/content/VideosPage');
const { HealthProposalPage } = require('../pages/proposal/HealthProposalPage');

/**
 * Project-wide `test`: Playwright's test plus page-object fixtures.
 * Specs import { test, expect } from here and never build selectors themselves.
 */
const test = base.test.extend({
  // Auto fixture: runs for every test.
  _trackers: [
    async ({ context }, use) => {
      if (env.BLOCK_TRACKERS) await blockTrackers(context);
      await use();
    },
    { auto: true },
  ],

  consoleErrors: async ({ page }, use) => {
    await use(new ConsoleErrors(page));
  },

  healthPlansPage: async ({ page }, use) => use(new HealthPlansPage(page)),
  termPlansPage: async ({ page }, use) => use(new TermPlansPage(page)),
  planDetailPage: async ({ page }, use) => use(new PlanDetailPage(page)),
  comparisonPage: async ({ page }, use) => use(new ComparisonPage(page)),
  articlesPage: async ({ page }, use) => use(new ArticlesPage(page)),
  videosPage: async ({ page }, use) => use(new VideosPage(page)),
  proposalPage: async ({ page }, use) => use(new HealthProposalPage(page)),

  /** Opens a second tab in the same context and wraps it in a PlanDetailPage. */
  openPlanDetail: async ({ context }, use) => {
    const opened = [];
    await use(async (href) => {
      const tab = await context.newPage();
      opened.push(tab);
      const detail = new PlanDetailPage(tab);
      const response = await detail.open(href);
      return { detail, status: response?.status(), url: tab.url(), close: () => tab.close() };
    });
    for (const t of opened) await t.close().catch(() => {});
  },
});

module.exports = { test, expect: base.expect };
