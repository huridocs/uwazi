import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import type { ClientUserSchema } from '#app/apiResponseTypes.js';
import type { Thesaurus, ThesaurusInput, ThesaurusValue } from '#shared/contracts/Thesaurus.js';
import type { EntitySaveInput } from '#V2/services/contracts/EntitiesService.js';
import type { ThesaurusService } from '#V2/services/contracts/ThesaurusService.js';
import { ServicesProvider } from '#V2/services/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import * as stories from '#app/stories/EntityViewer/EditEntity.stories.js';

const selectSearchSelectOption = (fieldId: string, optionLabel: string) => {
  cy.get(`[id="${fieldId}"]`).click();
  cy.contains('[role="option"]', optionLabel).click();
};

const adminUser: ClientUserSchema = {
  _id: 'admin1',
  role: 'admin',
  username: 'admin',
  email: 'admin@example.com',
};

const assignIds = (values: ThesaurusValue[]): ThesaurusValue[] =>
  values.map((value, index) => ({
    id: value.id ?? `generated-${index}`,
    label: value.label,
    ...(value.values
      ? {
          values: value.values.map((child, childIndex) => ({
            id: child.id ?? `generated-${index}-${childIndex}`,
            label: child.label,
          })),
        }
      : {}),
  }));

const savedThesaurus = (input: ThesaurusInput): Thesaurus => ({
  _id: input._id ?? 'saved',
  name: input.name,
  values: assignIds(input.values),
});

const addValueButton = (fieldLabel: string) =>
  cy.contains('label', fieldLabel).parent().contains('button', 'Add value');

const mountWithThesaurus = (
  upserts: ThesaurusInput[],
  onSave?: (savedEntity: EntitySaveInput) => void
) => {
  const upsert: ThesaurusService['upsert'] = async input => {
    upserts.push(input);
    return [savedThesaurus(input)];
  };
  mount(
    <ThemeProvider>
      <ServicesProvider value={createTestServices({ thesauri: { upsert } })}>
        <stories.Basic.Component user={adminUser} onSave={onSave} />
      </ServicesProvider>
    </ThemeProvider>
  );
};

const titleField = () => cy.get('textarea[id="title"]');

const openRelationshipSearch = (fieldTitle: string, fieldId: string) => {
  cy.contains(fieldTitle).closest('div.space-y-1\\.5').contains('button', 'Add entity').click();
  cy.get(`input[id="${fieldId}"]`).should('exist');
};

