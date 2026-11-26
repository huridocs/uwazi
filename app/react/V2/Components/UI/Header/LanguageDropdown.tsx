import React, { useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useLocation } from 'react-router';
import { LanguagesListSchema } from '#shared/types/commonTypes.js';
import { LanguageUtils } from '#shared/language/index.js';
import { inlineEditAtom, localeAtom, settingsAtom } from '#V2/atoms/index.js';
import { t, Translate } from '#app/I18N/index.js';
import {
  LanguageSelect,
  NeedAuthorization,
  type LanguageSelectAppearance,
} from '#V2/Components/UI/index.js';
import { buildLanguageSwitchUrl } from './buildLanguageSwitchUrl.js';
import { followLanguageUrl } from './followLanguageUrl.js';
import { HeaderIcon } from './headerIcons.js';

type LanguageDropdownProps = {
  className?: string;
  appearance?: LanguageSelectAppearance;
};

const languageAutonym = (language: { key: string; label?: string }) =>
  LanguageUtils.fromISO639_1(language.key).localized_label || language.label || language.key;

const getSelectedLanguage = (locale: string, languages?: LanguagesListSchema) =>
  languages?.find(lang => lang.key === locale) || languages?.find(lang => lang.default);

const languageOptions = (languages: LanguagesListSchema) =>
  languages.map(language => ({
    value: language.key,
    label: languageAutonym(language),
    iso6391: language.key,
  }));

const startedEdit = { inlineEdit: true, translationKey: '', context: '' };

const liveTranslateLabel = () => (
  <>
    <HeaderIcon name="languages" />
    <Translate>Live translate</Translate>
  </>
);

const liveTranslateItem = (onClick: () => void) => (
  <NeedAuthorization roles={['admin']}>
    <button
      type="button"
      className="header-bar-panel-item flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-xs font-medium"
      onMouseDown={event => event.preventDefault()}
      onClick={onClick}
    >
      {liveTranslateLabel()}
    </button>
  </NeedAuthorization>
);

const switchLanguage = (
  location: { pathname: string; search: string; hash: string },
  currentKey: string,
  languageKey: string
) => {
  if (languageKey === currentKey) return;
  followLanguageUrl(
    buildLanguageSwitchUrl({
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      languageKey,
    })
  );
};

const LanguageDropdown = ({ className = '', appearance = 'header' }: LanguageDropdownProps) => {
  const [inlineEditState, setInlineEditState] = useAtom(inlineEditAtom);
  const locale = useAtomValue(localeAtom);
  const { languages: languageList } = useAtomValue(settingsAtom);
  const location = useLocation();
  const options = useMemo(() => languageOptions(languageList ?? []), [languageList]);
  const selected = getSelectedLanguage(locale, languageList);

  if (!languageList?.length || !selected) return null;

  return (
    <div className={className}>
      <LanguageSelect
        key={inlineEditState.inlineEdit ? 'live-on' : 'live-off'}
        value={selected.key}
        options={options}
        align="end"
        appearance={appearance}
        aria-label={t('System', 'Language', null, false)}
        onChange={languageKey => switchLanguage(location, selected.key, languageKey)}
        footer={liveTranslateItem(() => setInlineEditState(startedEdit))}
      />
    </div>
  );
};

export { LanguageDropdown };
