import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Forms/EnableButtonCheckbox.stories';

const { Basic } = composeStories(stories);

describe('EnableButtonCheckbox', () => {
  it('should be accessible', () => {
    mount(<Basic />);
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should return the input event on change', () => {
    const onChangeSpy = cy.stub().as('onChange');
    Basic.args.onChange = onChangeSpy;
    mount(<Basic />);

    cy.contains('Activate').click();
    cy.get('@onChange').should('have.been.calledWithMatch', { target: { checked: true } });

    cy.contains('Disable').click();
    cy.get('@onChange').should('have.been.calledWithMatch', { target: { checked: false } });
  });
});
