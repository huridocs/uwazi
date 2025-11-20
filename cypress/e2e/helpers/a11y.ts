import type { Result } from 'axe-core';

const formatViolationData = (violations: Result[]) =>
  violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    nodes: violation.nodes.length,
    target: violation.nodes
      .map(node => node.target && node.target.join(', '))
      .filter(Boolean)
      .join(' | '),
  }));

const logA11yViolations = (violations: Result[]) => {
  if (!violations?.length) {
    return;
  }

  cy.task(
    'log',
    `${violations.length} accessibility violation${violations.length === 1 ? '' : 's'} detected`
  );

  cy.task('table', formatViolationData(violations));
};

export { logA11yViolations };