describe('Entity edit', () => {
  const { Basic, AllRequired, WithExternalErrors } = stories;

  describe('Current metadata', () => {
    beforeEach(() => {
      mount(
        <ThemeProvider>
          <Basic.Component />
        </ThemeProvider>
      );
    });

    it('should display current template and title', () => {
      titleField().should('have.value', 'Title of the entity');
      cy.get('[id="template"]').should('contain', 'Documents');
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

    it('should check the selected value in Single select field', () => {
      cy.get('[id="metadata.status_selection"]').should('contain', 'Second event');
    });

    [
      {
        field: 'Multiple selector',
        values: [
          { id: 'thes1.1', checked: true },
          { id: 'thes1.2', checked: false },
          { id: 'thes.g.1', checked: true },
        ],
      },
    ].forEach(({ field, values }) => {
      it(`should check the selected values in ${field} field`, () => {
        values.forEach(({ id, checked }) => {
          cy.get(`input[id="${id}"]`).should(checked ? 'be.checked' : 'not.be.checked');
        });
      });
    });

    it('should check the selected values in Related people field', () => {
      cy.contains('Owner')
        .closest('div.space-y-1\\.5')
        .within(() => {
          cy.contains('Maria Rodriguez - Witness').should('exist');
          cy.contains('John Smith - Reporter').should('exist');
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
      cy.get('input[name="metadata.location_on_map.lat"]').should('have.value', '40.7128');
      cy.get('input[name="metadata.location_on_map.lon"]').should('have.value', '-74.006');
    });

    it('should render the image field preview', () => {
      cy.contains('Media with an image').should('exist');
      cy.get('img[alt="Media with an image"]').should(
        'have.attr',
        'src',
        '/short-video-thumbnail.jpg'
      );
    });

    it('should render the media field with timelinks', () => {
      cy.contains('Media video with timelinks').should('exist');
      cy.contains('Timelink 1').should('exist');
      cy.contains('Timelink 2').should('exist');
    });

    it('should render the preview field as read-only', () => {
      cy.contains('Document preview').should('exist');
      cy.contains('This content is automatically generated').should('exist');
    });

    it('should select media from URL in the picker modal', () => {
      cy.get('[data-testid="metadata.selected_image.0.value"]')
        .contains('button', 'Change')
        .click();
      cy.get('[data-testid="modal"]').should('exist');
      cy.get('[data-testid="modal"] input[aria-label="Image URL"]').type(
        'https://example.com/image.jpg'
      );
      cy.get('[data-testid="modal"]').contains('button', 'Use URL').click();
      cy.get('img[alt="Media with an image"]').should(
        'have.attr',
        'src',
        'https://example.com/image.jpg'
      );
    });
  });

  describe('Editing metadata', () => {
    describe('Template', () => {
      beforeEach(() => {
        mount(
          <ThemeProvider>
            <Basic.Component />
          </ThemeProvider>
        );
      });
      it('should update the fields when selecting other template', () => {
        selectSearchSelectOption('template', 'Event Report');
        cy.get('textarea[id="metadata.report.0.value"]').should('exist');
      });

      it('should select the original template when deselecting selected template', () => {
        cy.get('[id="template"]').should('contain', 'Documents');
        selectSearchSelectOption('template', 'Event Report');
        cy.get('textarea[id="metadata.report.0.value"]').should('exist');
        selectSearchSelectOption('template', 'Documents');
        cy.get('textarea[id="metadata.report.0.value"]').should('not.exist');
        cy.contains('label', 'A basic simple text');
      });

      it('should restore original metadata when switching back to original template', () => {
        selectSearchSelectOption('template', 'Event Report');
        cy.get('textarea[id="metadata.report.0.value"]').should('exist');
        selectSearchSelectOption('template', 'Documents');
        cy.get('input[name="metadata.location_on_map.lat"]').should('have.value', '40.7128');
        cy.get('input[name="metadata.location_on_map.lon"]').should('have.value', '-74.006');
        [
          { id: 'metadata.date_range.0.value.from', value: '2024-01-01' },
          { id: 'metadata.date_range.0.value.to', value: '2024-01-02' },
        ].forEach(({ id, value }) => {
          cy.get(`input[id="${id}"]`).should('have.value', value);
        });
      });

      it('should show fields after repeated A→B→A→B switches and keep dirty title', () => {
        titleField().clear();
        titleField().type('Kept dirty title');

        selectSearchSelectOption('template', 'Event Report');
        cy.get('textarea[id="metadata.report.0.value"]').should('exist');
        selectSearchSelectOption('template', 'Documents');
        cy.contains('label', 'A basic simple text');
        selectSearchSelectOption('template', 'Event Report');
        cy.get('textarea[id="metadata.report.0.value"]').should('exist');
        selectSearchSelectOption('template', 'Documents');
        cy.contains('label', 'A basic simple text');
        cy.get('input[id="metadata.simple_text.0.value"]').should('exist');

        cy.get('input[name="metadata.location_on_map.lat"]').should('have.value', '40.7128');
        cy.get('input[name="metadata.location_on_map.lon"]').should('have.value', '-74.006');
        [
          { id: 'metadata.date_range.0.value.from', value: '2024-01-01' },
          { id: 'metadata.date_range.0.value.to', value: '2024-01-02' },
        ].forEach(({ id, value }) => {
          cy.get(`input[id="${id}"]`).should('have.value', value);
        });

        titleField().should('have.value', 'Kept dirty title');
      });
    });

    describe('Metadata', () => {
      it('should edit a few items and save', () => {
        const saveSpy = cy.stub().as('saveSpy');
        mount(
          <ThemeProvider>
            <Basic.Component onSave={saveSpy} />
          </ThemeProvider>
        );

        titleField().clear();
        titleField().type('A new title');
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

      it('should unlink image and media fields on save', () => {
        const saveSpy = cy.stub().as('saveSpy');
        mount(
          <ThemeProvider>
            <Basic.Component onSave={saveSpy} />
          </ThemeProvider>
        );

        cy.get('[data-testid="metadata.selected_image.0.value"]')
          .contains('button', 'Unlink')
          .click();
        cy.get('[data-testid="metadata.video_of_event.0.value"]')
          .contains('button', 'Unlink')
          .click();
        cy.contains('button', 'Save').click();

        cy.get('@saveSpy').should('have.been.calledOnce');
        cy.get('@saveSpy').then(spy => {
          const saved = (spy as unknown as Cypress.Agent<sinon.SinonSpy>).getCall(0).args[0];
          expect(saved.metadata.selected_image).to.deep.equal([{ value: '' }]);
          expect(saved.metadata.video_of_event).to.deep.equal([{ value: '' }]);
        });
      });
    });
  });

  describe('Relationship fields', () => {
    beforeEach(() => {
      mount(
        <ThemeProvider>
          <Basic.Component />
        </ThemeProvider>
      );
      cy.contains('Owner').should('exist');
    });

    it('should render grouped Owner as a single relationship field', () => {
      cy.contains('Owner').should('exist');
      cy.contains('Maria Rodriguez - Witness').should('exist');
      cy.contains('button', 'Add entity').should('exist');
      cy.contains('label', 'Related residents').should('not.exist');
      cy.contains('Owner')
        .closest('div.space-y-1\\.5')
        .find('[data-testid="relationship-connections"]')
        .should('exist');
      cy.contains('Owner').closest('div.space-y-1\\.5').find('table').should('have.class', 'w-max');
    });

    it('should render Witnesses as a separate relationship field', () => {
      cy.contains('Witnesses').should('exist');
      cy.contains('Ana Diaz - Observer').should('exist');
    });

    it('should filter relationship options when searching the lookup', () => {
      openRelationshipSearch('Owner', 'metadata.related_people');
      cy.get('input[id="metadata.related_people"]').type('Lucia Torres');
      cy.contains('button', 'Lucia Torres - Resident').should('exist');
      cy.contains('button', 'Diego Morales - Resident').should('not.exist');
    });

    it('should select and deselect relationship entities', () => {
      openRelationshipSearch('Owner', 'metadata.related_people');
      cy.contains('button', 'Lucia Torres - Resident').click();
      cy.contains('Owner')
        .closest('div.space-y-1\\.5')
        .within(() => {
          cy.contains('Lucia Torres - Resident').should('exist');
          cy.contains('Maria Rodriguez - Witness')
            .closest('tr')
            .find('button[title="Remove from connection"]')
            .click();
          cy.contains('Maria Rodriguez - Witness').should('not.exist');
          cy.contains('Lucia Torres - Resident').should('exist');
        });
    });

    it('should sync grouped relationship fields on save', () => {
      const saveSpy = cy.stub().as('saveSpy');
      mount(
        <ThemeProvider>
          <Basic.Component onSave={saveSpy} />
        </ThemeProvider>
      );
      cy.contains('Owner').should('exist');

      openRelationshipSearch('Owner', 'metadata.related_people');
      cy.contains('button', 'Lucia Torres - Resident').click();
      cy.contains('button', 'Save').click();

      cy.get('@saveSpy').should('have.been.calledOnce');
      cy.get('@saveSpy').then(spy => {
        const saved = (spy as unknown as Cypress.Agent<sinon.SinonSpy>).getCall(0).args[0];
        const peopleValues = saved.metadata.related_people.map((p: { value: string }) => p.value);
        const residentValues = saved.metadata.related_residents.map(
          (p: { value: string }) => p.value
        );

        expect(peopleValues).to.include('entity6');
        expect(residentValues).to.deep.equal(peopleValues);
      });
    });
  });

  describe('Required fields', () => {
    it('should mark required fields with an asterisk', () => {
      mount(
        <ThemeProvider>
          <AllRequired.Component />
        </ThemeProvider>
      );

      titleField().parent().parent().contains('*');
    });

    it('should block save and show validation errors when required fields are empty', () => {
      const saveSpy = cy.stub().as('saveSpy');
      mount(
        <ThemeProvider>
          <AllRequired.Component onSave={saveSpy} />
        </ThemeProvider>
      );

      cy.contains('button', 'Save').click();

      cy.get('@saveSpy').should('not.have.been.called');
      cy.contains('This field is required').should('be.visible');
    });

    it('should focus the first invalid field on failed save', () => {
      mount(
        <ThemeProvider>
          <AllRequired.Component />
        </ThemeProvider>
      );

      cy.contains('button', 'Save').click();
      titleField().should('have.focus');
    });
  });

  describe('External errors', () => {
    beforeEach(() => {
      mount(
        <ThemeProvider>
          <WithExternalErrors.Component />
        </ThemeProvider>
      );
    });

    it('should display external validation errors on affected fields', () => {
      cy.contains('The title already exists').should('be.visible');
      cy.contains('This value is invalid').should('be.visible');
      cy.contains('This relationship is not allowed').should('be.visible');
      cy.contains('Please provide a valid source URL').should('be.visible');
    });
  });

  describe('Add value', () => {
    it('should hide Add value when no admin is signed in', () => {
      mount(
        <ThemeProvider>
          <Basic.Component />
        </ThemeProvider>
      );
      cy.contains('label', 'Single select').should('exist');
      addValueButton('Single select').should('not.exist');
      addValueButton('Multiple selector').should('not.exist');
    });

    it('should append a single-select value and select it', () => {
      const upserts: ThesaurusInput[] = [];
      const saveSpy = cy.stub().as('saveSpy');
      mountWithThesaurus(upserts, saveSpy);

      cy.contains('label', 'Single select').parent().contains('button', 'Clear').should('exist');
      addValueButton('Single select').click();
      cy.get('[role="dialog"][aria-label="Add thesaurus value"]').within(() => {
        cy.get('select').should('not.exist');
        cy.get('#add-thesaurus-value-note').should('contain', 'Added at the end of the thesaurus.');
        cy.get('#add-thesaurus-value').type('Fresh event');
      });
      cy.get('[role="dialog"][aria-label="Add thesaurus value"]')
        .contains('button', 'Save')
        .click();

      cy.get('[id="metadata.status_selection"]')
        .should('contain', 'Fresh event')
        .and('contain', 'New');
      cy.contains('button', 'Save').click();

      cy.should(() => {
        expect(upserts).to.have.length(1);
        expect(upserts[0]?.values.at(-1)).to.deep.equal({ label: 'Fresh event' });
      });
      cy.get('@saveSpy').should('have.been.calledOnce');
      cy.get('@saveSpy').then(spy => {
        const saved = (spy as unknown as Cypress.Agent<sinon.SinonSpy>).getCall(0).args[0];
        expect(saved.metadata.status_selection).to.deep.equal([
          { value: 'generated-3', label: 'Fresh event' },
        ]);
      });
    });

    it('should append a nested multiselect value inside the chosen group', () => {
      const upserts: ThesaurusInput[] = [];
      mountWithThesaurus(upserts);

      cy.contains('label', 'Multiple selector')
        .parent()
        .contains('button', 'Clear')
        .should('not.exist');
      addValueButton('Multiple selector').click();
      cy.get('[role="dialog"][aria-label="Add thesaurus value"]').within(() => {
        cy.get('#add-thesaurus-value-group').select('Grouped verbs');
        cy.get('#add-thesaurus-value').type('verb3');
        cy.get('#add-thesaurus-value-note').should('contain', 'Added in Grouped verbs.');
      });
      cy.get('[role="dialog"][aria-label="Add thesaurus value"]')
        .contains('button', 'Save')
        .click();

      cy.get('input#generated-4-2').should('be.checked');
      cy.contains('verb3').should('exist');
      cy.contains('New').should('exist');
      cy.contains('label', 'Multiple selector')
        .parent()
        .contains('button', 'Clear')
        .should('not.exist');
      cy.should(() => {
        const group = upserts[0]?.values.find(value => value.id === 'thes.g');
        expect(group?.values?.at(-1)).to.deep.equal({ label: 'verb3' });
      });
    });
  });
});
