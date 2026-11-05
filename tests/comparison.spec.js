// Sheet: "Comparison" (TC-CP01 - TC-CP06)
const { test, expect } = require('../src/fixtures/test');
const { norm } = require('../src/utils/assertions');
const health = require('../src/data/health.data');
const term = require('../src/data/term.data');

/** Ticks Compare on each named plan (loading more cards if needed). */
async function addToCompare(plans, names) {
  for (const name of names) {
    if (!(await plans.cardNames()).some((n) => norm(n) === norm(name))) await plans.loadAll();
    await (await plans.cardByName(name)).toggleCompare();
    await plans.page.waitForTimeout(300);
  }
}

/** Checks every plan on the comparison page against its own plan detail page. */
async function expectComparisonMatchesDetailPages(comparisonPage, openPlanDetail, { listingCards = [] } = {}) {
  const plans = await comparisonPage.readPlans();
  const detail = await comparisonPage.readDetail();
  const sectionFor = (name) => Object.keys(detail).find((k) => norm(k).startsWith(norm(name)));

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    await test.step(`${plan.name} matches its plan page`, async () => {
      const { detail: page, status, close } = await openPlanDetail(plan.href);
      expect.soft(status, `${plan.name}: plan page HTTP status`).toBe(200);
      const d = await page.read();
      expect.soft(norm(d.name), `${plan.name}: name`).toBe(norm(plan.name));
      expect.soft(plan.rating, `${plan.name}: rating`).toBe(d.rating);
      expect.soft(plan.priceTier, `${plan.name}: price badge`).toBe(d.priceTier);

      for (const sub of ['Claims Experience', 'Customer Service', 'Product Benefits']) {
        const key = sectionFor(sub);
        if (!key) continue;
        expect.soft(detail[key].ratings[i], `${plan.name}: ${sub} rating`).toBe(d.subRatings[sub]);
      }

      const limitsKey = sectionFor('Limits and Exclusions');
      if (limitsKey) {
        const detailRows = await page.readDetailTab('Limits and Exclusions');
        const mismatches = Object.entries(detail[limitsKey].rows)
          .filter(([label]) => label in detailRows)
          .filter(([label, values]) => norm(values[i]) !== norm(detailRows[label]))
          .map(([label, values]) => `${label}: comparison "${values[i]}" vs plan page "${detailRows[label]}"`);
        expect.soft(mismatches, `${plan.name}: Limits and Exclusions values`).toEqual([]);
      }

      const card = listingCards.find((c) => norm(c.name) === norm(plan.name));
      if (card) {
        expect.soft(plan.rating, `${plan.name}: rating vs plan card`).toBe(card.rating);
        expect.soft(plan.priceTier, `${plan.name}: price badge vs plan card`).toBe(card.priceTier);
      }
      await close();
    });
  }
}

