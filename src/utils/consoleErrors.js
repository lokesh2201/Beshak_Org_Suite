const { isTracker } = require('./network');

/**
 * Collects console errors and uncaught page errors for "no console errors" checks.
 * Errors caused by our own tracker blocking are ignored.
 */
class ConsoleErrors {
  constructor(page) {
    this.errors = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const where = msg.location()?.url || '';
      const text = msg.text();
      if (isTracker(where) || (/ERR_FAILED|ERR_BLOCKED_BY_CLIENT/.test(text) && isTracker(text + where))) return;
      if (/net::ERR_BLOCKED_BY_CLIENT/.test(text)) return;
      this.errors.push(`console: ${text}${where ? ` (${where})` : ''}`);
    });
    page.on('pageerror', (err) => this.errors.push(`pageerror: ${err.message}`));
  }

  list() {
    return [...this.errors];
  }
}

module.exports = { ConsoleErrors };
