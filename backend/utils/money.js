function toMoney(n) {
  return Math.round(Number(n) * 100) / 100;
}
function formatMoney(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
  }).format(Number(n));
}
module.exports = { toMoney, formatMoney };