/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, RenderResult, screen, render } from '@testing-library/react';
import { Location, MemoryRouter } from 'react-router';
import { createStore, Provider } from 'jotai';
import { ClientUserSchema } from 'app/apiResponseTypes';
import { inlineEditAtom, localeAtom, settingsAtom, userAtom } from 'V2/atoms';
import { TestAtomStoreProvider } from 'V2/testing';
import { UserRole } from 'shared/types/userSchema';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { I18NMenu } from '../I18NMenu';

const defaultLanguages = [
  {
    _id: '1',
    label: 'English',
    key: 'en' as LanguageISO6391,
    localized_label: 'English',
    default: true,
  },
  {
    _id: '2',
    label: 'Spanish',
    key: 'es' as LanguageISO6391,
    localized_label: 'Español',
    default: false,
  },
];

const users = [
  { _id: 'admin', username: 'admin', role: UserRole.ADMIN, email: '' },
  { _id: 'collab', username: 'collab', role: UserRole.COLLABORATOR, email: '' },
];

describe('I18NMenu', () => {
  const initialEntry: Partial<Location> = { pathname: '/library' };
  const inlineEditAtomValue = { inlineEdit: false };
  let renderResult: RenderResult;
  let settingsAtomValue = { languages: defaultLanguages };
  let localeAtomValue = 'en';

  Reflect.deleteProperty(global.window, 'location');
  window.location = { ...window.location, assign: jest.fn() };

  const renderComponent = (user?: ClientUserSchema) => {
    renderResult = render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <TestAtomStoreProvider
          initialValues={[
            [settingsAtom, settingsAtomValue],
            [userAtom, user],
            [localeAtom, localeAtomValue],
            [inlineEditAtom, inlineEditAtomValue],
          ]}
        >
          <I18NMenu />
        </TestAtomStoreProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    initialEntry.pathname = '/library';
    localeAtomValue = 'en';
    settingsAtomValue = { languages: defaultLanguages };
    inlineEditAtomValue.inlineEdit = false;
    jest.clearAllMocks();
  });

  it('should render the links to the different languages', () => {
    renderComponent();
    const links = screen.getAllByRole('link');
    expect(links.map(link => link.getAttribute('href'))).toEqual(
      expect.arrayContaining(['/en/library', '/es/library'])
    );
  });

  it('should not render anything if there is only one language', () => {
    settingsAtomValue = {
      languages: [
        { _id: '2', label: 'Spanish', key: 'es', localized_label: 'Español', default: true },
      ],
    };
    renderComponent();
    const links = screen.queryAllByRole('link');
    expect(links.length).toBe(0);
  });

  it('should show as active the current locale', async () => {
    renderComponent(users[0]);
    const [listItem] = renderResult
      .getAllByRole('listitem')
      .filter(item => item.textContent === 'English');
    expect(listItem.getAttribute('class')).toBe('menuNav-item active');
  });

  it('should active toggle translation edit mode when clicking Live translate', async () => {
    renderComponent(users[0]);
    expect(renderResult.container).toMatchSnapshot('before turning on live translate');
    await act(async () => {
      fireEvent.click(screen.getByText('Live translate').parentElement!);
    });
    expect(renderResult.container).toMatchSnapshot('after turning on live translate');
  });

  describe('when there is a user', () => {
    it('should render then laguages and the live translate option', () => {
      renderComponent(users[0]);
      expect(renderResult.getByText('Live translate')).toBeInTheDocument();
    });

    it('should not render live translate for unauthorized users', () => {
      renderComponent(users[1]);
      expect(renderResult.queryByText('Live translate')).not.toBeInTheDocument();
    });

    it('should display the language section if there is only one language', () => {
      settingsAtomValue = {
        languages: [
          { _id: '2', label: 'Spanish', key: 'es', localized_label: 'Español', default: true },
        ],
      };
      renderComponent(users[1]);
      const links = screen.queryAllByRole('link');
      expect(links.length).toBe(1);
      expect(links.map(link => link.getAttribute('href'))).toEqual(
        expect.arrayContaining(['/es/library'])
      );
    });
  });

  describe('Paths', () => {
    it.each`
      locale  | currentPath                | search                        | expectedPath
      ${'es'} | ${'/es/documents'}         | ${'?search'}                  | ${'/documents'}
      ${'en'} | ${'/en/entity/r2dzptt7ts'} | ${'?page=2'}                  | ${'/entity/r2dzptt7ts'}
      ${null} | ${'/templates/2452345'}    | ${'?query=weneedmoreclerics'} | ${'/templates/2452345?query=weneedmoreclerics'}
      ${null} | ${'/entity/2452345'}       | ${'?query=weneedmoreclerics'} | ${'/entity/2452345?query=weneedmoreclerics'}
      ${'es'} | ${'/es/templates/2452345'} | ${'?query=weneedmoreclerics'} | ${'/templates/2452345?query=weneedmoreclerics'}
    `(
      'should create the expected links for $pathName',
      async ({ locale, currentPath, search, expectedPath }) => {
        localeAtomValue = locale;
        initialEntry.pathname = currentPath;
        initialEntry.search = search;
        renderComponent(users[0]);
        const links = screen.getAllByRole('link');
        expect(links.map(link => link.getAttribute('href'))).toEqual(
          expect.arrayContaining([`/en${expectedPath}`, `/es${expectedPath}`])
        );
      }
    );
  });

  describe('reloading after language change', () => {
    const testStore = createStore();
    testStore.set(userAtom, users[0]);
    testStore.set(localeAtom, 'en');
    testStore.set(settingsAtom, settingsAtomValue);

    it('should trigger a reload if the current language is deleted', async () => {
      const result = render(
        <MemoryRouter initialEntries={[initialEntry]}>
          <Provider store={testStore}>
            <I18NMenu />
          </Provider>
        </MemoryRouter>
      );

      const newSettingsAtomValue = {
        languages: [
          {
            _id: '2',
            label: 'Spanish',
            key: 'es' as LanguageISO6391,
            localized_label: 'Español',
            default: true,
          },
        ],
      };

      await act(() => {
        testStore.set(settingsAtom, newSettingsAtomValue);
      });

      result.rerender(
        <MemoryRouter initialEntries={[initialEntry]}>
          <Provider store={testStore}>
            <I18NMenu />
          </Provider>
        </MemoryRouter>
      );

      expect(window.location.assign).toHaveBeenCalledTimes(1);
      expect(window.location.assign).toHaveBeenCalledWith('/library');
    });
  });
});
