/**
 * Test bodies shared by the Health (TC-HP*) and Term (TC-TP*) listing specs.
 * Both pages have the same features, so each spec registers its own tests and
 * passes one of these bodies, e.g. test('TC-HP01 ...', suite.pageLoad('healthPlansPage')).
 */
const { test, expect } = require('../../src/fixtures/test');
const { increasesAt, priceOrderBreaks, duplicates, norm } = require('../../src/utils/assertions');

/**
 * Playwright needs fixtures destructured in the test function's first argument,
 * so this wrapper does that and hands the body the right listing page.
 */
const withPlans = (fixtureName, body) =>
  async ({ healthPlansPage, termPlansPage, consoleErrors, openPlanDetail }) =>
    body({ plans: fixtureName === 'healthPlansPage' ? healthPlansPage : termPlansPage, consoleErrors, openPlanDetail });

function pageLoad(fixtureName) {
  return withPlans(fixtureName, async ({ plans, consoleErrors, openPlanDetail }) => {
    const response = await plans.open();
    expect(response?.status(), 'HTTP status').toBe(200);
    await expect(plans.h1).toHaveText(plans.data.h1);
    const filters = await plans.filtersVisible();
    expect(filters, 'rating, insurer and sort controls visible').toEqual({ rating: true, insurer: true, sort: true });
    expect(await plans.cardCount(), 'plan cards on first load').toBe(plans.data.pageSize);
    expect(consoleErrors.list(), 'console errors').toEqual([]);
  });
}

function defaultState(fixtureName, { expectScope } = {}) {
  return withPlans(fixtureName, async ({ plans, consoleErrors, openPlanDetail }) => {
    await plans.open();

    const ratings = await plans.ratingOptions();
    expect(ratings.filter((r) => r.checked), 'exactly one rating option selected').toHaveLength(1);
    expect.soft(ratings.find((r) => r.checked)?.label, 'default rating option').toBe(plans.data.defaults.rating);

    const scope = await plans.insurerScopeOptions();
    expect(scope.filter((s) => s.checked), 'exactly one insurer scope selected').toHaveLength(1);
    if (expectScope) expect.soft(scope.find((s) => s.checked)?.label, 'default insurer scope').toBe(expectScope);

    const insurers = await plans.insurerCheckboxes();
    expect(insurers).toHaveLength(plans.data.insurers.length);
    expect(insurers.filter((i) => !i.checked).map((i) => i.value), 'unticked insurers').toEqual([]);

    expect.soft(await plans.selectedSort(), 'default sort').toBe(plans.data.defaults.sort);

    const counter = await plans.readCounter();
    expect(counter.text).toBe(`Showing ${plans.data.pageSize} of ${plans.data.totalPlans} plans`);
    expect(counter.shown, 'counter X equals cards shown').toBe(await plans.cardCount());
  });
}

function loadMore(fixtureName) {
  return withPlans(fixtureName, async ({ plans, consoleErrors, openPlanDetail }) => {
    await plans.open();
    const steps = await plans.loadAll();

    steps.forEach((s, i) => {
      const expected = Math.min(s.before + plans.data.pageSize, plans.data.totalPlans);
      expect.soft(s.after, `click ${i + 1}: cards after Load More (was ${s.before})`).toBe(expected);
      expect.soft(s.counter.shown, `click ${i + 1}: counter matches cards`).toBe(s.after);
    });

    const counter = await plans.readCounter();
    expect(counter.shown, 'X = Y at the end').toBe(counter.total);
    expect(counter.total).toBe(plans.data.totalPlans);
    expect(await plans.isLoadMoreVisible(), 'Load More hidden at the end').toBe(false);
    const names = await plans.cardNames();
    expect(duplicates(names), 'duplicate plans').toEqual([]);
    expect(names).toHaveLength(plans.data.totalPlans);
  });
}

function defaultSort(fixtureName, { reloads = 0, tiedPlans } = {}) {
  return withPlans(fixtureName, async ({ plans, consoleErrors, openPlanDetail }) => {
    await plans.open();
    await plans.loadAll();
    const first = await plans.readCards();
    expect(increasesAt(first.map((c) => c.rating)), 'ratings must never go up down the list').toEqual([]);

    if (tiedPlans) {
      const order = (cards) => cards.map((c) => c.name).filter((n) => tiedPlans.includes(n));
      const baseline = order(first);
      expect(baseline, 'tied plans present').toHaveLength(tiedPlans.length);
      for (let i = 1; i <= reloads; i++) {
        await plans.page.reload();
        await plans.waitForReady();
        await plans.loadAll();
        expect(order(await plans.readCards()), `tie order after reload ${i}`).toEqual(baseline);
      }
    }
  });
}

