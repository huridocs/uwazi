import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import * as stories from '#app/stories/Components/UI/DropdownListbox.stories.js';

const { Sort, Disabled } = stories;

describe('DropdownListbox', () => {
  it('should be accessible when open', () => {
    mount(<Sort.Component />);
    cy.get('button[aria-haspopup="listbox"]').click();
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should open, select an option, and close the menu', () => {
    mount(<Sort.Component />);
    cy.contains('button', 'Appearance').should('be.visible');
    cy.get('button[aria-haspopup="listbox"]').click();
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="option"]').contains('Z → A').click();
    cy.get('[role="listbox"]').should('not.exist');
    cy.contains('button', 'Z → A').should('be.visible');
  });

  it('should close when clicking the backdrop', () => {
    mount(<Sort.Component />);
    cy.get('button[aria-haspopup="listbox"]').click();
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('body').click(0, 0);
    cy.get('[role="listbox"]').should('not.exist');
  });

  it('should not open when disabled', () => {
    mount(<Disabled.Component />);
    cy.get('button[aria-haspopup="listbox"]').should('be.disabled');
    cy.get('button[aria-haspopup="listbox"]').click({ force: true });
    cy.get('[role="listbox"]').should('not.exist');
  });
});
