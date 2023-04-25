/**
 * @jest-environment jsdom
 */
import React from 'react';
import { MutableSnapshot, RecoilRoot } from 'recoil';
import { screen, RenderResult, fireEvent } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { I18NApi } from 'app/I18N';
import { settingsAtom } from 'app/V2/atoms/settingsAtom';
import { Settings } from 'shared/types/settingsType';
import { LanguagesList } from '../LanguagesList';

const abkhazianLanguage = {
  label: 'Abkhazian',
  key: 'ab',
  ISO639_3: 'abk',
  localized_label: 'Abkhazian',
  translationAvailable: false,
};
const availableLanguages = [
  { ...abkhazianLanguage },
  {
    label: 'English',
    key: 'en',
    ISO639_3: 'eng',
    localized_label: 'English',
    translationAvailable: false,
  },
  {
    label: 'Spanish',
    key: 'es',
    ISO639_3: 'spa',
    localized_label: 'Español',
    translationAvailable: true,
  },
  {
    label: 'Afar',
    key: 'aa',
    ISO639_3: 'aar',
    localized_label: 'Afar',
    translationAvailable: false,
  },
  {
    label: 'Thai',
    key: 'th',
    ISO639_3: 'tha',
    localized_label: 'ไทย',
    translationAvailable: true,
  },
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

  beforeEach(() => {
    spyOn(I18NApi, 'setDefaultLanguage').and.callFake(async () => Promise.resolve({}));
  });

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
  beforeAll(() => {
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
    it('should set a language as default', () => {
      fireEvent.click(rows[1].children[1].getElementsByTagName('button')[0]);
      expect(I18NApi.setDefaultLanguage).toHaveBeenCalledWith({ data: { key: 'ar' }, headers: {} });
    });

    it.todo('should notity success action');
  });
});
