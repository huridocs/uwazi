export function isMarkdownChartAnimationActive() {
  if (typeof window !== 'undefined' && window.Cypress) {
    return false;
  }
  if (typeof process !== 'undefined' && process.env && process.env.__testingEnvironment) {
    return false;
  }
  return true;
}
