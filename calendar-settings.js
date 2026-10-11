function normalizeAutoCollapseSeconds(value) {
  return Number.isInteger(value) && value >= 1 && value <= 60 ? value : 4;
}
function normalizeReminderMinutes(value) {
  return [0, 5, 10, 15].includes(value) ? value : 10;
}
module.exports = { normalizeAutoCollapseSeconds, normalizeReminderMinutes };
