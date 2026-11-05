/**
 * Expected data for the Best Health Insurance Plans page (TC-HP*, TC-CP01-05).
 *
 * `insurers` maps each insurer filter value (exactly as in the checkbox `value`,
 * including the stray trailing spaces) to the plan-name prefix used on the cards.
 * Tests use the prefix to work out, from the unfiltered list, which plans the
 * filter should return. That keeps the check independent of the filter itself.
 */
module.exports = {
  h1: 'Best Health Insurance Plans of 2026',
  pageSize: 5,
  totalPlans: 20,
  defaults: {
    rating: 'All',
    insurerScope: 'Large Insurers',
    sort: 'Rating: High to Low',
  },
  insurers: [
    { value: 'Bajaj Allianz', prefix: 'Bajaj General' },
    { value: 'Care Insurance ', prefix: 'Care Insurance' },
    { value: 'Go Digit', prefix: 'Go Digit' },
    { value: 'HDFC Ergo', prefix: 'HDFC Ergo' },
    { value: 'ICICI Lombard', prefix: 'ICICI Lombard' },
    { value: 'IndusInd General', prefix: 'IndusInd General' },
    { value: 'ManipalCigna', prefix: 'ManipalCigna' },
    { value: 'Niva Bupa', prefix: 'Niva Bupa' },
    { value: 'Star Health ', prefix: 'Star Health' },
    { value: 'Tata AIG', prefix: 'Tata AIG' },
  ],
  compare: {
    pair: ['HDFC Ergo Optima Secure + Key Add-ons', 'ICICI Lombard Elevate + Key Add-ons'],
  },
};
