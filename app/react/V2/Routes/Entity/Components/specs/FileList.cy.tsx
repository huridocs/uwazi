import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../../../../../../app/react/stories/FileList.stories.js';
import { logA11yViolations } from '../../../../../../../cypress/support/helpers/a11y.js';

const { Empty, WithFiles } = composeStories(stories);

describe('FileList', () => {
  it('should be accessible', () => {
    mount(<WithFiles />);
    cy.injectAxe();
    cy.checkA11y(undefined, undefined, logA11yViolations);
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
