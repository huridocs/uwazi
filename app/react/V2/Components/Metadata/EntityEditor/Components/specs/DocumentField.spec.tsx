/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Entity } from '#V2/api/entities/types.js';
import type { DocumentFieldMutations } from '../../editEntityTypes.js';
import { DocumentField } from '../DocumentField.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
}));

const baseEntity: Entity = {
  _id: '1',
  sharedId: 'shared1',
  language: 'en',
  title: 'Entity title',
  template: 'template1',
  creationDate: 0,
  user: 'user',
};

const buildMutations = (): DocumentFieldMutations => ({
  chooseDocument: jest.fn(),
  renameDocument: jest.fn().mockResolvedValue(undefined),
  removeDocument: jest.fn().mockResolvedValue(undefined),
  fileInputRef: { current: null },
  handleFileInputChange: jest.fn(),
});

describe('DocumentField', () => {
  it('should render nothing when the entity has no main document', () => {
    const { container } = render(
      <DocumentField entity={baseEntity} mutations={buildMutations()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should render the document name, type, choose and remove actions', () => {
    const entity: Entity = {
      ...baseEntity,
      documents: [{ _id: 'doc1', originalname: 'report.pdf', mimetype: 'application/pdf' }],
    };

    render(<DocumentField entity={entity} mutations={buildMutations()} />);

    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PDF')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('report.pdf');
  });

  it('should choose a replacement file and remove the document', () => {
    const entity: Entity = {
      ...baseEntity,
      documents: [{ _id: 'doc1', originalname: 'report.pdf', mimetype: 'application/pdf' }],
    };
    const mutations = buildMutations();

    render(<DocumentField entity={entity} mutations={mutations} />);

    fireEvent.click(screen.getByText('Choose file'));
    expect(mutations.chooseDocument).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Remove file'));
    expect(mutations.removeDocument).toHaveBeenCalledWith('doc1');
  });

  it('should rename the document when the name field is blurred with a new value', () => {
    const document = { _id: 'doc1', originalname: 'report.pdf', mimetype: 'application/pdf' };
    const entity: Entity = { ...baseEntity, documents: [document] };
    const mutations = buildMutations();

    render(<DocumentField entity={entity} mutations={mutations} />);

    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    fireEvent.change(nameInput, { target: { value: 'renamed.pdf' } });
    fireEvent.blur(nameInput);

    expect(mutations.renameDocument).toHaveBeenCalledWith(document, 'renamed.pdf');
  });
});
