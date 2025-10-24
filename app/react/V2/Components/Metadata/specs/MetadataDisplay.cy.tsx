import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import { DEFAULT_ENTITY_BASE_PATH } from 'V2/application/optionsPresets';
import * as stories from 'app/stories/Metadata.stories';

describe('Metadata Display', () => {
  const { Basic } = composeStories(stories);

  // eslint-disable-next-line max-statements
  describe('General', () => {
    beforeEach(() => {
      Basic.args.showGeolocationProperties = false;
      mount(<Basic />);
    });

    it('renders the entity title with the icon', () => {
      cy.contains('dt', 'Title').should('not.be.visible');
      cy.contains('dd', 'Title of the displayed entity').should('exist');
      cy.contains('dd', 'Title of the displayed entity').find('span[role="img"]').should('exist');
    });

    it('renders a simple text metadata value', () => {
      cy.contains('dt', 'A basic simple text').should('exist');
      cy.contains('dd', 'Emergency incident report from downtown area').should('exist');
    });

    it('renders markdown (html) content and link', () => {
      cy.contains('dt', 'Markdown field using sanitized HTML tags').should('exist');
      cy.contains('div', 'This Markdown field includes').should('exist');
      cy.contains('dd', 'This Markdown field includes').within(() => {
        cy.get('a[href="https://example.com"]').should('have.attr', 'target', '_blank');
      });
    });

    it('renders markdown syntax (bold/italic) content', () => {
      cy.contains('dt', 'Markdown field using standar markdown syntax').should('exist');
      cy.contains('strong', 'Bold text').should('exist');
      cy.contains('em', 'italic text').should('exist');
      cy.contains('dd', 'italic text').within(() => {
        cy.get('a[href="https://example.com"]');
      });
    });

    it('renders select and multiselect labels including parent prefix', () => {
      cy.contains('dt', 'Single select').should('exist');
      cy.contains('dt', 'Multiple selector').should('exist');
      cy.contains('span', 'Again').should('exist');
      cy.contains('span', 'Acknowledging').should('exist');
      cy.contains('span', 'Grouped verbs: verb1').should('exist');
    });

    it('renders relationship links with correct hrefs', () => {
      cy.contains('dt', 'Relationship with inheritance').should('exist');
      cy.contains('a.underline', 'Traffic Accident - Main Street')
        .should('have.attr', 'href', `${DEFAULT_ENTITY_BASE_PATH}entity4`)
        .should('have.attr', 'target', '_blank');
      cy.contains('a.underline', 'Traffic Accident - Main Street')
        .parent()
        .find('span[role="img"]')
        .should('exist');
    });

    it('renders external link property as anchor with correct href', () => {
      cy.contains('dt', 'External link').should('exist');
      cy.contains('dd', 'Police Report')
        .find('a')
        .should('have.attr', 'href', 'https://police.gov/reports/incident-2024-001')
        .should('have.attr', 'target', '_blank');
    });

    it('renders images with provided src and alt', () => {
      cy.contains('dt', 'Media with an image').should('exist');
      cy.contains('dt', /Preview of the main document/).should('exist');

      cy.get('img[alt="Alternative text for image"]').should(
        'have.attr',
        'src',
        '/short-video-thumbnail.jpg'
      );

      cy.get('img[alt="Anoying rich kid.pdf"]').should('have.attr', 'src', '/batman.jpg');
    });

    it('renders media timelinks as buttons', () => {
      cy.contains('dt', 'Media video with timelinks').should('exist');
      cy.contains('Timelink 1').should('exist');
      cy.contains('Timelink 2').should('exist');
    });
  });

  describe('accessibility', () => {
    it('should be accessible', () => {
      Basic.args.showGeolocationProperties = true;
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
        Basic.args.showGeolocationProperties = false;
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
