import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Metadata.stories.tsx';

describe('MultiselectList.cy.tsx', () => {
  const { Basic } = composeStories(stories);

  describe('General', () => {
    it('should be accessible', () => {
      cy.injectAxe();
      mount(<Basic />);
      cy.checkA11y();
    });
  });

  describe('Template label', () => {
    it('sould change the text color based on template color', () => {
      mount(<Basic />);
    });
  });
});
