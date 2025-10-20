import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Metadata.stories';

describe('MultiselectList.cy.tsx', () => {
  const { Basic } = composeStories(stories);

  describe('General', () => {
    it('should be accessible', () => {
      cy.injectAxe();
      mount(<Basic />);
      cy.get('div[data-testid="map-container"]').should('exist');
      cy.checkA11y();
    });
  });

  describe('Template label', () => {
    const originalColor = Basic.args.context?.templates[0].color;

    afterEach(() => {
      if (Basic.args.context?.templates[0]) {
        Basic.args.context.templates[0].color = originalColor;
      }
    });

    [
      {
        templateColor: '#cdc6c4',
        expectedColor: 'rgb(0, 0, 0)',
      },
      {
        templateColor: '#2f0f06',
        expectedColor: 'rgb(255, 255, 255)',
      },
    ].forEach(({ templateColor, expectedColor }) => {
      it(`should display "${expectedColor}" for template color ${templateColor}`, () => {
        if (Basic.args.context?.templates[0]) {
          Basic.args.context.templates[0].color = templateColor;
        }
        mount(<Basic />);
        cy.contains('div', 'This is the title of Template 1').should(
          'have.css',
          'color',
          expectedColor
        );
      });
    });
  });
});
