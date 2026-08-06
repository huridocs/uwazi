/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Entity } from '#V2/api/entities/types.js';
import type { DocumentFieldMutations } from '../../editEntityTypes.js';
import { AdditionalFilesField } from '../AdditionalFilesField.js';

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

describe('AdditionalFilesField', () => {
  it('should render nothing when the entity has no attachments', () => {
    const { container } = render(
      <AdditionalFilesField entity={baseEntity} mutations={buildMutations()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should render Other files header and a field per attachment with type label', () => {
    const entity: Entity = {
      ...baseEntity,
      attachments: [
        { _id: 'a1', originalname: 'brief.pdf', mimetype: 'application/pdf' },
        { _id: 'a2', originalname: 'hearing.mp4', mimetype: 'video/mp4' },
      ],
    };

    render(<AdditionalFilesField entity={entity} mutations={buildMutations()} />);

    expect(screen.getByText('Other files')).toBeInTheDocument();
    expect(screen.getByText('Document')).toBeInTheDocument();
    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByDisplayValue('brief.pdf')).toBeInTheDocument();
    expect(screen.getByDisplayValue('hearing.mp4')).toBeInTheDocument();
    expect(screen.queryByText('Name')).not.toBeInTheDocument();
  });

  it('should rename and remove an attachment', () => {
    const file = { _id: 'a1', originalname: 'brief.pdf', mimetype: 'application/pdf' };
    const entity: Entity = { ...baseEntity, attachments: [file] };
    const mutations = buildMutations();

    render(<AdditionalFilesField entity={entity} mutations={mutations} />);

    const nameInput = screen.getByDisplayValue('brief.pdf');
    fireEvent.change(nameInput, { target: { value: 'renamed.pdf' } });
    fireEvent.blur(nameInput);
    expect(mutations.renameDocument).toHaveBeenCalledWith(file, 'renamed.pdf');

    fireEvent.click(screen.getByText('Remove file'));
    expect(mutations.removeDocument).toHaveBeenCalledWith('a1');
  });
});
