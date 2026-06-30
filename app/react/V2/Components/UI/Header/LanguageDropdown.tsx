import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useLocation } from 'react-router';
import { ChevronDownIcon, ChevronUpIcon, LanguageIcon } from '@heroicons/react/20/solid';
import { LanguagesListSchema } from '#shared/types/commonTypes.js';
import { inlineEditAtom, localeAtom, settingsAtom } from '#V2/atoms/index.js';
import { Translate } from '#app/I18N/index.js';
import { useIsMobile } from '#app/V2/CustomHooks/useIsMobile.js';
import { NeedAuthorization } from '#V2/Components/UI/index.js';
import { BaseDropdown } from './BaseDropdown.js';

interface LanguageDropdownProps {
  className?: string;
}

const getSelectedLanguage = (locale: string, languages?: LanguagesListSchema) =>
  languages?.find(lang => lang.key === locale) || languages?.find(lang => lang.default);

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ className = '' }) => {
  const [inlineEditState, setInlineEditState] = useAtom(inlineEditAtom);
  const locale = useAtomValue(localeAtom);
  const { languages: languageList } = useAtomValue(settingsAtom);
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const selectedLanguage = getSelectedLanguage(locale, languageList);

  // Function to build URL with language prefix
  const buildLanguageUrl = (languageKey: string): string => {
    const currentPath = location.pathname;
    const currentSearch = location.search;

    // Remove existing language prefix if present
    const pathWithoutLanguage = currentPath.replace(/^\/[a-z]{2}(\/|$)/, '/');

    // Add new language prefix
    const newPath = `/${languageKey}${pathWithoutLanguage === '/' ? '' : pathWithoutLanguage}`;

    // Preserve search parameters (but exclude page parameter for non-document pages)
    const shouldPreserveSearch = !currentPath.match('document') && currentSearch.match(/page=/);
    const searchParams = shouldPreserveSearch ? currentSearch : '';

    return `${newPath}${searchParams}`;
  };

  const isTablet = useIsMobile(768);

  const handleMainClick = (event: React.MouseEvent) => {
    if (inlineEditState.inlineEdit) {
      event.preventDefault();
      setInlineEditState({
        inlineEdit: false,
        translationKey: '',
        context: '',
      });
    }
  };

  const handleLiveTranslateToggle = () => {
    setInlineEditState({
      inlineEdit: !inlineEditState.inlineEdit,
      translationKey: '',
      context: '',
    });
    setDropdownOpen(false);
  };

  if (!languageList || languageList.length < 1) {
    return null;
  }

  const trigger = (
    <button
      type="button"
      id="language-menu-button"
      className={[
        'header-bar-button flex items-center gap-1.5 rounded-md border px-3 py-1 text-[0.8125rem] font-medium transition-colors',
        inlineEditState.inlineEdit ? 'header-bar-button-active' : '',
      ].join(' ')}
      aria-expanded={dropdownOpen}
      aria-haspopup="menu"
      aria-controls={dropdownOpen ? 'language-menu' : undefined}
      onClick={handleMainClick}
      onKeyDown={e => {
        if (e.key === 'ArrowDown' && !dropdownOpen) {
          e.preventDefault();
          setDropdownOpen(true);
        }
      }}
    >
      {inlineEditState.inlineEdit ? (
        <span className="flex items-center gap-1.5">
          <LanguageIcon className="h-3.5 w-3.5" />
          <Translate>Live translate</Translate>
        </span>
      ) : (
        <span className={isTablet ? 'uppercase' : ''}>
          {isTablet ? selectedLanguage?.key : selectedLanguage?.localized_label}
        </span>
      )}
      {dropdownOpen ? (
        <ChevronUpIcon className="h-3.5 w-3.5" />
      ) : (
        <ChevronDownIcon className="h-3.5 w-3.5" />
      )}
    </button>
  );

  return (
    <BaseDropdown
      trigger={trigger}
      className={className}
      isOpen={dropdownOpen}
      onToggle={setDropdownOpen}
      align="right"
    >
      <div
        id="language-menu"
        role="none"
        className="py-1"
        onKeyDown={e => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            setDropdownOpen(false);
          }
        }}
      >
        {languageList?.map((language, index) => {
          const url = buildLanguageUrl(language.key);
          const isFirst = index === 0;
          const isLast = index === (languageList?.length || 0) - 1;

          const getRoundedClasses = (first: boolean, last: boolean): string => {
            if (first && last) return 'rounded-md';
            if (first) return 'rounded-t-md';
            if (last) return 'rounded-b-md';
            return '';
          };

          const roundedClasses = getRoundedClasses(isFirst, isLast);

          return (
            <li key={String(language._id ?? language.key)} role="none">
              <a
                href={url}
                role="menuitem"
                className={`header-bar-panel-item block px-3 py-2 text-xs font-medium transition-colors ${roundedClasses} ${
                  locale === language.key ? 'header-bar-panel-item-active' : ''
                }`}
                tabIndex={dropdownOpen ? 0 : -1}
              >
                {language.localized_label || language.label}
              </a>
            </li>
          );
        })}
        <NeedAuthorization roles={['admin']}>
          <li role="none">
            <button
              role="menuitem"
              className={[
                'header-bar-panel-item flex w-full items-center gap-2 rounded-b-md px-3 py-2 text-left text-xs font-medium transition-colors',
                inlineEditState.inlineEdit ? 'header-bar-panel-item-active' : '',
              ].join(' ')}
              type="button"
              onClick={handleLiveTranslateToggle}
              tabIndex={dropdownOpen ? 0 : -1}
            >
              <LanguageIcon className="h-3.5 w-3.5" />
              <Translate>Live translate</Translate>
            </button>
          </li>
        </NeedAuthorization>
      </div>
    </BaseDropdown>
  );
};
