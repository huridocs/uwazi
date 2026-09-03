import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import * as stories from '#app/stories/Forms/RadioSelect.stories.js';

const { Basic, Horizontal } = stories;

describe('RadioSelect', () => {
  beforeEach(() => {
    mount(<Basic.Component />);
  });

  it('should be accessible', () => {
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should show all the options', () => {
    cy.get('fieldset label').should($labels => {
      expect([...$labels].map(el => el.textContent?.trim())).to.deep.equal([
        'USA',
        'Germany',
        'Spain',
        'United Kingdom',
        'China',
      ]);
    });
  });

  it('should be vertical by default', () => {
    cy.get('fieldset').should('have.class', 'flex-col max-w-md');
    cy.get('fieldset > div').should('not.have.class', 'mr-4');
  });

  it('should have checked the default checked property', () => {
    cy.get('input[type="radio"]:checked').then($input => {
      cy.get(`label[for="${$input.attr('id')}"]`).should('contain', 'Spain');
    });
  });

  it('should disable the options specified', () => {
    cy.get('input[type="radio"]:disabled').then($input => {
      cy.get(`label[for="${$input.attr('id')}"]`).should('contain', 'United Kingdom');
      cy.get(`label[for="${$input.attr('id')}"]`).should('have.class', 'text-ink-muted');
    });
  });

  it('should execute on change when the selected option changes', () => {
    cy.get('input[type="radio"]').invoke('on', 'change', cy.stub().as('change'));
    cy.get('input[type="radio"]').eq(1).check();
    cy.get('@change').should('have.been.called');
  });

  it('should select an option when clicking its label', () => {
    cy.contains('label', 'Germany').click();
    cy.get('#country_germany').should('be.checked');
  });
});

describe('RadioSelect Horizontal', () => {
  beforeEach(() => {
    mount(<Horizontal.Component />);
  });

  it('should be accessible', () => {
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should be horizontal if specified', () => {
    cy.get('fieldset').should('not.have.class', 'flex-col max-w-md');
    cy.get('fieldset > div').should('have.class', 'mr-4');
  });
});
