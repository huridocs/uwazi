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
import { LanguagesListSchema } from 'shared/types/commonTypes';

const languageDefinition = (
  label: string,
  key: string,
  ISO639_3: string,
  // eslint-disable-next-line camelcase
  localized_label: string,
  translationAvailable: boolean = false
  // eslint-disable-next-line max-params
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

const currentLanguages: LanguagesListSchema = [
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

  beforeEach(() => {
    spyOn(I18NApi, 'setDefaultLanguage').and.callFake(async () => Promise.resolve({}));
    spyOn(useApiCaller, 'useApiCaller').and.callFake(() => ({
      requestAction: requestActionMock,
      data: undefined,
      error: '',
    }));
    render();
    rows = screen.getAllByRole('row');
  });

  describe('render installed languages', () => {
    it('should show a list of installed languages', () => {
      expect(rows[1].children[0].textContent).toEqual('Arabic (ar)');
      expect(rows[2].children[0].textContent).toEqual('English (en)');
      expect(rows[3].children[0].textContent).toEqual('Spanish (es)');

      expect(renderResult.container).toMatchSnapshot();
    });
    const checkButtonState = (row: number, column: number, status: string) => {
      expect(rows[row].children[column].getElementsByTagName('button')[0].className).toContain(
        status
      );
    };
    const checkButtonDefinition = (row: number, column: number, count: number) => {
      expect(rows[row].children[column].getElementsByTagName('button').length).toBe(count);
    };
    it('should highlight the default language', () => {
      checkButtonState(1, 1, 'disabled');
      checkButtonState(2, 1, 'disabled');
      checkButtonState(3, 1, 'enabled');
    });
    it('should allow reset a language if there are translations available', () => {
      checkButtonDefinition(1, 2, 0);
      checkButtonDefinition(2, 2, 0);
      checkButtonDefinition(3, 2, 1);
    });
    it('should allow uninstalling any language except default', () => {
      checkButtonDefinition(1, 3, 1);
      checkButtonDefinition(2, 3, 1);
      checkButtonDefinition(3, 3, 0);
    });
  });

  const clickOnAction = async (row: number, column: number) => {
    await act(async () => {
      fireEvent.click(within(rows[row].children[column] as HTMLElement).getByRole('button'));
    });
  };

  describe('actions', () => {
    it('should reset a language', async () => {
      await clickOnAction(3, 2);
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), {
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

    it('should set a language as default', async () => {
      await clickOnAction(1, 1);
      expect(requestActionMock).toHaveBeenCalledWith(
        I18NApi.setDefaultLanguage,
        {
          data: { key: 'ar' },
          headers: {},
        },
        'Default language change success'
      );
    });
    it('should allow to cancel an action', async () => {
      await clickOnAction(1, 3);
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), {
          target: { value: 'CONFIRM' },
        });
        fireEvent.click(
          within(screen.getByTestId('modal')).getByRole('button', { name: 'No, cancel' })
        );
        expect(requestActionMock).not.toHaveBeenCalledWith();
      });
    });

    it('should uninstall a language', async () => {
      await act(async () => {
        fireEvent.click(within(rows[2].children[3] as HTMLElement).getByRole('button'));
      });
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), {
          target: { value: 'CONFIRM' },
        });
        fireEvent.click(
          within(screen.getByTestId('modal')).getByRole('button', { name: 'Uninstall' })
        );
        expect(requestActionMock).toHaveBeenCalledWith(
          I18NApi.deleteLanguage,
          {
            data: { key: 'en' },
            headers: {},
          },
          'Language uninstalled success'
        );
      });
    });
  });
});
