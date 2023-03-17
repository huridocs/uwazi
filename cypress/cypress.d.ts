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
      toMatchImageSnapshot(options?: {
        imageConfig: {
          createDiffImage: boolean; // Should a "diff image" be created, can be disabled for performance
          threshold: number; // Amount in pixels or percentage before snapshot image is invalid
          thresholdType: 'percent' | 'pixel'; // Can be either "pixel" or "percent"
        };
        name: string; // Naming resulting image file with a custom name rather than concatenating test titles
        separator: string; // Naming resulting image file with a custom separator rather than using the default ` #`
      }): Chainable;
      // setCursor(subject: string, options?: Partial<TypeOptions>): Chainable<Element>;
      // setCursorBefore(subject: string, options?: Partial<TypeOptions>): Chainable<Element>;
      // setCursorAfter(subject: string, options?: Partial<TypeOptions>): Chainable<Element>;
    }
  }
}
