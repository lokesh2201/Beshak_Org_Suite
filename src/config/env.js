const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const env = {
  BASE_URL: process.env.BASE_URL || 'https://www.beshak.org',
  HEALTH_PROPOSAL_ID: process.env.HEALTH_PROPOSAL_ID || '',
  PROPOSAL_API_URL: process.env.PROPOSAL_API_URL || 'https://vision.beshak.org/api/marketplace/proposals/verify_proposal_link',
  WORKERS: Number(process.env.WORKERS || 2),
  // Block analytics/ad trackers so automated runs don't skew production analytics.
  BLOCK_TRACKERS: (process.env.BLOCK_TRACKERS || 'true').toLowerCase() !== 'false',
};

module.exports = env;
