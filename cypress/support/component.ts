// ***********************************************************
// This example support/component.ts is processed and
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
import '@4tw/cypress-drag-drop';
import './commands';
import '../../app/react/App/styles/globals.css';

// Alternatively you can use CommonJS syntax:
// require('./commands')

import { mount } from 'cypress/react18';
// Example use:
// cy.mount(<MyComponent />)
// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.

Cypress.Commands.add('mount', mount);

//@ts-ignore
const check = components => {
  cy.injectAxe();
  //@ts-ignore
  components.forEach(component => {
    mount(component);
    cy.checkA11y();
  });
};

Cypress.Commands.add('checkAccesibility', check);
