import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import { composeStories } from '@storybook/react';
import * as stories from '#app/stories/Metadata.stories.jsx';

describe('Metadata Display', () => {
  const { Basic } = composeStories(stories);

  describe('General', () => {
    beforeEach(() => {
      Basic.args.showGeolocationProperties = false;
      mount(<Basic />);
    });

    it('renders the entity title with the icon', () => {
      cy.contains('dt', 'Title').find('.sr-only').should('exist');
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
      cy.contains('dt', 'Markdown field using standard markdown syntax').should('exist');
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
        .should('have.attr', 'href', '/entityv2/entity4')
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

      cy.get('img[alt="/short-video-thumbnail.jpg"]').should(
        'have.attr',
        'src',
        '/short-video-thumbnail.jpg'
      );

      cy.get('img[alt="/batman.jpg"]').should('have.attr', 'src', '/batman.jpg');
    });

    it('renders media timelinks as buttons', () => {
      cy.contains('dt', 'Media video with timelinks').should('exist');
      cy.contains('Timelink 1').should('exist');
      cy.contains('Timelink 2').should('exist');
    });
  });

  describe('accessibility', () => {
    it('should be accessible', () => {
      cy.injectAxe();
      mount(<Basic />);
      cy.checkA11y();
    });
  });

  describe('dates', () => {
    it('renders dates with correct locale and format', () => {
      Basic.args.locale = 'en';
      Basic.args.dateFormat = 'dd/MM/yyyy';

      mount(<Basic />);

      cy.contains('dd', '1 Jan, 2024').should('exist');
      cy.contains('dd', '2 Jan, 2024').should('exist');
      cy.contains('dd', '3 Jan, 2024').should('exist');
      cy.contains('dd', '2 Oct, 2025').should('exist');
      cy.contains('dd', '13 Oct, 2025').should('exist');
      cy.contains('dd', 'From 1 Jan, 2024 ~ To 2 Jan, 2024').should('exist');
    });

    it('renders dates with russian locale and yyyy-MM-dd format', () => {
      Basic.args.locale = 'ru';
      Basic.args.dateFormat = 'yyyy-MM-dd';

      mount(<Basic />);

      cy.contains('dd', '2024, янв. 1').should('exist');
      cy.contains('dd', '2024, янв. 2').should('exist');
      cy.contains('dd', '2024, янв. 3').should('exist');
      cy.contains('dd', '2025, окт. 2').should('exist');
      cy.contains('dd', '2025, окт. 13').should('exist');
      cy.contains('dd', 'From 2024, янв. 1 ~ To 2024, янв. 2').should('exist');
    });
  });

  describe('Empty metadata fields', () => {
    const checkProperties = () => {
      cy.contains('dd', 'Title of the displayed entity');
      cy.contains('dd', '2025, Oct 2');
      cy.contains('dd', '2025, Oct 13');

      cy.contains('dt', 'A basic simple text').should('not.exist');
      cy.contains('dt', 'Single Date').should('not.exist');
      cy.contains('dt', 'Markdown field using sanitized HTML tags').should('not.exist');
      cy.contains('dt', 'Media with an image').should('not.exist');
      cy.contains('dt', 'Grouped geolocation 1').should('not.exist');
      cy.contains('dt', 'External link').should('not.exist');
      cy.contains('dt', 'Single select').should('not.exist');
      cy.contains('dt', 'Relationship with inheritance').should('not.exist');
    };

    it('should not render empty metadata fields', () => {
      Basic.args.locale = 'en';
      Basic.args.entity = {
        _id: '1',
        language: 'en',
        mongoLanguage: 'en',
        sharedId: 'shared1',
        title: 'Title of the displayed entity',
        template: 'template1',
        creationDate: 1759374706197, // Oct 2, 2025
        editDate: 1760366924144, // Oct 13, 2025
        metadata: {
          simple_text: [
            {
              value: '',
            },
          ],
          markdown_html: [
            {
              value: '',
            },
          ],
          single_date: [],
          multiple_dates: [],
          date_range: [],
          multiple_date_ranges: [],
          selected_image: [
            {
              value: '',
              alt: '',
            },
          ],
          incident_location: [],
          external_link: [
            {
              value: null,
            },
          ],
          status_selection: [],
          related_people: [],
          video_of_event: [{ value: '' }],
        },
        user: '',
      };

      mount(<Basic />);

      checkProperties();
    });

    it('should not render missing metadata fields', () => {
      Basic.args.entity = {
        _id: '1',
        language: 'en',
        mongoLanguage: 'en',
        sharedId: 'shared1',
        title: 'Title of the displayed entity',
        template: 'template1',
        creationDate: 1759374706197, // Oct 2, 2025
        editDate: 1760366924144, // Oct 13, 2025
        metadata: {},
        user: '',
      };

      mount(<Basic />);

      checkProperties();
    });
  });
});
