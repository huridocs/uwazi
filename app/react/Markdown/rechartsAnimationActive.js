export function isMarkdownChartAnimationActive() {
  return typeof window === 'undefined' || !window.Cypress;
}
