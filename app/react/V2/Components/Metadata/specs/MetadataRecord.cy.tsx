import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import { composeStories } from '@storybook/react';
import * as stories from '#app/stories/EntityViewer/Metadata.stories.js';

describe('Metadata Record', () => {
  const { Basic } = composeStories(stories);

  describe('General', () => {
    beforeEach(() => {
      mount(<Basic showGeolocationProperties={false} />);
    });

    it('shows creation and edit dates in Details', () => {
      cy.get('[data-testid="metadata-record"]').should('exist');
      cy.contains('th', 'Creation Date').should('exist');
      cy.contains('th', 'Edit Date').should('exist');
    });

    it('shows simple text in Details', () => {
      cy.contains('th', 'A basic simple text').should('exist');
      cy.contains('td', 'Emergency incident report from downtown area').should('exist');
    });

    it('shows markdown field with link', () => {
      cy.contains('Markdown field using sanitized HTML tags').should('exist');
      cy.contains('This Markdown field includes').should('exist');
      cy.get('a[href="https://example.com"]').should('have.attr', 'target', '_blank');
    });

    it('shows markdown bold and italic', () => {
      cy.contains('Markdown field using standard markdown syntax').should('exist');
      cy.contains('strong', 'Bold text').should('exist');
      cy.contains('em', 'italic text').should('exist');
    });

    it('shows select and multiselect labels', () => {
      cy.contains('th', 'Single select').should('exist');
      cy.contains('th', 'Multiple selector').should('exist');
      cy.contains('span', 'Again').should('exist');
      cy.contains('span', 'Acknowledging').should('exist');
      cy.contains('span', 'Grouped verbs › verb1').should('exist');
    });

    it('shows relationship links under Relationships', () => {
      cy.contains('Relationships').should('exist');
      cy.contains('Relationship with inheritance').should('exist');
      cy.contains('via').should('exist');
      cy.contains('inherits').should('exist');
      cy.contains('a', 'Traffic Accident - Main Street')
        .should('have.attr', 'href', '/entityv2/entity4')
        .should('have.attr', 'target', '_blank');
      cy.contains('This value should not display').should('not.have.attr', 'href');
    });

    it('shows external link in Details', () => {
      cy.contains('th', 'External link').should('exist');
      cy.contains('td', 'Police Report')
        .find('a')
        .should('have.attr', 'href', 'https://police.gov/reports/incident-2024-001')
        .should('have.attr', 'target', '_blank');
    });

    it('shows media image without Document', () => {
      cy.contains('Document').should('not.exist');
      cy.get('img[src="/batman.jpg"]').should('exist');

      cy.contains('Media with an image').should('exist');
      cy.get('img[alt="/short-video-thumbnail.jpg"]').should(
        'have.attr',
        'src',
        '/short-video-thumbnail.jpg'
      );
    });

    it('shows media timelinks', () => {
      cy.contains('Media video with timelinks').should('exist');
      cy.contains('Timelink 1').should('exist');
      cy.contains('Timelink 2').should('exist');
    });
  });

  describe('accessibility', () => {
    it('should be accessible', () => {
      cy.injectAxe();
      mount(<Basic showGeolocationProperties={false} />);
      cy.checkA11y(undefined, {
        rules: {
          'color-contrast': { enabled: false },
          'heading-order': { enabled: false },
          dlitem: { enabled: false },
          'definition-list': { enabled: false },
        },
      });
    });
  });

  describe('dates', () => {
    it('shows dates in English locale', () => {
      mount(<Basic showGeolocationProperties={false} locale="en" />);

      cy.contains('td', 'Jan 1, 2024').should('exist');
      cy.contains('td', 'From Jan 1, 2024 ~ To Jan 2, 2024').should('exist');
    });

    it('shows dates in Russian locale', () => {
      mount(<Basic showGeolocationProperties={false} locale="ru" />);

      cy.contains('td', '1 янв. 2024').should('exist');
      cy.contains('td', 'From 1 янв. 2024 г. ~ To 2 янв. 2024 г.').should('exist');
    });
  });

  describe('Empty metadata fields', () => {
    const emptyEntity = {
      _id: '1',
      language: 'en',
      mongoLanguage: 'en',
      sharedId: 'shared1',
      title: 'Title of the displayed entity',
      template: 'template1',
      creationDate: 1759374706197,
      editDate: 1760366924144,
      metadata: {
        simple_text: [{ value: '' }],
        markdown_html: [{ value: '' }],
        single_date: [],
        multiple_dates: [],
        date_range: [],
        multiple_date_ranges: [],
        selected_image: [{ value: '', alt: '' }],
        incident_location: [],
        external_link: [{ value: null }],
        status_selection: [],
        related_people: [],
        video_of_event: [{ value: '' }],
      },
      user: '',
    };

    const checkProperties = () => {
      cy.contains('td', 'Oct 2, 2025');
      cy.contains('td', 'Oct 13, 2025');

      cy.contains('th', 'A basic simple text').should('not.exist');
      cy.contains('th', 'Single Date').should('not.exist');
      cy.contains('Markdown field using sanitized HTML tags').should('not.exist');
      cy.contains('Media with an image').should('not.exist');
      cy.contains('Grouped geolocation 1').should('not.exist');
      cy.contains('th', 'External link').should('not.exist');
      cy.contains('th', 'Single select').should('not.exist');
      cy.contains('Relationship with inheritance').should('not.exist');
    };

    it('hides empty metadata fields', () => {
      mount(<Basic showGeolocationProperties={false} locale="en" entity={emptyEntity} />);
      checkProperties();
    });

    it('hides missing metadata fields', () => {
      mount(<Basic showGeolocationProperties={false} entity={{ ...emptyEntity, metadata: {} }} />);
      checkProperties();
    });
  });
});
