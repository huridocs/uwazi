// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import 'cypress-fail-fast';
import 'cypress-axe'; // Import before e2ecommands.js so checkA11y exists for overwrite
import './commands'; // Generic commands for both e2e and component tests
import './e2ecommands'; // E2E-specific command overwrites
// Alternatively you can use CommonJS syntax:
// require('./commands')

Cypress.on('uncaught:exception', error => {
  if (error.message.includes('Script error.')) {
    return false;
  }
  if (error.message.includes('ResizeObserver loop completed with undelivered notifications.')) {
    return false;
  }
  if (
    error.message.includes("Failed to execute 'importScripts' on 'WorkerGlobalScope'") ||
    error.message.includes('editor.worker.js')
  ) {
    return false;
  }
});
