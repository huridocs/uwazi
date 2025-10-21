import React, { useRef, useState, useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useLocation } from 'react-router';
import { ChevronDownIcon, ChevronUpIcon, LanguageIcon } from '@heroicons/react/20/solid';
import { LanguagesListSchema } from 'shared/types/commonTypes';
import { useOnClickOutsideElement } from 'app/utils/useOnClickOutsideElementHook';
import { inlineEditAtom, localeAtom, settingsAtom } from 'V2/atoms';
import { Translate } from 'app/I18N';
import { useIsMobile } from 'app/V2/CustomHooks/useIsMobile';
import { NeedAuthorization } from 'V2/Components/UI';

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

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  const handleClickOutside = useCallback(() => {
    setDropdownOpen(false);
  }, []);

  const isTablet = useIsMobile(768);

  useOnClickOutsideElement<HTMLDivElement>(dropdownRef, handleClickOutside);

  const handleMainClick = () => {
    if (inlineEditState.inlineEdit) {
      setInlineEditState({
        inlineEdit: false,
        translationKey: '',
        context: '',
      });
      return;
    }
    setDropdownOpen(!dropdownOpen);
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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={[
          'flex items-center py-2',
          'border-b-2',
          inlineEditState.inlineEdit
            ? 'border-green-700 hover:border-green-700'
            : 'border-transparent hover:border-primary-600',
        ].join(' ')}
      >
        <button
          type="button"
          id="language-menu-button"
          className={[
            'flex items-center gap-1 text-base font-medium transition-colors rounded-sm p-2',
            inlineEditState.inlineEdit
              ? 'bg-green-50 text-green-700'
              : 'text-gray-900 hover:text-primary-600',
          ].join(' ')}
          onClick={handleMainClick}
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
          aria-controls={dropdownOpen ? 'language-menu' : undefined}
          onKeyDown={e => {
            if (e.key === 'ArrowDown' && !dropdownOpen) {
              e.preventDefault();
              setDropdownOpen(true);
            }
          }}
        >
          {inlineEditState.inlineEdit ? (
            <span className="flex items-center gap-1">
              <LanguageIcon className="h-4 w-4" />
              <Translate>Live translate</Translate>
            </span>
          ) : (
            <span className={`${isTablet ? 'uppercase' : ''}`}>
              {isTablet ? selectedLanguage?.key : selectedLanguage?.localized_label}
            </span>
          )}
          {dropdownOpen ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      <ul
        id="language-menu"
        role="menu"
        aria-labelledby="language-menu-button"
        tabIndex={-1}
        className={`${
          dropdownOpen
            ? 'absolute top-full left-0 mt-1 min-w-max bg-white border border-gray-200 rounded-md shadow-lg z-50'
            : 'absolute left-[-9999px] top-0 w-0 h-0 overflow-hidden'
        }`}
        aria-hidden={!dropdownOpen}
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
            <li key={language._id as string} role="none">
              <a
                href={url}
                role="menuitem"
                className={`block px-4 py-2 text-sm transition-colors duration-200 hover:bg-gray-100 ${roundedClasses} ${
                  locale === language.key ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                }`}
                tabIndex={dropdownOpen ? 0 : -1}
              >
                {language.localized_label || language.label}
              </a>
            </li>
          );
        })}
        <NeedAuthorization roles={['admin', 'editor']}>
          <li role="none">
            <button
              role="menuitem"
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors duration-200 
                hover:bg-gray-100 rounded-b-md ${
                  inlineEditState.inlineEdit
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                }`}
              type="button"
              onClick={handleLiveTranslateToggle}
              tabIndex={dropdownOpen ? 0 : -1}
            >
              <LanguageIcon className="h-4 w-4" />
              <Translate>Live translate</Translate>
            </button>
          </li>
        </NeedAuthorization>
      </ul>
    </div>
  );
};
