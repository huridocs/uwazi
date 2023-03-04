/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { IImmutable } from 'shared/types/Immutable';
import { ClientTranslationSchema, IStore } from 'app/istore';
import { actions } from 'app/I18N';
import { EditTranslationsForm } from '../EditTranslationsForm';

const mockNavigate = jest.fn().mockImplementation(path => path);
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => (path: string) => mockNavigate(path),
  // eslint-disable-next-line jsx-a11y/anchor-has-content, react/prop-types
  NavLink: (props: any) => <a {...props} href={props.to} />,
}));

const systemContext = (...args: string[]) => ({
  id: 'System',
  label: 'User Interface',
  type: 'Uwazi UI',
  values: {
    Library: args[0],
    Search: args[1],
    Home: args[2],
    Untranslated: args[3],
  },
});

const entityContext = (...args: string[]) => ({
  label: 'Template name',
  id: '5bfbb1a0471dd0fc16ada146',
  type: 'Entity',
  values: {
    Title: args[0],
    'Untranslated entity property': args[1],
    'Translated entity property': args[2],
  },
});

const thesaurusContext = (...args: string[]) => ({
  label: 'Thesaurus name',
  id: '62ce63c3d192f51bc4d5e06b',
  type: 'Thesaurus',
  values: {
    Gender: args[0],
    Female: args[1],
    Male: args[2],
  },
});

const englishSystem = systemContext('Library', 'Search', 'Home', 'Untranslated');
const englishEntity = entityContext(
  'Title',
  'Untranslated entity property',
  'Translated entity property'
);
describe('EditTranslationForm', () => {
  let translations: IImmutable<ClientTranslationSchema[]>;
  let store: Partial<IStore>;

  const render = (context: string, englishDefault = true, spanishDefault = false) => {
    store = {
      ...defaultState,
      translations,
      settings: {
        collection: Immutable.fromJS({
          languages: [
            { key: 'en', label: 'English', default: englishDefault },
            { key: 'es', label: 'Spanish', default: spanishDefault },
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
          { ...englishSystem },
          {
            ...englishEntity,
          },
          { ...thesaurusContext('Gender', 'Female', 'Male') },
        ],
      },
      {
        locale: 'es',
        contexts: [
          { ...systemContext('Biblioteca', 'Busqueda', 'Principal', 'Untranslated') },
          { ...entityContext('Título', 'Untranslated entity property', 'Propiedad de la entidad') },
          { ...thesaurusContext('Genero', 'Femenino', 'Masculino') },
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
      expect(screen.queryByText('There are no untranslated terms')).not.toBeInTheDocument();
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
            contexts: [{ ...englishSystem }],
            locale: 'en',
          },
          {
            contexts: [
              {
                ...systemContext('Biblioteca', 'Busqueda', 'Nueva traducción!', 'Untranslated'),
              },
            ],
            locale: 'es',
          },
        ])
      );
    });
  });

  describe('upload translations', () => {
    const file = new File(['valid csv'], 'translations.csv', { type: 'text/csv' });

    it('should call the upload function with the file', async () => {
      jest.spyOn(actions, 'importTranslations');

      render('System');

      const input = screen.getByLabelText('import-translations');
      await userEvent.upload(input, file);

      expect(actions.importTranslations).toHaveBeenCalledWith(file);
    });

    it('should reset the form with the updated values', async () => {
      jest.spyOn(actions, 'importTranslations').mockReturnValueOnce(async () => [
        {
          locale: 'es',
          contexts: [
            {
              id: 'System',
              label: 'User Interface',
              type: 'Uwazi UI',
              values: {
                Library: 'Librería',
                Search: 'Buscar',
                Home: 'Inicio',
              },
            },
          ],
        },
      ]);

      render('System');

      const input = screen.getByLabelText('import-translations');
      await userEvent.upload(input, file);

      expect(screen.getByDisplayValue('Librería')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Buscar')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Inicio')).toBeInTheDocument();
    });
  });

  describe('filtering', () => {
    const renderAndFilter = (context: string, englishDefault = true, spanishDefault = false) => {
      render(context, englishDefault, spanishDefault);
      const toggleButton = screen.getByRole('checkbox');
      fireEvent.click(toggleButton);
    };

    beforeEach(() => {
      jest.spyOn(actions, 'saveTranslations').mockReturnValue(() => {});
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    const checkEntry = (item: HTMLElement, key: string, classNames: string[]) => {
      expect(item.children[0].textContent).toEqual(key);
      expect(item.children[1].textContent).toEqual('en');
      expect(item.children[1].className).toEqual(classNames[0]);
      expect(item.children[2].textContent).toEqual('es');
      expect(item.children[2].className).toEqual(classNames[1]);
    };

    it('should filter to show only untranslated terms and value for default language as reference', () => {
      renderAndFilter('5bfbb1a0471dd0fc16ada146');

      const items = screen.getAllByRole('listitem');
      checkEntry(items[0], 'Title', ['form-group hidden  default ', 'form-group hidden  ']);
      checkEntry(items[1], 'Translated entity property', [
        'form-group hidden  default ',
        'form-group hidden  ',
      ]);
      checkEntry(items[2], 'Untranslated entity property', [
        'form-group   default ',
        'form-group    untranslated',
      ]);
    });

    it('should filter to show only untranslated terms and value for default language as reference', () => {
      renderAndFilter('5bfbb1a0471dd0fc16ada146', false, true);

      const items = screen.getAllByRole('listitem');
      checkEntry(items[0], 'Title', [
        'form-group hidden   untranslated',
        'form-group hidden  default ',
      ]);
      checkEntry(items[1], 'Translated entity property', [
        'form-group hidden   untranslated',
        'form-group hidden  default ',
      ]);
      checkEntry(items[2], 'Untranslated entity property', [
        'form-group    untranslated',
        'form-group   default ',
      ]);
    });

    it('should filter to show only untranslated terms and English System value as reference', () => {
      renderAndFilter('System', false, true);
      const items = screen.getAllByRole('listitem');
      checkEntry(items[0], 'Home', ['form-group hidden  default ', 'form-group hidden  ']);
      checkEntry(items[1], 'Library', ['form-group hidden  default ', 'form-group hidden  ']);
      checkEntry(items[2], 'Search', ['form-group hidden  default ', 'form-group hidden  ']);
      checkEntry(items[3], 'Untranslated', ['form-group   default ', 'form-group    untranslated']);
    });

    it('should display a notice and disable saving if there are no untranslated terms', () => {
      renderAndFilter('62ce63c3d192f51bc4d5e06b');
      const submitButton = screen.getByText('Save').parentElement!.parentElement!;
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('There are no untranslated terms')).toBeInTheDocument();
    });

    it('should submit with all the values even when filtering', async () => {
      renderAndFilter('5bfbb1a0471dd0fc16ada146');

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
                ...englishEntity,
              },
            ],
            locale: 'en',
          },
          {
            contexts: [
              {
                ...entityContext(
                  'Título',
                  'Traducción para la propiedad',
                  'Propiedad de la entidad'
                ),
              },
            ],
            locale: 'es',
          },
        ])
      );
    });
  });
});
