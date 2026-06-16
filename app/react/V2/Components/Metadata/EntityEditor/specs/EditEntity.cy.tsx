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
      cy.get('textarea[id="metadata.rich_text_field.0.value"]').should(
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
    describe('Template', () => {
      beforeEach(() => {
        mount(
          <ThemeProvider>
            <Basic />
          </ThemeProvider>
        );
      });
      it('should update the fields when selecting other template', () => {
        cy.get('input[id="template2"]').click();
        cy.get('textarea[id="metadata.report.0.value"]').should('exist');
      });

      it('should select the original template when deselecting selected template', () => {
        cy.get('input[id="template1"]').should('be.checked');
        cy.get('input[id="template2"]').click();
        cy.get('textarea[id="metadata.report.0.value"]').should('exist');
        cy.get('input[id="template2"]').click();
        cy.get('input[id="template1"]').should('be.checked');
        cy.get('textarea[id="metadata.report.0.value"]').should('not.exist');
        cy.contains('label', 'A basic simple text');
      });

      it('should restore original metadata when switching back to original template', () => {
        cy.get('input[id="template2"]').click();
        cy.get('textarea[id="metadata.report.0.value"]').should('exist');
        cy.get('input[id="template1"]').click();
        cy.get('input[name="metadata.location_on_map.0.value[lat]"]').should(
          'have.value',
          '40.7128'
        );
        cy.get('input[name="metadata.location_on_map.0.value[lon]"]').should(
          'have.value',
          '-74.006'
        );
        [
          { id: 'metadata.date_range.0.value.from', value: '2024-01-01' },
          { id: 'metadata.date_range.0.value.to', value: '2024-01-02' },
        ].forEach(({ id, value }) => {
          cy.get(`input[id="${id}"]`).should('have.value', value);
        });
      });
    });

    describe('Metadata', () => {
      it('should edit a few items and save', () => {
        const saveSpy = cy.stub().as('saveSpy');
        mount(
          <ThemeProvider>
            <Basic onSave={saveSpy} />
          </ThemeProvider>
        );

        cy.get('input[id="title"]').clear();
        cy.get('input[id="title"]').type('A new title');
        cy.get('input[id="metadata.single_date.0.value"]').type('1999-11-30');
        cy.get('input[id="metadata.multiple_date_ranges.0.value.from"]').type('1950-03-01');
        cy.get('input[id="metadata.multiple_date_ranges.0.value.to"]').type('1950-03-30');
        cy.get('input[id="thes1.2"]').click();
        cy.contains('button', 'Save').click();

        cy.get('@saveSpy').should('have.been.calledOnce');
        cy.get('@saveSpy').then(spy => {
          const saved = (spy as unknown as Cypress.Agent<sinon.SinonSpy>).getCall(0).args[0];
          expect(saved.title).to.equal('A new title');

          expect(saved.metadata.single_date).to.deep.equal([{ value: 943920000 }]);

          expect(saved.metadata.multiple_date_ranges).to.have.deep.members([
            { value: { from: -626054400, to: -623548800 } },
            { value: { from: 1704153600, to: 1704240000 } },
          ]);

          expect(saved.metadata.category_tags).to.have.deep.members([
            { value: 'thes1.1', label: 'Acknowledging' },
            {
              value: 'thes.g.1',
              label: 'verb1',
              parent: { label: 'Grouped verbs', value: 'thes.g' },
            },
            { value: 'thes1.2', label: 'Again' },
          ]);

          expect(
            saved.metadata.related_people.map((p: { value: string }) => p.value)
          ).to.have.members(['entity2', 'entity3']);
        });
      });
    });
  });
});
