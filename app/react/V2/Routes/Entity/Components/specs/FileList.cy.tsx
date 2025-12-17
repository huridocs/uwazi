import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/FileList.stories';

const { Empty, WithFiles } = composeStories(stories);

describe('FileList', () => {
  it('should be accessible', () => {
    mount(<WithFiles />);
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should render empty state when entity has no files', () => {
    mount(<Empty />);
    cy.contains('No files available').should('exist');
  });

  it('should render file cards when entity has files', () => {
    mount(<WithFiles />);
    cy.get('[role="listitem"]').should('have.length.at.least', 1);
    cy.get('[role="region"][aria-label="Files list"]').should('exist');
  });
});

