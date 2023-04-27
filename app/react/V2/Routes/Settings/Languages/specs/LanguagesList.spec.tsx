/**
 * @jest-environment jsdom
 */
import React from 'react';
import { MutableSnapshot, RecoilRoot } from 'recoil';
import { screen, RenderResult, fireEvent, within, act } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { I18NApi } from 'app/I18N';
import { settingsAtom } from 'app/V2/atoms/settingsAtom';
import { Settings } from 'shared/types/settingsType';
import * as useApiCaller from 'app/V2/CustomHooks/useApiCaller';
import { LanguagesList } from '../LanguagesList';

const languageDefinition = (
  label: string,
  key: string,
  ISO639_3: string,
  // eslint-disable-next-line camelcase
  localized_label: string,
  translationAvailable: boolean = false
) => ({
  label,
  key,
  ISO639_3,
  // eslint-disable-next-line camelcase
  localized_label,
  translationAvailable,
});
const abkhazianLanguage = languageDefinition('Abkhazian', 'ab', 'abk', 'Abkhazian');
const availableLanguages = [
  { ...abkhazianLanguage },
  { ...languageDefinition('English', 'en', 'eng', 'English') },
  { ...languageDefinition('Spanish', 'es', 'spa', 'Spanish', true) },
  { ...languageDefinition('Afar', 'aa', 'aar', 'Afar') },
  { ...languageDefinition('Thai', 'th', 'tha', 'ไทย', true) },
];

const currentLanguages = [
  { label: 'English', key: 'en' },
  { label: 'Spanish', key: 'es', default: true },
  { label: 'Arabic', key: 'ar' },
];
const mockUseLoaderData = jest.fn().mockImplementation(() => availableLanguages);

jest.mock('react-router-dom', () => ({
  useLoaderData: () => mockUseLoaderData(),
  // eslint-disable-next-line jsx-a11y/anchor-has-content, react/prop-types, react/jsx-props-no-spreading
  Link: (props: { to: string }) => <a {...props} href={props.to} />,
}));

describe('LanguagesList', () => {
  let renderResult: RenderResult;

  const recoilGlobalState = ({ set }: MutableSnapshot) => {
    const settings: Partial<Settings> = { languages: currentLanguages };
    set(settingsAtom, settings);
  };

  const render = () => {
    ({ renderResult } = renderConnectedContainer(
      <RecoilRoot initializeState={recoilGlobalState}>
        <LanguagesList />
      </RecoilRoot>,
      () => defaultState
    ));
  };
  let rows: HTMLElement[];

  const requestActionMock = jest.fn();

  beforeAll(() => {
    spyOn(I18NApi, 'setDefaultLanguage').and.callFake(async () => Promise.resolve({}));
    spyOn(useApiCaller, 'useApiCaller').and.callFake(() => ({
      requestAction: requestActionMock,
      data: undefined,
      error: '',
    }));
    render();
    rows = screen.getAllByRole('row');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('render installed languages', () => {
    it('should show a list of installed languages', () => {
      expect(rows[1].children[0].textContent).toEqual('Arabic (ar)');
      expect(rows[2].children[0].textContent).toEqual('English (en)');
      expect(rows[3].children[0].textContent).toEqual('Spanish (es)');
      expect(renderResult.container).toMatchSnapshot();
    });
    it('should highlight the default language', () => {
      expect(rows[1].children[1].getElementsByTagName('button')[0].className).toContain('disabled');
      expect(rows[2].children[1].getElementsByTagName('button')[0].className).toContain('disabled');
      expect(rows[3].children[1].getElementsByTagName('button')[0].className).toContain('enabled');
    });
    it('should allow reset a language if there are translations available', () => {
      expect(rows[1].children[2].getElementsByTagName('button').length).toBe(0);
      expect(rows[2].children[2].getElementsByTagName('button').length).toBe(0);
      expect(rows[3].children[2].getElementsByTagName('button').length).toBe(1);
    });
    it('should allow uninstalling any language except default', () => {
      expect(rows[1].children[3].getElementsByTagName('button').length).toBe(1);
      expect(rows[2].children[3].getElementsByTagName('button').length).toBe(1);
      expect(rows[3].children[3].getElementsByTagName('button').length).toBe(0);
    });
  });
  describe('actions', () => {
    it('should set a language as default', async () => {
      fireEvent.click(rows[1].children[1].getElementsByTagName('button')[0]);
      expect(I18NApi.setDefaultLanguage).toHaveBeenCalledWith({
        data: { key: 'ar' },
        headers: {},
      });
    });

    it('should handle the api calls correctly', async () => {
      await act(async () => {
        fireEvent.click(within(rows[3].children[2] as HTMLElement).getByRole('button'));
      });
      await act(async () => {
        fireEvent.change(within(screen.getByTestId('modal')).getByRole('textbox'), {
          target: { value: 'CONFIRM' },
        });
        fireEvent.click(within(screen.getByTestId('modal')).getByRole('button', { name: 'Reset' }));
        expect(requestActionMock).toHaveBeenCalledWith(
          I18NApi.populateTranslations,
          {
            data: { locale: 'es' },
            headers: {},
          },
          'Language reset success'
        );
      });
    });
  });
});
