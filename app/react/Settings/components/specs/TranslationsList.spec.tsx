/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';

import { screen } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import TranslationsList from '../TranslationsList';

describe('TranslationsList', () => {
  const render = () => {
    const state = {
      ...defaultState,
      translations: Immutable.fromJS([
        {
          locale: 'es',
          contexts: [
            { _id: '1', label: 'Menu', type: 'Uwazi UI' },
            { _id: '2', label: 'Thesaurus 1' },
            { _id: '3', label: 'System UI', type: 'Uwazi UI' },
          ],
        },
      ]),
      settings: { collection: Immutable.fromJS({ languages: [{ key: 'es', default: true }] }) },
    };
    renderConnectedContainer(<TranslationsList />, () => state);
  };

  describe('render', () => {
    it('should a list of the different translations contexts', () => {
      render();
      const contexts = screen.getAllByRole('listitem').map(item => item.textContent);
      expect(contexts).toEqual([
        'Uwazi UIMenu Translate',
        'Uwazi UISystem UI Translate',
        'Thesaurus 1 Translate',
      ]);
    });
  });
});