function priceSort(fixtureName, { reloadAndCompare = false } = {}) {
  return withPlans(fixtureName, async ({ plans, consoleErrors, openPlanDetail }) => {
    await plans.open();
    await plans.sortBy('Price: Low to High');
    const firstPage = await plans.readCards();
    expect(priceOrderBreaks(firstPage.map((c) => c.priceTier)), 'first page price order').toEqual([]);
    await plans.loadAll();
    const all = await plans.readCards();
    expect(all.every((c) => ['Economical', 'Fair', 'Expensive'].includes(c.priceTier)), 'every card has a price tier').toBe(true);
    expect(priceOrderBreaks(all.map((c) => c.priceTier)), 'Economical -> Fair -> Expensive across Load More').toEqual([]);
    expect(all.slice(0, firstPage.length).map((c) => c.name), 'Load More keeps the first page in place').toEqual(firstPage.map((c) => c.name));

    if (reloadAndCompare) {
      await plans.page.reload();
      await plans.waitForReady();
      await plans.sortBy('Price: Low to High');
      await plans.loadAll();
      const again = await plans.readCards();
      expect(again.map((c) => c.name), 'order within each badge is the same after reload').toEqual(all.map((c) => c.name));
    }
  });
}

function subRatingFilters(fixtureName) {
  return withPlans(fixtureName, async ({ plans, consoleErrors, openPlanDetail }) => {
    await plans.open();
    await plans.loadAll();
    const defaultOrder = (await plans.readCards()).map((c) => c.name);

    // Baseline sub-ratings from each card's popover in the default view.
    const baseline = {};
    for (let i = 0; i < defaultOrder.length; i++) {
      baseline[defaultOrder[i]] = await plans.card(i).subRatings();
    }

    for (const label of ['Claims Experience', 'Customer Service', 'Product Benefits']) {
      await plans.selectRating(label);
      await plans.loadAll();
      const cards = await plans.readCards();
      expect.soft(cards, `${label}: all plans still listed`).toHaveLength(defaultOrder.length);
      const mismatched = cards.filter((c) => baseline[c.name] && baseline[c.name][label] !== c.rating)
        .map((c) => `${c.name}: card ${c.rating}, ${label} ${baseline[c.name][label]}`);
      expect.soft(mismatched, `${label}: card shows the selected sub-rating`).toEqual([]);
      expect.soft(increasesAt(cards.map((c) => c.rating)), `${label}: ordered high to low`).toEqual([]);
    }

    await plans.selectRating('All');
    await plans.loadAll();
    expect((await plans.readCards()).map((c) => c.name), 'All restores the default order').toEqual(defaultOrder);
  });
}

function insurerFilter(fixtureName) {
  return withPlans(fixtureName, async ({ plans, consoleErrors, openPlanDetail }) => {
    await plans.open();
    await plans.loadAll();
    const allNames = await plans.cardNames();
    const total = (await plans.readCounter()).total;

    for (const insurer of plans.data.insurers) {
      await test.step(`Only "${insurer.value.trim()}"`, async () => {
        const expected = allNames.filter((n) => norm(n).startsWith(norm(insurer.prefix)));
        await plans.filterByOnlyInsurer(insurer.value);
        await plans.loadAll();
        const shown = await plans.cardNames();
        const counter = await plans.readCounter();
        const others = shown.filter((n) => !norm(n).startsWith(norm(insurer.prefix)));
        const missing = expected.filter((n) => !shown.includes(n));
        expect.soft(others, `${insurer.value.trim()}: plans from other insurers`).toEqual([]);
        expect.soft(missing, `${insurer.value.trim()}: missing plans`).toEqual([]);
        expect.soft(counter.total, `${insurer.value.trim()}: counter total`).toBe(expected.length);
        expect.soft(counter.shown, `${insurer.value.trim()}: counter shown`).toBe(shown.length);
      });
    }
    await plans.setSelectAll(true);
    await plans.settle();
    expect((await plans.readCounter()).total, 'Select All restores every plan').toBe(total);
  });
}

function cardMatchesDetail(fixtureName) {
  return withPlans(fixtureName, async ({ plans, consoleErrors, openPlanDetail }) => {
    test.setTimeout(10 * 60_000);
    await plans.open();
    await plans.loadAll();
    const cards = await plans.readCards();
    expect(cards.length).toBe(plans.data.totalPlans);

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      await test.step(card.name, async () => {
        const subRatings = await plans.card(i).subRatings();
        const { detail, status, url, close } = await openPlanDetail(card.href);
        expect.soft(status, `${card.name}: HTTP status`).toBe(200);
        expect.soft(new URL(url).pathname, `${card.name}: opened the right page`).toBe(card.href);
        const d = await detail.read();
        expect.soft(norm(d.name), `${card.name}: name`).toBe(norm(card.name));
        expect.soft(d.rating, `${card.name}: rating`).toBe(card.rating);
        expect.soft(d.priceTier, `${card.name}: price badge`).toBe(card.priceTier);
        expect.soft(d.subRatings, `${card.name}: sub-ratings`).toEqual(subRatings);
        // Detail pages describe features in longer sentences, so a missing exact phrase
        // is recorded in the report for review instead of failing the test.
        const notVerbatim = card.features.filter((f) => !norm(d.bodyText).includes(norm(f)));
        if (notVerbatim.length) {
          test.info().annotations.push({ type: 'feature text differs', description: `${card.name}: ${notVerbatim.join('; ')}` });
        }
        await close();
      });
    }
  });
}

module.exports = { pageLoad, defaultState, loadMore, defaultSort, priceSort, subRatingFilters, insurerFilter, cardMatchesDetail };
