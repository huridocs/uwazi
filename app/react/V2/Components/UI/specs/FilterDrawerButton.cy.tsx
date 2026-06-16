import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import { composeStories } from '@storybook/react';
import * as stories from '#app/stories/Components/UI/FilterDrawerButton.stories.js';

const { Inactive, Active } = composeStories(stories);

describe('FilterDrawerButton', () => {
  it('should be accessible', () => {
    mount(<Inactive />);
    cy.injectAxe();
    cy.checkA11y();

    mount(<Active />);
    cy.checkA11y();
  });

  it('should call onClick when pressed', () => {
    const onClick = cy.stub().as('click');
    mount(<Inactive onClick={onClick} />);
    cy.contains('button', 'Filters').click();
    cy.get('@click').should('have.been.calledOnce');
  });

  it('should show inactive state without a count badge', () => {
    mount(<Inactive />);
    cy.contains('button', 'Filters').should('have.attr', 'aria-pressed', 'false');
    cy.contains('button', 'Filters').should('not.contain', '0');
  });

  it('should show active state with the filter count', () => {
    mount(<Active />);
    cy.contains('button', 'Filters').should('have.attr', 'aria-pressed', 'true').and('contain', '3');
  });
});
