// E2E-specific commands (not used in component tests)

const axeRunOptionsForThemedUi = options => {
  const contrastDefault = { rules: { 'color-contrast': { enabled: false } } };
  if (options == null || typeof options !== 'object') {
    return contrastDefault;
  }
  return {
    ...options,
    rules: {
      ...contrastDefault.rules,
      ...(options.rules ?? {}),
    },
  };
};

// Overwrite checkA11y to handle missing axe-core injection after page navigations
// This fixes intermittent CI failures where window.axe is undefined
// Particularly important with testIsolation: false where navigations clear window.axe
Cypress.Commands.overwrite(
  'checkA11y',
  (originalFn, context, options, violationCallback, skipFailures) =>
    cy.window().then(win => {
      const opts = axeRunOptionsForThemedUi(options);
      if (!win.axe) {
        cy.log('⚠️ window.axe undefined - re-injecting after navigation');
        return cy
          .injectAxe()
          .then(() => originalFn(context, opts, violationCallback, skipFailures));
      }
      return originalFn(context, opts, violationCallback, skipFailures);
    })
);

Cypress.Commands.add('cleanupUnexpectedUi', () => {
  cy.get('body', { log: false }).then($body => {
    if ($body.find('.attachments-modal__overlay').length) {
      cy.get('body', { log: false }).type('{esc}', { force: true, log: false });
    }
    if ($body.find('button:contains("Dismiss")').length) {
      cy.contains('button', 'Dismiss', { log: false }).click({ force: true, log: false });
    }
    if ($body.find('[data-testid="modal"] button:contains("Close")').length) {
      cy.get('[data-testid="modal"]', { log: false })
        .contains('button', 'Close', { log: false })
        .click({ force: true, log: false });
    }
  });
});

Cypress.on('window:before:load', win => {
  win.alert = message => {
    throw new Error(`Unexpected browser alert: ${String(message)}`);
  };
  win.confirm = message => {
    throw new Error(`Unexpected browser confirm: ${String(message)}`);
  };
  win.prompt = message => {
    throw new Error(`Unexpected browser prompt: ${String(message)}`);
  };
});

export {};
