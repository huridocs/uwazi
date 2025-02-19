/* eslint-disable react/no-multi-comp */
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Location, useLocation } from 'react-router';
import { useAtom, useAtomValue } from 'jotai';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { LanguagesListSchema } from 'shared/types/commonTypes';
import { Translate, t } from 'app/I18N';
import { useOnClickOutsideElement } from 'app/utils/useOnClickOutsideElementHook';
import { NeedAuthorization } from 'V2/Components/UI';
import { inlineEditAtom, localeAtom, settingsAtom, userAtom } from 'V2/atoms';

const locationSearch = (location: Location) => {
  const cleanSearch = location.search.split(/page=\d+|&page=\d+/).join('');
  return cleanSearch === '?' ? '' : cleanSearch;
};

const prepareValues = (languages: LanguagesListSchema, locale: string, location: Location) => {
  const selectedLanguage =
    languages.find(lang => lang.key === locale) || languages.find(lang => lang.default);

  const urlLocation = { ...location };

  const path = urlLocation.pathname.replace(new RegExp(`^/?${locale}/|^/?${locale}$`), '/');

  if (location.search.match(/page=/)) {
    urlLocation.search = locationSearch(location);
  }

  return { languages, selectedLanguage, urlLocation, path };
};

const SVGCircle = ({ fill }: { fill: string }) => (
  <svg height="20" width="20" xmlns="http://www.w3.org/2000/svg">
    <circle r="7" cx="10" cy="10" fill={fill} />
  </svg>
);

// eslint-disable-next-line max-statements
const I18NMenu = () => {
  const [inlineEditState, setInlineEditState] = useAtom(inlineEditAtom);
  const locale = useAtomValue(localeAtom);
  const user = useAtomValue(userAtom);
  const { languages: languageList } = useAtomValue(settingsAtom);

  if (!languageList || languageList.length < 1 || (languageList.length <= 1 && !user?._id)) {
    return <div className="no-i18nmenu" />;
  }

  const location = useLocation();

  const menuRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { languages, selectedLanguage, path, urlLocation } = prepareValues(
    languageList,
    locale,
    location
  );

  useEffect(() => {
    if (locale !== selectedLanguage?.key) {
      window.location.assign(path);
    }
  }, [languages.length]);

  useOnClickOutsideElement<HTMLDivElement>(
    menuRef,
    useCallback(() => {
      setDropdownOpen(false);
    }, [])
  );

  return (
    <li
      className={languageList.length === 1 ? 'menuNav-I18NMenu one-language' : 'menuNav-I18NMenu'}
      aria-label="Languages"
      ref={menuRef}
    >
      {inlineEditState.inlineEdit && (
        <NeedAuthorization roles={['admin', 'editor']}>
          <div className="menuNav-language">
            <button
              className="singleItem"
              type="button"
              onClick={() =>
                setInlineEditState({ inlineEdit: false, translationKey: '', context: '' })
              }
              aria-label={t('System', 'Turn off inline translation', null, false)}
            >
              <div className="live-translate">
                {inlineEditState.inlineEdit ? (
                  <SVGCircle fill="#88eacd" />
                ) : (
                  <SVGCircle fill="#ffe66b" />
                )}
              </div>
            </button>
            <span className="singleItem">
              <Translate>Live translate</Translate>
            </span>
          </div>
        </NeedAuthorization>
      )}

      {!inlineEditState.inlineEdit && (
        <div className="menuNav-language">
          <button
            className="singleItem dropdown"
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span>{selectedLanguage?.localized_label}</span>
            &nbsp;
            {dropdownOpen ? <ChevronUpIcon width={22} /> : <ChevronDownIcon width={22} />}
          </button>

          <ul className={dropdownOpen ? 'dropdown-menu expanded' : 'dropdown-menu'}>
            {languages.map(language => {
              const url = `/${language.key}${path}${
                path.match('document') ? '' : urlLocation.search
              }`;

              return (
                <li
                  key={language._id as string}
                  className={locale === language.key ? 'menuNav-item active' : 'menuNav-item'}
                >
                  <a href={url}>{language.localized_label || language.label}</a>
                </li>
              );
            })}

            <NeedAuthorization roles={['admin', 'editor']}>
              <li className="menuNav-item">
                <button
                  className="live-translate"
                  type="button"
                  onClick={() => {
                    setInlineEditState({
                      inlineEdit: !inlineEditState.inlineEdit,
                      translationKey: '',
                      context: '',
                    });
                    setDropdownOpen(false);
                  }}
                >
                  {inlineEditState.inlineEdit ? (
                    <SVGCircle fill="#88eacd" />
                  ) : (
                    <SVGCircle fill="#ffe66b" />
                  )}
                  <Translate>Live translate</Translate>
                </button>
              </li>
            </NeedAuthorization>
          </ul>
        </div>
      )}
    </li>
  );
};

export { I18NMenu };
