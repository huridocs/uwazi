import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import { composeStories } from '@storybook/react';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import * as stories from '#app/stories/EntityViewer/EditEntity.stories.tsx';

describe('Entity edit', () => {
  const { Basic } = composeStories(stories);

  describe('Current metadata', () => {
    beforeEach(() => {
      mount(
        <ThemeProvider>
          <Basic />
        </ThemeProvider>
      );
    });

    it('should display current template and title', () => {
      cy.get('input[id="title"]').should('have.value', 'Title of the entity');
      cy.get('input[id="template1"]').should('be.checked');
    });

    [
      {
        field: 'Simple text',
        fieldId: 'metadata.simple_text.0.value',
        value: 'Emergency incident report from downtown area',
      },
      {
        field: 'Single Date',
        fieldId: 'metadata.single_date.0.value',
        value: '2024-01-01',
      },
      {
        field: 'Numeric property',
        fieldId: 'metadata.numeric_property.0.value',
        value: '',
      },
    ].forEach(({ field, fieldId, value }) => {
      it(`should check the field ${field}`, () => {
        cy.get(`input[id="${fieldId}"]`).should('have.value', value);
      });
    });

    it('should check the Markdown field value', () => {
      cy.get('textarea[id="metadata.rich_text_field.0.value"').should(
        'have.value',
        '**Bold text**, *italic text*, and a [link](https://example.com)'
      );
    });

    it('should check Multiple single dates field', () => {
      [
        { field: 'metadata.multiple_dates.0.value', value: '2024-01-01' },
        { field: 'metadata.multiple_dates.1.value', value: '2024-01-02' },
        { field: 'metadata.multiple_dates.2.value', value: '2024-01-03' },
      ].forEach(({ field, value }) => {
        cy.get(`input[id="${field}"]`).should('have.value', value);
      });
    });

    [
      {
        field: 'Single date range',
        values: [
          { id: 'metadata.date_range.0.value.from', value: '2024-01-01' },
          { id: 'metadata.date_range.0.value.to', value: '2024-01-02' },
        ],
      },
      {
        field: 'Multiple ranges of dates',
        values: [
          { id: 'metadata.multiple_date_ranges.0.value.from', value: '2024-01-01' },
          { id: 'metadata.multiple_date_ranges.0.value.to', value: '2024-01-02' },
          { id: 'metadata.multiple_date_ranges.1.value.from', value: '2024-01-02' },
          { id: 'metadata.multiple_date_ranges.1.value.to', value: '2024-01-03' },
        ],
      },
    ].forEach(({ field, values }) => {
      it(`should check the field ${field}`, () => {
        values.forEach(({ id, value }) => {
          cy.get(`input[id="${id}"]`).should('have.value', value);
        });
      });
    });

    [
      {
        field: 'Single select',
        values: [
          { id: 'thes2.2', checked: true },
          { id: 'thes2.3', checked: false },
        ],
      },
      {
        field: 'Multiple selector',
        values: [
          { id: 'thes1.1', checked: true },
          { id: 'thes1.2', checked: false },
          { id: 'thes.g.1', checked: true },
        ],
      },
      {
        field: 'Related people',
        values: [
          { id: 'entity2', checked: true },
          { id: 'entity3', checked: true },
        ],
      },
    ].forEach(({ field, values }) => {
      it(`should check the selected values in ${field} field`, () => {
        values.forEach(({ id, checked }) => {
          cy.get(`input[id="${id}"]`).should(checked ? 'be.checked' : 'not.be.checked');
        });
      });
    });

    it('should check the link field', () => {
      cy.get('input[id="metadata.external_link.0.value.label"]').should(
        'have.value',
        'Police Report'
      );
      cy.get('input[id="metadata.external_link.0.value.url"]').should(
        'have.value',
        'https://police.gov/reports/incident-2024-001'
      );
    });

    it('should check the geolocation field', () => {
      cy.get('input[name="metadata.location_on_map.0.value[lat]"]').should('have.value', '40.7128');
      cy.get('input[name="metadata.location_on_map.0.value[lon]"]').should('have.value', '-74.006');
    });
  });

  describe('Editing metadata', () => {
    describe('Title', () => {
      it('should validate that is not empty', () => {});
      it('should allow updating the title', () => {});
    });

    describe('Template', () => {
      it('should update the fields when selecting other template', () => {});
      it('should the existing values when swiching back to the original template', () => {});
      it('should switch the template', () => {});
    });
  });
});
