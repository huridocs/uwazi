/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { IImmutable } from 'shared/types/Immutable';
import { ClientTranslationSchema } from 'app/istore';
import { actions } from 'app/I18N';
import { EditTranslationsForm } from '../EditTranslationsForm';

describe('EditTranslationForm', () => {
  let translations: IImmutable<ClientTranslationSchema[]>;

  const render = (context: string) => {
    const store = {
      ...defaultState,
      translations,
      settings: {
        collection: Immutable.fromJS({
          languages: [
            { key: 'en', label: 'English' },
            { key: 'es', label: 'Spanish', default: true },
          ],
        }),
      },
    };

    renderConnectedContainer(<EditTranslationsForm context={context} />, () => store);
  };

  beforeEach(() => {
    translations = Immutable.fromJS([
      {
        locale: 'en',
        contexts: [
          {
            id: 'System',
            label: 'User Interface',
            type: 'Uwazi UI',
            values: {
              Library: 'Library',
              Search: 'Search',
              Home: 'Home',
            },
          },
          {
            type: 'Entity',
            label: 'Template name',
            id: '5bfbb1a0471dd0fc16ada146',
            values: {
              Title: 'Title',
              'Untranslated entity property': 'Untranslated entity property',
            },
          },
        ],
      },
      {
        locale: 'es',
        contexts: [
          {
            id: 'System',
            label: 'User Interface',
            type: 'Uwazi UI',
            values: {
              Library: 'Biblioteca',
              Search: 'Busqueda',
              Home: 'Principal',
            },
          },
          {
            type: 'Entity',
            label: 'Template name',
            id: '5bfbb1a0471dd0fc16ada146',
            values: {
              Title: 'Título',
              'Untranslated entity property': 'Untranslated entity property',
            },
          },
        ],
      },
    ]);
  });

  describe('Render', () => {
    it('should render a form with fields for each value', () => {
      render('System');
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('Library')).toBeInTheDocument();
    });

    it('should render fields alphabetically', () => {
      render('System');
      const fields = screen.getAllByRole('heading');
      expect(fields[0].textContent).toBe('Home');
      expect(fields[1].textContent).toBe('Library');
      expect(fields[2].textContent).toBe('Search');
    });

    it('should not show the import translations button for contexts that are not System', () => {
      render('5bfbb1a0471dd0fc16ada146');
      expect(screen.queryByText('Import')).not.toBeInTheDocument();
    });
  });

  describe('submit', () => {
    let inputField: Node | Window;
    let submitButton: Node | Window;

    beforeEach(() => {
      jest.spyOn(actions, 'saveTranslations').mockReturnValue(() => {});
      render('System');
      inputField = screen.getByDisplayValue('Principal');
      submitButton = screen.getByText('Save').parentElement!;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should display an error when values are empty', async () => {
      fireEvent.change(inputField, {
        target: { value: '' },
      });

      fireEvent.click(submitButton);

      expect(actions.saveTranslations).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });

    it('should call saveTranslations updating the changed value', async () => {
      fireEvent.change(inputField, {
        target: { value: 'Nueva traducción!' },
      });

      fireEvent.click(submitButton);

      await waitFor(() =>
        expect(actions.saveTranslations).toHaveBeenCalledWith([
          {
            contexts: [
              {
                id: 'System',
                label: 'User Interface',
                type: 'Uwazi UI',
                values: { Home: 'Home', Library: 'Library', Search: 'Search' },
              },
            ],
            locale: 'en',
          },
          {
            contexts: [
              {
                id: 'System',
                label: 'User Interface',
                type: 'Uwazi UI',
                values: { Home: 'Nueva traducción!', Library: 'Biblioteca', Search: 'Busqueda' },
              },
            ],
            locale: 'es',
          },
        ])
      );
    });
  });

  describe('filtering', () => {
    beforeEach(() => {
      jest.spyOn(actions, 'saveTranslations').mockReturnValue(() => {});
      render('5bfbb1a0471dd0fc16ada146');
      const toggleButton = screen.getByRole('checkbox');
      fireEvent.click(toggleButton);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should filter to show only untranslated terms', () => {
      expect(screen.getByText('Title').parentElement!).toHaveClass('list-group-item hidden');
      expect(screen.getByText('Untranslated entity property').parentElement!).toHaveClass(
        'list-group-item'
      );
    });

    it('should submit with all the values even when filtering', async () => {
      const inputField = screen.getAllByDisplayValue('Untranslated entity property');
      const submitButton = screen.getByText('Save').parentElement!;

      fireEvent.change(inputField[1], {
        target: { value: 'Traducción para la propiedad' },
      });

      fireEvent.click(submitButton);

      await waitFor(() =>
        expect(actions.saveTranslations).toHaveBeenCalledWith([
          {
            contexts: [
              {
                id: '5bfbb1a0471dd0fc16ada146',
                label: 'Template name',
                type: 'Entity',
                values: {
                  Title: 'Title',
                  'Untranslated entity property': 'Untranslated entity property',
                },
              },
            ],
            locale: 'en',
          },
          {
            contexts: [
              {
                id: '5bfbb1a0471dd0fc16ada146',
                label: 'Template name',
                type: 'Entity',
                values: {
                  Title: 'Título',
                  'Untranslated entity property': 'Traducción para la propiedad',
                },
              },
            ],
            locale: 'es',
          },
        ])
      );
    });
  });
});
