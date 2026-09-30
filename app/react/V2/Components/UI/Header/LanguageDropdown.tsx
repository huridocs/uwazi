import React, { useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useLocation } from 'react-router';
import { LanguageIcon } from '@heroicons/react/20/solid';
import { LanguagesListSchema } from '#shared/types/commonTypes.js';
import { LanguageUtils } from '#shared/language/index.js';
import { inlineEditAtom, localeAtom, settingsAtom } from '#V2/atoms/index.js';
import { Translate } from '#app/I18N/index.js';
import { LanguageSelect, NeedAuthorization } from '#V2/Components/UI/index.js';
import { buildLanguageSwitchUrl } from './buildLanguageSwitchUrl.js';
import { followLanguageUrl } from './followLanguageUrl.js';

type LanguageDropdownProps = {
  className?: string;
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

const stoppedEdit = { inlineEdit: false, translationKey: '', context: '' };
const startedEdit = { inlineEdit: true, translationKey: '', context: '' };

const liveTranslateControl = (onClick: () => void, className?: string) =>
  className === undefined ? (
    <NeedAuthorization roles={['admin']}>
      <button
        type="button"
        className="header-bar-panel-item flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-xs font-medium"
        onMouseDown={event => event.preventDefault()}
        onClick={onClick}
      >
        <LanguageIcon className="h-3.5 w-3.5" />
        <Translate>Live translate</Translate>
      </button>
    </NeedAuthorization>
  ) : (
    <button
      type="button"
      className={`header-bar-button header-bar-button-active flex items-center gap-1.5 rounded-md border px-3 py-1 text-tab font-medium ${className}`}
      aria-pressed
      onClick={onClick}
    >
      <LanguageIcon className="h-3.5 w-3.5" />
      <Translate>Live translate</Translate>
    </button>
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

const LanguageDropdown = ({ className = '' }: LanguageDropdownProps) => {
  const [inlineEditState, setInlineEditState] = useAtom(inlineEditAtom);
  const locale = useAtomValue(localeAtom);
  const { languages: languageList } = useAtomValue(settingsAtom);
  const location = useLocation();
  const options = useMemo(() => languageOptions(languageList ?? []), [languageList]);
  const selected = getSelectedLanguage(locale, languageList);

  if (!languageList?.length || !selected || inlineEditState.inlineEdit) {
    return inlineEditState.inlineEdit
      ? liveTranslateControl(() => setInlineEditState(stoppedEdit), className)
      : null;
  }

  return (
    <div className={className}>
      <LanguageSelect
        value={selected.key}
        options={options}
        align="end"
        aria-label="Language"
        onChange={languageKey => switchLanguage(location, selected.key, languageKey)}
        footer={liveTranslateControl(() => setInlineEditState(startedEdit))}
      />
    </div>
  );
};

export { LanguageDropdown };
