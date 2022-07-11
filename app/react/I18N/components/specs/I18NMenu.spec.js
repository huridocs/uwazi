/**
 * @jest-environment jsdom
 */
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import Immutable from 'immutable';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import I18NMenu from '../I18NMenu';

describe('I18NMenu', () => {
  let props;
  let renderResult;
  const reloadMock = jest.fn();
  const toggleInlineEditMock = jest.fn();
  I18NMenu.WrappedComponent.reload = reloadMock;

  beforeEach(() => {
    const languages = [
      { key: 'en', label: 'English', localized_label: 'English', default: true },
      { key: 'es', label: 'Spanish', localized_label: 'Español' },
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
      user: Immutable.fromJS({ _id: 'user1', role: 'admin' }),
    };
  });
  const render = () => {
    const reduxStore = {
      ...defaultState,
    };
    ({ renderResult } = renderConnectedContainer(
      <I18NMenu.WrappedComponent {...props} />,
      () => reduxStore
    ));
  };

  describe('documents path', () => {
    it('should not show live transtions for not authorized user', async () => {
      props.user = Immutable.fromJS({ _id: 'user1', role: 'collaborator' });
      render();
      fireEvent.click(screen.getByTitle('open dropdown'));
      const options = screen.getAllByRole('option');
      expect(options.map(option => option.textContent)).toEqual(['English', 'Español']);
    });

    it('should show live transtions for authorized user', async () => {
      render();
      fireEvent.click(screen.getByTitle('open dropdown'));
      const options = screen.getAllByRole('option');
      expect(options.map(option => option.textContent)).toEqual([
        'English',
        'Español',
        'Live translate',
      ]);
    });

    it('should show as active the current locale', async () => {
      render();
      fireEvent.click(screen.getByTitle('open dropdown'));
      const options = screen.getAllByRole('option');
      expect(options[1].getAttribute('class')).toContain('rw-state-selected');
    });

    it.each`
      locale  | pathName                   | search                        | selectedLanguage | expectedPath
      ${'es'} | ${'/es/documents'}         | ${'?search'}                  | ${'English'}     | ${'/en/documents'}
      ${'en'} | ${'/en/entity/r2dzptt7ts'} | ${'?page=2'}                  | ${'Español'}     | ${'/es/entity/r2dzptt7ts'}
      ${null} | ${'/templates/2452345'}    | ${'?query=weneedmoreclerics'} | ${'English'}     | ${'/en/templates/2452345?query=weneedmoreclerics'}
      ${null} | ${'/entity/2452345'}       | ${'?query=weneedmoreclerics'} | ${'Español'}     | ${'/es/entity/2452345?query=weneedmoreclerics'}
      ${'es'} | ${'/es/templates/2452345'} | ${'?query=weneedmoreclerics'} | ${'English'}     | ${'/en/templates/2452345?query=weneedmoreclerics'}
    `(
      'should load the expected path $expectedPath when clicking on $selectedLanguage from $pathName ',
      async ({ locale, pathName, search, selectedLanguage, expectedPath }) => {
        reloadMock.mockClear();
        props.locale = locale;
        props.location.pathname = pathName;
        props.location.search = search;
        render();
        fireEvent.click(screen.getByTitle('open dropdown'));
        const options = screen.getByRole('listbox').parentElement;
        await act(async () => {
          fireEvent.click(within(options).getByText(selectedLanguage));
        });
        expect(reloadMock).toBeCalledWith(expectedPath);
        expect(toggleInlineEditMock).not.toBeCalled();
      }
    );
  });

  it('should active toggle translation edit mode when clicking Live translate', async () => {
    reloadMock.mockClear();
    render();
    fireEvent.click(screen.getByTitle('open dropdown'));
    const options = screen.getByRole('listbox').parentElement;
    await act(async () => {
      fireEvent.click(within(options).getByText('Live translate').parentElement);
    });
    expect(reloadMock).not.toBeCalled();
    expect(toggleInlineEditMock).toBeCalled();
  });

  it('should return null if there are no languages', () => {
    props.languages = Immutable.fromJS([]);
    render();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('should not display the language section if there is only one language and no user', () => {
    props.languages = Immutable.fromJS([{ key: 'en', label: 'English', default: true }]);
    props.user = Immutable.fromJS({});
    render();
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.queryByText('English')).not.toBeInTheDocument();
  });

  it('should change to a button when live translating', async () => {
    props.i18nmode = true;

    render();
    expect(screen.queryByTitle('open dropdown')).toBeNull();
    expect(screen.getByRole('button').parentElement.textContent).toEqual('Live translate');
    expect(screen.getByRole('button').className).toContain('singleItem');

    const activeIcon = renderResult.container.getElementsByClassName('live-on');
    expect(activeIcon.length).toBe(1);
  });
});
