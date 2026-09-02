import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import * as stories from '#app/stories/EntityViewer/Metadata.stories.js';

const inheritingRelationshipCard = (label: string) =>
  cy.contains(label).parents('.rounded-lg.border-border-40').first();

const assertInheritedTableScroll = (card: Cypress.Chainable<JQuery<HTMLElement>>) => {
  card.within(() => {
    cy.get('.overflow-x-auto').should('exist').and('not.have.class', 'max-h-60');
    cy.get('table').should('have.class', 'w-max').and('have.class', 'min-w-full');
  });
};

const compactField = (name: string) =>
  cy.get(`[data-field-key="${name}"]`).should('have.class', 'flex-1');

const fullRowField = (name: string) =>
  cy.get(`[data-field-key="${name}"]`).should('have.class', 'basis-full');

// eslint-disable-next-line max-statements
describe('MetadataDisplay', () => {
  const { Basic } = stories;

  describe('General', () => {
    beforeEach(() => {
      mount(<Basic.Component showGeolocationProperties={false} />);
    });

    it('shows created and edited dates as a footer line', () => {
      cy.get('[data-testid="metadata-record"]').should('exist');
      cy.get('[data-testid="entity-system-dates"]').should(
        'contain',
        'Created Oct 2, 2025 · Edited Oct 13, 2025'
      );
    });

    it('shows simple text as a compact card', () => {
      cy.contains('h2', 'A basic simple text').should('exist');
      cy.contains('Emergency incident report from downtown area').should('exist');
      compactField('simple_text');
    });

    it('shows markdown field with link', () => {
      cy.contains('Markdown field using sanitized HTML tags').should('exist');
      cy.contains('This Markdown field includes').should('exist');
      cy.get('a[href="https://example.com"]').should('have.attr', 'target', '_blank');
      fullRowField('markdown_html');
    });

    it('shows markdown bold and italic', () => {
      cy.contains('Markdown field using standard markdown syntax').should('exist');
      cy.contains('strong', 'Bold text').should('exist');
      cy.contains('em', 'italic text').should('exist');
    });

    it('shows select and multiselect labels', () => {
      cy.contains('h2', 'Single select').should('exist');
      cy.contains('h2', 'Multiple selector').should('exist');
      cy.contains('span', 'Again').should('exist');
      cy.contains('span', 'Acknowledging').should('exist');
      cy.contains('span', 'Grouped verbs › verb1').should('exist');
      compactField('status_selection');
    });

    it('shows link-only connections as masonry cards', () => {
      cy.contains('h2', 'Regular relationship with no inheritance').should('exist');
      cy.contains('a', 'Traffic Accident - Main Street')
        .should('have.attr', 'href', '/entityv2/entity4')
        .should('have.attr', 'target', '_blank');
      cy.contains('This value should not display').should('not.have.attr', 'href');
    });

    it('shows inheriting connections as scrollable tables in property order', () => {
      cy.contains('p', 'Relationships').should('not.exist');

      const multiselectInherit = inheritingRelationshipCard('Relationship with inheritance');
      multiselectInherit.within(() => {
        cy.contains('via').should('exist');
        cy.contains('inherits Multiselect from events').should('exist');
        cy.contains('th', 'Entity').should('exist');
        cy.contains('th', 'Multiselect from events').should('exist');
        cy.contains('Maria Rodriguez - Witness').should('exist');
        cy.contains('Again').should('exist');
        cy.contains('Acknowledging').should('exist');
      });
      assertInheritedTableScroll(multiselectInherit);

      cy.contains('Grouped geolocation 3 (inherited)').should('not.exist');
    });

    it('shows external link as a masonry card', () => {
      cy.contains('h2', 'External link').should('exist');
      cy.contains('Police Report')
        .closest('a')
        .should('have.attr', 'href', 'https://police.gov/reports/incident-2024-001')
        .should('have.attr', 'target', '_blank');
      compactField('external_link');
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
      compactField('selected_image');
      compactField('video_of_event');
      cy.get('[data-field-key="selected_image"] .aspect-video').should('exist');
      cy.get('[data-field-key="video_of_event"] .aspect-video').should('exist');
      cy.get('[data-field-key="selected_image"]')
        .closest('[data-property-row]')
        .invoke('attr', 'data-property-row')
        .should('include', 'selected_image')
        .and('include', 'video_of_event');
    });

    it('shows media timelinks', () => {
      cy.contains('Media video with timelinks').should('exist');
      cy.contains('Timelink 1').should('exist');
      cy.contains('Timelink 2').should('exist');
    });
  });

  describe('Grouped geolocation', () => {
    it('shows adjacent inherited geolocation on the grouped map', () => {
      mount(<Basic.Component showGeolocationProperties />);

      cy.contains('Grouped geolocation properties').should('exist');
      cy.contains('Grouped geolocation 3 (inherited)').should('not.exist');
      cy.get('[data-testid="map-container"]').should('exist');
    });
  });

  describe('accessibility', () => {
    it('should be accessible', () => {
      cy.on('uncaught:exception', err => {
        if (err.message.includes('_leaflet_pos')) {
          return false;
        }
        return true;
      });
      mount(<Basic.Component showGeolocationProperties={false} />);
      cy.injectAxe();
      cy.checkA11y(
        { exclude: ['.leaflet-container'] },
        {
          rules: {
            'color-contrast': { enabled: false },
            'heading-order': { enabled: false },
            dlitem: { enabled: false },
            'definition-list': { enabled: false },
          },
        }
      );
    });
  });

  describe('dates', () => {
    it('shows dates in English locale', () => {
      mount(<Basic.Component showGeolocationProperties={false} locale="en" />);

      cy.contains('Jan 1, 2024').should('exist');
      cy.contains('From Jan 1, 2024 ~ To Jan 2, 2024').should('exist');
    });

    it('shows dates in Russian locale', () => {
      mount(<Basic.Component showGeolocationProperties={false} locale="ru" />);

      cy.contains('1 янв. 2024').should('exist');
      cy.contains('From 1 янв. 2024 г. ~ To 2 янв. 2024 г.').should('exist');
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
      cy.get('[data-testid="entity-system-dates"]').should(
        'contain',
        'Created Oct 2, 2025 · Edited Oct 13, 2025'
      );

      cy.contains('h2', 'A basic simple text').should('not.exist');
      cy.contains('h2', 'Single Date').should('not.exist');
      cy.contains('Markdown field using sanitized HTML tags').should('not.exist');
      cy.contains('Media with an image').should('not.exist');
      cy.contains('Grouped geolocation 1').should('not.exist');
      cy.contains('h2', 'External link').should('not.exist');
      cy.contains('h2', 'Single select').should('not.exist');
      cy.contains('Relationship with inheritance').should('not.exist');
    };

    it('hides empty metadata fields', () => {
      mount(<Basic.Component showGeolocationProperties={false} locale="en" entity={emptyEntity} />);
      checkProperties();
    });

    it('hides missing metadata fields', () => {
      mount(
        <Basic.Component
          showGeolocationProperties={false}
          entity={{ ...emptyEntity, metadata: {} }}
        />
      );
      checkProperties();
    });
  });
});
