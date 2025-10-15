import React, { useRef, useState, useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { ChevronDownIcon, ChevronUpIcon, LanguageIcon } from '@heroicons/react/20/solid';
import { LanguagesListSchema } from 'shared/types/commonTypes';
import { useOnClickOutsideElement } from 'app/utils/useOnClickOutsideElementHook';
import { inlineEditAtom, localeAtom, settingsAtom } from 'V2/atoms';
import { Translate } from 'app/I18N';
import { useIsMobile } from 'app/V2/CustomHooks/useIsMobile';

interface LanguageDropdownProps {
  className?: string;
}

const getSelectedLanguage = (locale: string, languages?: LanguagesListSchema) =>
  languages?.find(lang => lang.key === locale) || languages?.find(lang => lang.default);

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ className = '' }) => {
  const [inlineEditState, setInlineEditState] = useAtom(inlineEditAtom);
  const locale = useAtomValue(localeAtom);
  const { languages: languageList } = useAtomValue(settingsAtom);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedLanguage = getSelectedLanguage(locale, languageList);

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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        id="language-menu-button"
        className={[
          'flex items-center gap-1 py-4 px-2 text-base font-medium transition-colors',
          'border-b-2 border-transparent',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
          inlineEditState.inlineEdit
            ? 'bg-green-50 text-green-700 border-green-700 hover:border-green-700'
            : 'text-gray-900 hover:text-primary-600 hover:border-primary-600',
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
          <ChevronUpIcon className="h-3 w-3" />
        ) : (
          <ChevronDownIcon className="h-3 w-3" />
        )}
      </button>

      {dropdownOpen && (
        <div
          id="language-menu"
          role="menu"
          aria-labelledby="language-menu-button"
          tabIndex={-1}
          className="absolute top-full left-0 mt-1 min-w-max bg-white border border-gray-200 shadow-lg z-50"
          onKeyDown={e => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              setDropdownOpen(false);
            }
          }}
        >
          <div className="py-1">
            {languageList?.map(language => {
              const url = `/${language.key}`;

              return (
                <a
                  key={language._id as string}
                  href={url}
                  role="menuitem"
                  className={`block px-4 py-2 text-sm transition-colors duration-200 hover:bg-gray-100 ${
                    locale === language.key ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                  }`}
                >
                  {language.localized_label || language.label}
                </a>
              );
            })}

            <button
              role="menuitem"
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors duration-200 hover:bg-gray-100 ${
                inlineEditState.inlineEdit
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
              }`}
              type="button"
              onClick={handleLiveTranslateToggle}
            >
              <LanguageIcon className="h-4 w-4" />
              <Translate>Live translate</Translate>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
