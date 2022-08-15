/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act, screen } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { FileType } from 'shared/types/fileType';
import api from 'app/utils/api';
import EntitiesAPI from 'app/Entities/EntitiesAPI';
import { PDFSidePanel } from '../PDFSidePanel';
import * as mocks from './PDFSidepanelFixtures';

jest.mock('app/Viewer/containers/DocumentForm', () => ({
  DocumentForm: ({
    sharedId,
    showSubset,
    fileID,
    onEntitySave,
  }: {
    sharedId: string;
    showSubset: string[];
    fileID: string;
    onEntitySave: () => void;
  }) => {
    expect(sharedId).toBe(mocks.entityA.sharedId);
    expect(showSubset).toEqual([mocks.suggestionForEntityA.propertyName]);
    expect(fileID).toBe(mocks.suggestionForEntityA.fileId);
    expect(onEntitySave).toBe(mocks.handleSave);
    return 'mocked DocumentForm';
  },
}));

jest.mock('app/Viewer/components/SourceDocument', () => ({ file }: { file: FileType }) => {
  expect(file._id).toBe(mocks.entityAFile._id);
  expect(file.filename).toBe(mocks.entityAFile.filename);
  return 'mocked SourceDocument';
});

describe('PDFSidePanel', () => {
  const renderComponent = (suggestion: EntitySuggestionType) => {
    const state = { ...defaultState, ...mocks.reduxStore };
    renderConnectedContainer(
      <PDFSidePanel
        open
        entitySuggestion={suggestion}
        closeSidePanel={() => {}}
        handleSave={mocks.handleSave}
      />,
      () => state
    );
  };

  beforeEach(() => {
    spyOn(EntitiesAPI, 'get').and.callFake(async () => Promise.resolve([mocks.entityA]));
    spyOn(api, 'get').and.callFake(async () => Promise.resolve({ json: [mocks.entityAFile] }));
  });

  it('should load the entity with the corresponding pdf', async () => {
    await act(async () => renderComponent(mocks.suggestionForEntityA));
    expect(EntitiesAPI.get).toHaveBeenCalledWith(
      { data: { _id: '_idEntityA' }, headers: {} },
      'English'
    );
    expect(api.get).toHaveBeenCalledWith('files', { data: { _id: '_idFileA' }, headers: {} });
  });

  describe('on save', () => {
    it('should save the entity', async () => {
      await act(async () => renderComponent(mocks.suggestionForEntityA));
      const submitButton = screen.getByText('Save').parentElement;
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });
});
