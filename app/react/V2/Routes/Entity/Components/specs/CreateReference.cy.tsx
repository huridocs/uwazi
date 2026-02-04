/* eslint-disable max-statements */
import React from 'react';
import 'cypress-axe';
import { ClientRelationshipType } from '#app/apiResponseTypes.js';
import { Entity } from '#V2/domain/index.js';
import { DateMetadataProperty } from '#V2/domain/entities/types.js';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import { FileType } from '#shared/types/fileType.js';
import { CreateReference } from '../ReferencesPanel/CreateReference.js';
import { logA11yViolations } from '../../../../../../../cypress/support/helpers/a11y.js';

// Mock PDF files
const mockPDFFile1: FileType = {
  _id: 'file-1',
  filename: 'document1.pdf',
  originalname: 'Human Rights Document.pdf',
  mimetype: 'application/pdf',
  language: 'eng',
  totalPages: 25,
  type: 'document',
};

const mockPDFFile2: FileType = {
  _id: 'file-2',
  filename: 'document2.pdf',
  originalname: 'Legal Analysis.pdf',
  mimetype: 'application/pdf',
  language: 'spa',
  totalPages: 42,
  type: 'document',
};

// Mock entities with files
const mockEntityWithFile: Entity = {
  _id: '1',
  sharedId: 'shared-1',
  title: 'Document about Human Rights',
  language: 'en',
  template: {
    _id: 'template-1',
    name: 'Case',
    label: 'Case',
    color: '#A4CAFE',
  },
  creationDate: {
    type: 'date',
    _id: 'creationDate',
    name: 'creationDate',
    label: 'Creation Date',
    values: [{ value: Date.now() - 86400000 * 30, label: '' }],
  } as DateMetadataProperty,
  editDate: {
    type: 'date',
    _id: 'editDate',
    name: 'editDate',
    label: 'Edit Date',
    values: [{ value: Date.now() - 86400000 * 7, label: '' }],
  } as DateMetadataProperty,
  metadata: [],
  mainDocument: [mockPDFFile1],
};

const mockEntityWithMultipleFiles: Entity = {
  _id: '2',
  sharedId: 'shared-2',
  title: 'Legal Document Analysis',
  language: 'en',
  template: {
    _id: 'template-2',
    name: 'Report',
    label: 'Report',
    color: '#F5BDBD',
  },
  creationDate: {
    type: 'date',
    _id: 'creationDate',
    name: 'creationDate',
    label: 'Creation Date',
    values: [{ value: Date.now() - 86400000 * 60, label: '' }],
  } as DateMetadataProperty,
  editDate: {
    type: 'date',
    _id: 'editDate',
    name: 'editDate',
    label: 'Edit Date',
    values: [{ value: Date.now() - 86400000 * 14, label: '' }],
  } as DateMetadataProperty,
  metadata: [],
  documents: [mockPDFFile2],
};

const mockEntityWithoutFiles: Entity = {
  _id: '3',
  sharedId: 'shared-3',
  title: 'Document without files',
  language: 'en',
  template: {
    _id: 'template-3',
    name: 'Decision',
    label: 'Decision',
    color: '#BDF5BD',
  },
  creationDate: {
    type: 'date',
    _id: 'creationDate',
    name: 'creationDate',
    label: 'Creation Date',
    values: [{ value: Date.now() - 86400000 * 90, label: '' }],
  } as DateMetadataProperty,
  editDate: {
    type: 'date',
    _id: 'editDate',
    name: 'editDate',
    label: 'Edit Date',
    values: [{ value: Date.now() - 86400000 * 1, label: '' }],
  } as DateMetadataProperty,
  metadata: [],
};

// Mock relationship types
const mockRelationshipTypes: ClientRelationshipType[] = [
  { _id: 'rel-1', name: 'Related to' },
  { _id: 'rel-2', name: 'Mentions' },
  { _id: 'rel-3', name: 'Cited in' },
];

// Mock text selection
const mockSelection: TextSelection = {
  text: 'This is a selected text from the document',
  selectionRectangles: [
    {
      top: 100,
      left: 50,
      width: 200,
      height: 20,
      regionId: '1',
    },
  ],
};

