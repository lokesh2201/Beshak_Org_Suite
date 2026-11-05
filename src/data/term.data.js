/** Expected data for the Best Term Insurance Plans page (TC-TP*, TC-CP06). */
module.exports = {
  h1: 'Best Term Life Insurance Plans of 2026',
  pageSize: 5,
  totalPlans: 8,
  defaults: {
    rating: 'All',
    sort: 'Rating: High to Low',
  },
  insurers: [
    { value: 'Aditya Birla Sun Life', prefix: 'Aditya Birla Sun Life' },
    { value: 'Axis Max Life', prefix: 'Axis Max Life' },
    { value: 'Bajaj Life', prefix: 'Bajaj Life' },
    { value: 'HDFC Life', prefix: 'HDFC Life' },
    { value: 'ICICI Life Insurance Co. Ltd', prefix: 'ICICI Life' },
    { value: 'LIC', prefix: 'LIC' },
    { value: 'TATA AIA', prefix: 'TATA AIA' },
  ],
  tiedPlans: ['TATA AIA Sampoorna Raksha Promise', 'Axis Max Life Smart Term Plan Plus'],
  compare: {
    pair: ['TATA AIA Sampoorna Raksha Promise', 'Axis Max Life Smart Term Plan Plus'],
  },
};
