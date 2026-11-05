/** Expected data for the Health Articles and Videos pages (TC-A*, TC-V*). */
module.exports = {
  articles: {
    h1: 'Featured Articles',
    featuredTitle: '10 little-known causes for disputes in a health insurance claim',
    listCardPositions: [8], // 1-based, as in the test case
    categories: [
      { id: 'purchase', label: 'Purchase' },
      { id: 'parents-health-insurance', label: 'Parents-Health-Insurance' },
      { id: 'claim', label: 'Claim' },
      { id: 'basics', label: 'Basics Of Insurance' },
    ],
    searchTerm: 'Claim',
    // A fresh page keeps loading on scroll; the sheet records 138-183 articles in total.
    minTotalArticles: 100,
  },
  videos: {
    h1: 'Featured Videos',
    featuredCount: 4,
    listCount: 15,
    searchTerms: ['covid', 'Mahavir'],
  },
};
