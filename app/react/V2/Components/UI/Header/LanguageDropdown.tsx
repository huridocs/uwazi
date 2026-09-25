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

const LanguageDropdown = ({ className = '' }: LanguageDropdownProps) => {
  const [inlineEditState, setInlineEditState] = useAtom(inlineEditAtom);
  const locale = useAtomValue(localeAtom);
  const { languages: languageList } = useAtomValue(settingsAtom);
  const location = useLocation();
  const options = useMemo(() => languageOptions(languageList ?? []), [languageList]);
  const selected = getSelectedLanguage(locale, languageList);

  if (!languageList?.length || !selected) {
    return null;
  }

  const toggleLiveTranslate = () => {
    setInlineEditState({
      inlineEdit: !inlineEditState.inlineEdit,
      translationKey: '',
      context: '',
    });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LanguageSelect
        value={selected.key}
        options={options}
        align="end"
        aria-label="Language"
        onChange={languageKey => {
          if (languageKey === selected.key) return;
          if (inlineEditState.inlineEdit) {
            setInlineEditState({ inlineEdit: false, translationKey: '', context: '' });
          }
          followLanguageUrl(
            buildLanguageSwitchUrl({
              pathname: location.pathname,
              search: location.search,
              hash: location.hash,
              languageKey,
            })
          );
        }}
      />
      <NeedAuthorization roles={['admin']}>
        <button
          type="button"
          className={[
            'header-bar-button flex items-center gap-1.5 rounded-md border px-3 py-1 text-tab font-medium transition-colors',
            inlineEditState.inlineEdit ? 'header-bar-button-active' : '',
          ].join(' ')}
          aria-pressed={inlineEditState.inlineEdit}
          onClick={toggleLiveTranslate}
        >
          <LanguageIcon className="h-3.5 w-3.5" />
          <Translate>Live translate</Translate>
        </button>
      </NeedAuthorization>
    </div>
  );
};

export { LanguageDropdown };
