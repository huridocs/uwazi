/* eslint-disable react-hooks/rules-of-hooks */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Location, useLocation } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { IImmutable } from 'shared/types/Immutable';
import { LanguagesListSchema } from 'shared/types/commonTypes';
import { Icon } from 'UI';
import { actions, Translate, t } from 'app/I18N';
import { IStore } from 'app/istore';
import { NeedAuthorization } from 'app/Auth';
import { useOnClickOutsideElement } from 'app/utils/useOnClickOutsideElementHook';
import { inlineEditAtom } from 'V2/atoms';

const locationSearch = (location: Location) => {
  const cleanSearch = location.search.split(/page=\d+|&page=\d+/).join('');
  return cleanSearch === '?' ? '' : cleanSearch;
};

const prepareValues = (
  languageMap: IImmutable<LanguagesListSchema>,
  locale: string,
  location: Location
) => {
  const languages: LanguagesListSchema = languageMap.toJS();

  const selectedLanguage =
    languages.find(lang => lang.key === locale) || languages.find(lang => lang.default);

  const urlLocation = { ...location };

  const path = urlLocation.pathname.replace(new RegExp(`^/?${locale}/|^/?${locale}$`), '/');

  if (location.search.match(/page=/)) {
    urlLocation.search = locationSearch(location);
  }

  return { languages, selectedLanguage, urlLocation, path };
};

const mapStateToProps = (state: IStore) => ({
  languages: state.settings.collection.get('languages'),
  i18nmode: state.inlineEdit.get('inlineEdit'),
  locale: state.locale,
  user: state.user,
});

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators({ toggleInlineEdit: actions.toggleInlineEdit }, dispatch);

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;

const i18NMenuComponent = ({ languages: languageMap, i18nmode, user, locale }: mappedProps) => {
  const [inlineEditState, setInlineEditState] = useRecoilState(inlineEditAtom);

  if (!languageMap || languageMap.size < 1 || (languageMap!.size <= 1 && !user.get('_id'))) {
    return <div className="no-i18nmenu" />;
  }

  const location = useLocation();

  const menuRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { languages, selectedLanguage, path, urlLocation } = prepareValues(
    languageMap!,
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
      className={languageMap!.size === 1 ? 'menuNav-I18NMenu one-language' : 'menuNav-I18NMenu'}
      aria-label="Languages"
      ref={menuRef}
    >
      {i18nmode && (
        <NeedAuthorization roles={['admin', 'editor']}>
          <div className="menuNav-language">
            <button
              className="singleItem"
              type="button"
              onClick={() => setInlineEditState({ inlineEdit: false })}
              aria-label={t('System', 'Turn off inline translation', null, false)}
            >
              <div className="live-translate">
                <Icon icon="circle" className={i18nmode ? 'live-on' : 'live-off'} />
              </div>
            </button>
            <span className="singleItem">
              <Translate>Live translate</Translate>
            </span>
          </div>
        </NeedAuthorization>
      )}

      {!i18nmode && (
        <div className="menuNav-language">
          <button
            className="singleItem dropdown"
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span>{selectedLanguage?.localized_label}</span>
            &nbsp;
            <Icon icon={dropdownOpen ? 'caret-up' : 'caret-down'} />
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
                    setInlineEditState({ inlineEdit: !inlineEditState.inlineEdit });
                    setDropdownOpen(false);
                  }}
                >
                  <Icon icon="circle" className={i18nmode ? 'live-on' : 'live-off'} />
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

const container = connector(i18NMenuComponent);

export { container as i18NMenuComponent };
