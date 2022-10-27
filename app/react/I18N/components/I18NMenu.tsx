import React, { useCallback, useEffect, useRef, useState } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { withRouter, WithRouterProps } from 'react-router';
import { IImmutable } from 'shared/types/Immutable';
import { LanguagesListSchema } from 'shared/types/commonTypes';
import { Icon } from 'UI';
import { actions, Translate, t } from 'app/I18N';
import { IStore } from 'app/istore';
import { NeedAuthorization } from 'app/Auth';
import { useOnClickOutsideElement } from 'app/utils/useOnClickOutsideElementHook';

const locationSearch = (location: WithRouterProps['location']) => {
  const cleanSearch = location.search.split(/page=\d+|&page=\d+/).join('');
  return cleanSearch === '?' ? '' : cleanSearch;
};

const prepareValues = (
  languageMap: IImmutable<LanguagesListSchema>,
  locale: string,
  location: WithRouterProps['location']
) => {
  const languages: LanguagesListSchema = languageMap.toJS();

  const selectedLanguage =
    languages.find(lang => lang.key === locale) || languages.find(lang => lang.default);

  const urlLocation = location;

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

type mappedProps = ConnectedProps<typeof connector> & WithRouterProps;

const i18NMenuComponent = ({
  location,
  languages: languageMap,
  i18nmode,
  user,
  locale,
  toggleInlineEdit,
}: mappedProps) => {
  if (!languageMap || languageMap.size < 1 || (languageMap!.size <= 1 && !user.get('_id'))) {
    return <div className="no-i18nmenu" />;
  }

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
    <div
      className={languageMap!.size === 1 ? 'menuNav-I18NMenu one-language' : 'menuNav-I18NMenu'}
      role="navigation"
      aria-label="Languages"
      ref={menuRef}
    >
      {i18nmode && (
        <NeedAuthorization roles={['admin', 'editor']}>
          <div className="menuNav-language">
            <button
              className="singleItem"
              type="button"
              onClick={toggleInlineEdit}
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
                    toggleInlineEdit();
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
    </div>
  );
};

const container = withRouter(connector(i18NMenuComponent));

export { container as i18NMenuComponent };
