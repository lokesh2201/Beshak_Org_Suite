/** Network helpers: tracker blocking and the production write-guard. */

const TRACKER_HOSTS = [
  'google-analytics.com', 'analytics.google.com', 'googletagmanager.com', 'doubleclick.net',
  'googleadservices.com', 'google.com/ccm', 'google.com/rmkt', 'google.com/pagead',
  'mixpanel.com', 'taboola.com', 'bat.bing.com', 'clarity.ms', 'facebook.net',
  'facebook.com/tr', 'hotjar.com', 'getsitecontrol.com',
];

const isTracker = (url) => TRACKER_HOSTS.some((h) => url.includes(h));

/** Aborts analytics/ad requests so automated runs don't pollute production analytics. */
async function blockTrackers(context) {
  await context.route((url) => isTracker(url.href), (route) => route.abort());
}

/**
 * Blocks every non-GET request to Beshak's own backends and file storage.
 * The proposal form only writes on final Submit, but this guard makes sure a test
 * can never change the shared production proposal, even if the app changes.
 * Returns the list of blocked requests so tests can assert on what was attempted.
 */
async function guardProposalWrites(context) {
  const blocked = [];
  const isBackend = (u) => /(^|\.)beshak\.org\//.test(u.host + '/') || /amazonaws\.com/.test(u.host);
  await context.route((url) => isBackend(url), async (route) => {
    const req = route.request();
    if (req.method() !== 'GET' && req.method() !== 'OPTIONS' && !req.url().includes('cms.beshak.org/graphql')) {
      blocked.push({ method: req.method(), url: req.url() });
      return route.abort('blockedbyclient');
    }
    return route.fallback();
  });
  return blocked;
}

module.exports = { TRACKER_HOSTS, isTracker, blockTrackers, guardProposalWrites };
