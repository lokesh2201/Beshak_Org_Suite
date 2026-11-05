// Sheet: "Health Insurance" (TC-HP01 - TC-HP08)
const { test } = require('../src/fixtures/test');
const suite = require('./shared/bestPlansSuite');
const data = require('../src/data/health.data');

const P = 'healthPlansPage';

test.describe('Best Health Insurance Plans page', () => {
  test('TC-HP01 Best Health Plans page loads with plan cards', { tag: ['@smoke', '@P1'] }, suite.pageLoad(P));

  test('TC-HP02 Default filters, sort and results counter are correct', { tag: ['@smoke', '@P1'] },
    suite.defaultState(P, { expectScope: data.defaults.insurerScope }));

  test('TC-HP03 Load More shows every plan once', { tag: ['@data', '@P1'] }, suite.loadMore(P));

  test('TC-HP04 Default sort is rating high to low', { tag: ['@data', '@P1'] }, suite.defaultSort(P));

  test('TC-HP05 Sort by Price: Low to High', { tag: ['@data', '@P1'] }, suite.priceSort(P, { reloadAndCompare: true }));

  test('TC-HP06 Sub-rating filters re-rank plans', { tag: ['@data', '@P1'] }, suite.subRatingFilters(P));

  test('TC-HP07 Each insurer filter returns all and only its plans', { tag: ['@data', '@P1'] }, suite.insurerFilter(P));

  test('TC-HP08 Plan card matches its plan detail page', { tag: ['@data', '@P1'] }, suite.cardMatchesDetail(P));
});
