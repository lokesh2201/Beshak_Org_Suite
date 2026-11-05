/** Small pure helpers used by specs to describe list ordering and uniqueness problems. */

const PRICE_ORDER = { Economical: 0, Fair: 1, Expensive: 2 };

/** Returns the positions where a list goes UP (i.e. breaks a high-to-low order). */
function increasesAt(values) {
  const breaks = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) breaks.push({ index: i, prev: values[i - 1], value: values[i] });
  }
  return breaks;
}

/** Returns the positions where the price tier goes DOWN (breaks Economical -> Fair -> Expensive). */
function priceOrderBreaks(tiers) {
  const breaks = [];
  for (let i = 1; i < tiers.length; i++) {
    if ((PRICE_ORDER[tiers[i]] ?? 99) < (PRICE_ORDER[tiers[i - 1]] ?? 99)) {
      breaks.push({ index: i, prev: tiers[i - 1], value: tiers[i] });
    }
  }
  return breaks;
}

function duplicates(values) {
  const seen = new Set();
  return values.filter((v) => (seen.has(v) ? true : (seen.add(v), false)));
}

/** Case- and whitespace-insensitive text compare (the site applies CSS text-transform). */
function norm(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

module.exports = { PRICE_ORDER, increasesAt, priceOrderBreaks, duplicates, norm };
