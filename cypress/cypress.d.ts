import { mount } from 'cypress/react';

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }

    interface Chainable {
      selection(subject: string, fn: any): Chainable;
      setSelection(subject: string, query: string | object, endQuery: any[]): Chainable;
      clearAndType(selector: string, value: string): Chainable;
      shouldNotBeActionable(
        done: Mocha.Done,
        clickOptions?: Partial<Cypress.ClickOptions> & {
          position?: Cypress.PositionType;
        }
      ): Chainable<Element>;
      // setCursor(subject: string, options?: Partial<TypeOptions>): Chainable<Element>;
      // setCursorBefore(subject: string, options?: Partial<TypeOptions>): Chainable<Element>;
      // setCursorAfter(subject: string, options?: Partial<TypeOptions>): Chainable<Element>;
    }
  }
}
