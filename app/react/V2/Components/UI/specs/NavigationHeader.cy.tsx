import React from 'react';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/NavigationHeader.stories';

const { Basic, WithLink } = composeStories(stories);

describe('NavigationHeader', () => {
  it('should only render the back link when the URL is defined', () => {
    cy.viewport(550, 750);
    mount(<WithLink />);
    cy.get('a').should('have.attr', 'href').and('equals', '/backUrl');

    mount(<Basic />);
    cy.get('a').should('not.exist');
  });

  it('should make the back link visible only on mobile', () => {
    cy.viewport(550, 750);
    mount(<WithLink />);
    cy.get('a').should('be.visible');

    cy.viewport(1280, 720);
    mount(<WithLink />);
    cy.get('a').should('not.be.visible');
  });
});
