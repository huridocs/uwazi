import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import * as stories from '#app/stories/Forms/EnableButtonCheckbox.stories.js';

const { Basic } = stories;

describe('EnableButtonCheckbox', () => {
  it('should be accessible', () => {
    cy.injectAxe();
    mount(<Basic.Component />);
    cy.checkA11y();
  });

  it('should return the input event on change', () => {
    const onChangeSpy = cy.stub().as('onChange');
    Basic.composed.args.onChange = onChangeSpy;
    mount(<Basic.Component />);

    cy.contains('Activate').click();
    cy.get('@onChange').should('have.been.calledWithMatch', { target: { checked: true } });

    cy.contains('Disable').click();
    cy.get('@onChange').should('have.been.calledWithMatch', { target: { checked: false } });
  });
});