test.describe('Comparison of insurances', () => {
  test('TC-CP01 Compare 2 health plans', { tag: ['@functional', '@P1'] }, async ({ healthPlansPage, comparisonPage }) => {
    const [a, b] = health.compare.pair;
    await healthPlansPage.open();
    const tray = healthPlansPage.compareTray;

    await addToCompare(healthPlansPage, [a]);
    expect((await tray.planNames()).map(norm)).toEqual([a].map(norm));
    expect.soft(await tray.messageText(), 'tray text with 1 plan').toContain('Add 1 more plan');
    expect.soft(await tray.isCompareEnabled(), 'Compare Now disabled with 1 plan').toBe(false);

    await addToCompare(healthPlansPage, [b]);
    expect((await tray.planNames()).map(norm)).toEqual([a, b].map(norm));
    expect(await tray.isCompareEnabled(), 'Compare Now enabled with 2 plans').toBe(true);

    await tray.clickCompareNow();
    await comparisonPage.waitForReady();
    const compared = (await comparisonPage.readPlans()).map((p) => norm(p.name));
    expect(compared.sort()).toEqual([a, b].map(norm).sort());
  });

  test('TC-CP02 Compare 3 health plans', { tag: ['@functional', '@P1'] }, async ({ healthPlansPage, comparisonPage }) => {
    await healthPlansPage.open();
    const names = (await healthPlansPage.cardNames()).slice(0, 3);
    await addToCompare(healthPlansPage, names);
    expect(await healthPlansPage.compareTray.planNames()).toHaveLength(3);
    await healthPlansPage.compareTray.clickCompareNow();
    await comparisonPage.waitForReady();
    const compared = (await comparisonPage.readPlans()).map((p) => norm(p.name));
    expect(compared.sort(), 'all 3 plans side by side').toEqual(names.map(norm).sort());
  });

  test('TC-CP03 A 4th plan cannot be added', { tag: ['@functional', '@P1'] }, async ({ healthPlansPage }) => {
    await healthPlansPage.open();
    const names = (await healthPlansPage.cardNames()).slice(0, 4);
    await addToCompare(healthPlansPage, names.slice(0, 3));
    const tray = healthPlansPage.compareTray;
    expect(await tray.planNames()).toHaveLength(3);

    await addToCompare(healthPlansPage, [names[3]]);
    const inTray = await tray.planNames();
    expect(inTray.length, 'tray never holds more than 3 plans').toBeLessThanOrEqual(3);
    const replaced = !inTray.map(norm).includes(norm(names[0])) && inTray.map(norm).includes(norm(names[3]));
    const toast = await tray.toastText();
    expect(replaced || /more than 3|maximum|only 3|up to 3/i.test(toast), `clear message or replace behaviour (toast: "${toast}")`).toBe(true);

    const fourthTicked = await (await healthPlansPage.cardByName(names[3])).isCompared();
    if (fourthTicked && !replaced) {
      test.info().annotations.push({ type: 'observation', description: `4th plan's Compare box stays ticked although it is not in the tray (${names[3]})` });
    }
  });

  test('TC-CP04 Comparison values match each plan page', { tag: ['@data', '@P1'] }, async ({ healthPlansPage, comparisonPage, openPlanDetail }) => {
    test.setTimeout(5 * 60_000);
    await healthPlansPage.open();
    await healthPlansPage.loadAll();
    const listingCards = await healthPlansPage.readCards();
    await addToCompare(healthPlansPage, health.compare.pair);
    await healthPlansPage.compareTray.clickCompareNow();
    await comparisonPage.waitForReady();
    await expectComparisonMatchesDetailPages(comparisonPage, openPlanDetail, { listingCards });
  });

  test('TC-CP05 Remove a plan and Clear all', { tag: ['@functional', '@P1'] }, async ({ healthPlansPage }) => {
    const [a, b] = health.compare.pair;
    await healthPlansPage.open();
    const tray = healthPlansPage.compareTray;
    await addToCompare(healthPlansPage, [a, b]);
    expect((await tray.planNames()).map(norm)).toEqual([a, b].map(norm));
    const textWith2 = await tray.messageText();

    await (await healthPlansPage.cardByName(b)).toggleCompare();
    expect((await tray.planNames()).map(norm), 'after unticking one plan').toEqual([a].map(norm));
    expect(await tray.messageText(), 'tray text updates after removing').not.toBe(textWith2);

    await (await healthPlansPage.cardByName(b)).toggleCompare();
    expect((await tray.planNames()).map(norm), 'after adding it back').toEqual([a, b].map(norm));
    expect(await tray.messageText()).toBe(textWith2);

    await tray.clickClearAll();
    await healthPlansPage.page.waitForTimeout(500);
    expect(await tray.planNames(), 'Clear all empties the tray').toEqual([]);
    const ticked = (await healthPlansPage.readCards()).filter((c) => c.compared).map((c) => c.name);
    expect(ticked, 'Clear all unticks every Compare box').toEqual([]);
  });

  test('TC-CP06 Compare 2 term plans', { tag: ['@functional', '@P1'] }, async ({ termPlansPage, comparisonPage, openPlanDetail }) => {
    test.setTimeout(5 * 60_000);
    await termPlansPage.open();
    await termPlansPage.loadAll();
    const listingCards = await termPlansPage.readCards();
    await addToCompare(termPlansPage, term.compare.pair);
    await termPlansPage.compareTray.clickCompareNow();
    await comparisonPage.waitForReady();
    const compared = (await comparisonPage.readPlans()).map((p) => norm(p.name));
    expect(compared.sort(), 'comparison of both term plans').toEqual(term.compare.pair.map(norm).sort());
    await expectComparisonMatchesDetailPages(comparisonPage, openPlanDetail, { listingCards });
  });
});
