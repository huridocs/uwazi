// E2E-specific commands (not used in component tests)

// Overwrite checkA11y to handle missing axe-core injection after page navigations
// This fixes intermittent CI failures where window.axe is undefined
// Particularly important with testIsolation: false where navigations clear window.axe
Cypress.Commands.overwrite(
  'checkA11y',
  (originalFn, context, options, violationCallback, skipFailures) =>
    // Check if axe exists on window, re-inject if missing
    cy.window().then(win => {
      if (!win.axe) {
        cy.log('⚠️ window.axe undefined - re-injecting after navigation');
        return cy
          .injectAxe()
          .then(() => originalFn(context, options, violationCallback, skipFailures));
      }
      return originalFn(context, options, violationCallback, skipFailures);
    })
);

export {};
