import React from 'react';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/testing-react';
import { Provider } from 'react-redux';
import * as stories from 'app/stories/NavigationHeader.stories';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

const { Basic, WithLink } = composeStories(stories);

describe('NavigationHeader', () => {
  const wrapper = (children: any) => <Provider store={createStore()}>{children}</Provider>;

  it('should only render the back link when the URL is defined', () => {
    cy.viewport(550, 750);
    mount(wrapper(<WithLink />));
    cy.get('a').should('have.attr', 'href').and('equals', '/backUrl');

    mount(wrapper(<Basic />));
    cy.get('a').should('not.exist');
  });

  it('should make the back link visible only on mobile', () => {
    cy.viewport(550, 750);
    mount(wrapper(<WithLink />));
    cy.get('a').should('be.visible');

    cy.viewport(1280, 720);
    mount(wrapper(<WithLink />));
    cy.get('a').should('not.be.visible');
  });
});
