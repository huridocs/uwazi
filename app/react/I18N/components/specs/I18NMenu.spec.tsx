/**
 * @jest-environment jsdom
 */

import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import Immutable from 'immutable';
import { act, fireEvent, RenderResult, screen } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { i18NMenuComponent as I18NMenu } from '../I18NMenu';

describe('I18NMenu', () => {
  let props: any;
  let renderResult: RenderResult;
  const toggleInlineEditMock = jest.fn();

  beforeEach(() => {
    const languages = [
      { _id: '1', key: 'en', label: 'English', localized_label: 'English', default: true },
      { _id: '2', key: 'es', label: 'Spanish', localized_label: 'Español' },
    ];

    props = {
      languages: Immutable.fromJS(languages),
      toggleInlineEdit: toggleInlineEditMock,
      i18nmode: false,
      location: {
        pathname: '/templates/2452345',
        search: '?query=weneedmoreclerics',
      },
      locale: 'es',
    };
  });

  const render = (userType?: 'admin' | 'editor' | 'collaborator') => {
    const storeUser = userType
      ? Immutable.fromJS({ _id: 'user1', role: userType })
      : Immutable.fromJS({});

    props.user = userType
      ? Immutable.fromJS({ _id: 'user1', role: userType })
      : Immutable.fromJS({});

    ({ renderResult } = renderConnectedContainer(<I18NMenu.WrappedComponent {...props} />, () => ({
      ...defaultState,
      user: storeUser,
    })));
  };

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
        props.locale = locale;
        props.location.pathname = currentPath;
        props.location.search = search;
        render('admin');
        const links = screen.getAllByRole('link');
        expect(links.map(link => link.getAttribute('href'))).toEqual(
          expect.arrayContaining([`/en${expectedPath}`, `/es${expectedPath}`])
        );
      }
    );
  });

  it('should return empty if there are no languages', () => {
    props.languages = Immutable.fromJS([]);
    render('admin');
    expect(screen.queryByText('Live translate')).not.toBeInTheDocument();
    expect(screen.queryByText('English')).not.toBeInTheDocument();
  });

  it('should not show live transtions for not authorized user', async () => {
    render('collaborator');
    expect(screen.queryByText('Live translate')).not.toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('should show live transtions for authorized user', async () => {
    render('editor');
    expect(screen.queryByText('Live translate')).toBeInTheDocument();
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.map(item => item.textContent)).toEqual(['English', 'Español']);
  });

  it('should show as active the current locale', async () => {
    render('admin');
    const [listItem] = screen
      .getAllByRole('listitem')
      .filter(item => item.textContent === 'Español');
    expect(listItem.getAttribute('class')).toBe('menuNav-item active');
  });

  it('should not display the language section if there is only one language and no user', () => {
    props.languages = Immutable.fromJS([{ _id: '1', key: 'en', label: 'English', default: true }]);
    render();
    expect(screen.queryByText('English')).not.toBeInTheDocument();
  });

  it('should display the language section if there is only one language and a user', () => {
    props.languages = Immutable.fromJS([{ _id: '1', key: 'en', label: 'English', default: true }]);
    render('collaborator');
    screen.debug();
    expect(screen.queryByText('English')).toBeInTheDocument();
    expect(screen.getByRole('link').getAttribute('href')).toBe(
      '/en/templates/2452345?query=weneedmoreclerics'
    );
  });

  it('should change to a single button when live translating', async () => {
    props.i18nmode = true;
    render('editor');
    expect(screen.getByRole('button').parentElement!.textContent).toEqual('Live translate');
    const activeIcon = renderResult.container.getElementsByClassName('live-on');
    expect(activeIcon.length).toBe(1);
    const listItems = screen.queryAllByRole('listitem');
    expect(listItems).toEqual([]);
  });

  it('should active toggle translation edit mode when clicking Live translate', async () => {
    render('admin');
    await act(async () => {
      fireEvent.click(screen.getByText('Live translate').parentElement!);
    });
    expect(toggleInlineEditMock).toBeCalled();
  });
});
