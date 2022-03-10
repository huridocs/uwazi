/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, screen } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { PDFSidePanel } from '../PDFSidePanel';
import * as actions from '../actions/actions';
import { entityA, entityAFile, suggestionForEntityA, reduxStore } from './PDFSidepanelFixtures';

describe('PDFSidePanel', () => {
  let store = reduxStore;

  const renderComponent = (suggestion: EntitySuggestionType) => {
    const state = { ...defaultState, ...store };
    renderConnectedContainer(
      <PDFSidePanel
        open
        entitySuggestion={suggestion}
        closeSidePanel={() => {}}
        handleSave={() => {}}
      />,
      () => state
    );
  };

  beforeEach(() => {
    spyOn(actions, 'fetchEntity').and.returnValue(Promise.resolve([entityA]));
    spyOn(actions, 'fetchFile').and.returnValue(Promise.resolve({ json: [entityAFile] }));
  });

  it('should load the entity with the corresponding pdf', async () => {
    await act(async () => renderComponent(suggestionForEntityA));
    screen.debug();
  });

  it('should open the pdf and scroll to the suggestions page', () => {});

  describe('on save', () => {
    it('should save the entity', () => {});
  });
});