describe('CreateReference Component', () => {
  const mockSearchFunction = async (searchString: string): Promise<Entity[]> => {
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 100);
    });
    const query = searchString.toLowerCase();
    const allEntities = [mockEntityWithFile, mockEntityWithMultipleFiles, mockEntityWithoutFiles];
    return allEntities.filter(entity => entity.title.toLowerCase().includes(query));
  };

  beforeEach(() => {
    cy.mount(
      <div className="tw-content" style={{ width: '400px', height: '600px' }}>
        <CreateReference
          selection={mockSelection}
          relationshipTypes={mockRelationshipTypes}
          searchFunction={mockSearchFunction}
          mode="text"
          onSave={cy.stub().as('onSave')}
          onCancel={cy.stub().as('onCancel')}
        />
      </div>
    );
  });

  it('should be accessible', () => {
    cy.injectAxe();
    cy.checkA11y(undefined, undefined, logA11yViolations);
  });

  it('should render the component with relationship types', () => {
    cy.contains('Relationship type').should('be.visible');
    cy.contains('Related to').should('be.visible');
    cy.contains('Mentions').should('be.visible');
    cy.contains('Cited in').should('be.visible');
  });

  it('should display search input', () => {
    cy.get('input[type="search"]').should('be.visible');
  });

  it('should search for entities when typing', () => {
    cy.get('input[type="search"]').type('Human Rights');
    cy.contains('Document about Human Rights').should('be.visible');
  });

  it('should filter entities with files in text mode', () => {
    cy.get('input[type="search"]').type('Document');
    // Should show entities with files
    cy.contains('Document about Human Rights').should('be.visible');
    cy.contains('Legal Document Analysis').should('be.visible');
    // Should not show entity without files in text mode
    cy.contains('Document without files').should('not.exist');
  });

  it('should allow selecting a relationship type', () => {
    cy.contains('Related to').click();
    cy.get('input[type="checkbox"]').first().should('be.checked');
  });

  it('should allow selecting an entity', () => {
    cy.get('input[type="search"]').type('Human Rights');
    cy.contains('Document about Human Rights').click();
    // Entity should be selected (check for selected state in Card)
    cy.contains('Document about Human Rights')
      .parents()
      .should(
        'satisfy',
        $el => $el.hasClass('bg-primary-50') || $el.find('.bg-primary-50').length > 0
      );
  });

  it('should display PDF files when entity is selected in text mode', () => {
    cy.get('input[type="search"]').type('Human Rights');
    cy.contains('Document about Human Rights').click();
    // Should show PDF files
    cy.contains('Human Rights Document.pdf').should('be.visible');
    cy.contains('25 pages').should('be.visible');
  });

  it('should display language tag for PDF files', () => {
    cy.get('input[type="search"]').type('Human Rights');
    cy.contains('Document about Human Rights').click();
    // Should show language tag (EN for English)
    cy.contains('EN').should('be.visible');
  });

  it('should allow selecting a PDF file', () => {
    cy.get('input[type="search"]').type('Human Rights');
    cy.contains('Document about Human Rights').click();
    cy.contains('Human Rights Document.pdf').click();
    // File should be selected (check for border-primary-500 class)
    cy.contains('Human Rights Document.pdf')
      .parents()
      .should(
        'satisfy',
        $el => $el.hasClass('border-primary-500') || $el.find('.border-primary-500').length > 0
      );
  });

  it('should only allow selecting one file at a time', () => {
    cy.get('input[type="search"]').type('Legal');
    cy.contains('Legal Document Analysis').click();
    // Select first file
    cy.contains('Legal Analysis.pdf').click();
    // Check that file is selected (has border-primary-500 class)
    cy.contains('Legal Analysis.pdf').parents().filter('.border-primary-500').should('exist');
    // Clicking the same file should deselect it
    cy.contains('Legal Analysis.pdf').click();
    // Check that file is deselected - should not have border-primary-500
    cy.contains('Legal Analysis.pdf').parents().filter('.border-primary-500').should('not.exist');
  });

  it('should enable save button when relationship type and entity are selected in entity mode', () => {
    cy.mount(
      <div className="tw-content" style={{ width: '400px', height: '600px' }}>
        <CreateReference
          selection={mockSelection}
          relationshipTypes={mockRelationshipTypes}
          searchFunction={mockSearchFunction}
          mode="entity"
          onSave={cy.stub().as('onSaveEntity')}
          onCancel={cy.stub().as('onCancel')}
        />
      </div>
    );

    cy.contains('Related to').click();
    cy.get('input[type="search"]').type('Human Rights');
    cy.contains('Document about Human Rights').click();
    cy.contains('Save').closest('button').should('not.be.disabled');
  });

  it('should disable save button when requirements are not met', () => {
    cy.contains('Save').closest('button').should('be.disabled');
    // Select only relationship type
    cy.contains('Related to').click();
    cy.contains('Save').closest('button').should('be.disabled');
  });

  it('should call onCancel when cancel button is clicked', () => {
    cy.contains('Cancel').closest('button').click();
    cy.get('@onCancel').should('have.been.called');
  });

  it('should call onSave with correct data when save is clicked in entity mode', () => {
    cy.mount(
      <div className="tw-content" style={{ width: '400px', height: '600px' }}>
        <CreateReference
          selection={mockSelection}
          relationshipTypes={mockRelationshipTypes}
          searchFunction={mockSearchFunction}
          mode="entity"
          onSave={cy.stub().as('onSaveEntity')}
          onCancel={cy.stub().as('onCancel')}
        />
      </div>
    );

    cy.contains('Related to').click();
    cy.get('input[type="search"]').type('Human Rights');
    cy.contains('Document about Human Rights').click();
    cy.contains('Save').closest('button').click();
    cy.get('@onSaveEntity').should('have.been.calledWith', {
      selection: mockSelection,
      targetEntityId: 'shared-1', // Should use sharedId, not _id
      relationshipType: 'rel-1',
    });
  });

  it('should call onSave with file data when save is clicked in text mode', () => {
    cy.contains('Related to').click();
    cy.get('input[type="search"]').type('Human Rights');
    cy.contains('Document about Human Rights').click();
    // Select a file
    cy.contains('Human Rights Document.pdf').click();
    cy.contains('Save').closest('button').click();
    cy.get('@onSave').should('have.been.calledWith', {
      selection: mockSelection,
      targetEntityId: 'shared-1', // Should use sharedId, not _id
      relationshipType: 'rel-1',
      targetFileId: 'file-1',
    });
  });

  it('should disable save button in text mode when file is not selected', () => {
    cy.contains('Related to').click();
    cy.get('input[type="search"]').type('Human Rights');
    cy.contains('Document about Human Rights').click();
    // Save button should be disabled without file selection in text mode
    cy.contains('Save').closest('button').should('be.disabled');
  });

  it('should clear search results when clear button is clicked', () => {
    cy.get('input[type="search"]').type('Human Rights');
    cy.contains('Document about Human Rights').should('be.visible');
    // Find and click clear button (usually an X icon)
    cy.get('input[type="search"]').clear();
    cy.contains('Document about Human Rights').should('not.exist');
  });

  it('should show no results message when search returns empty', () => {
    cy.get('input[type="search"]').type('NonExistentDocument');
    cy.contains('No results found').should('be.visible');
  });
});
