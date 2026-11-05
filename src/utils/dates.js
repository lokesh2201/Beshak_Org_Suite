/** Returns {day, month, year} for today minus `years` years, shifted by `dayOffset` days. */
function yearsAgo(years, dayOffset = 0) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setDate(d.getDate() + dayOffset);
  return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
}

/** Formats {day, month, year} as DD-MM-YYYY (the format the site's date pickers show). */
function formatDmy({ day, month, year }) {
  return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
}

/** Age in full years on `onDate` for someone born on {day, month, year}. */
function ageOn({ day, month, year }, onDate = new Date()) {
  let age = onDate.getFullYear() - year;
  const m = onDate.getMonth() + 1;
  if (m < month || (m === month && onDate.getDate() < day)) age -= 1;
  return age;
}

module.exports = { yearsAgo, formatDmy, ageOn };
