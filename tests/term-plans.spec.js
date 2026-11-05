// Sheet: "Term Insurance" (TC-TP01 - TC-TP08)
const { test } = require('../src/fixtures/test');
const suite = require('./shared/bestPlansSuite');
const data = require('../src/data/term.data');

const P = 'termPlansPage';

test.describe('Best Term Insurance Plans page', () => {
  test('TC-TP01 Best Term Plans page loads with plan cards', { tag: ['@smoke', '@P1'] }, suite.pageLoad(P));

  test('TC-TP02 Default filters, sort and results counter are correct', { tag: ['@smoke', '@P1'] }, suite.defaultState(P));

  test('TC-TP03 Load More shows all 8 plans once', { tag: ['@data', '@P1'] }, suite.loadMore(P));

  test('TC-TP04 Rating sort and tie-break order', { tag: ['@data', '@P1'] },
    suite.defaultSort(P, { reloads: 3, tiedPlans: data.tiedPlans }));

  test('TC-TP05 Sort by Price: Low to High', { tag: ['@data', '@P1'] }, suite.priceSort(P));

  test('TC-TP06 Sub-rating filters re-rank plans', { tag: ['@data', '@P1'] }, suite.subRatingFilters(P));

  test('TC-TP07 Each insurer filter returns all and only its plans', { tag: ['@data', '@P1'] }, suite.insurerFilter(P));

  test('TC-TP08 Plan card matches its plan detail page', { tag: ['@data', '@P1'] }, suite.cardMatchesDetail(P));
});
