import React, { useCallback, useRef, useState } from 'react';
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

const prepareLanguageValues = (languageMap: IImmutable<LanguagesListSchema>, locale: string) => {
  const languages: LanguagesListSchema = languageMap.toJS();

  const selectedLanguage =
    languages.find(lang => lang.key === locale) || languages.find(lang => lang.default);

  return { languages, selectedLanguage };
};

const locationSearch = (location: WithRouterProps['location']) => {
  const cleanSearch = location.search.split(/page=\d+|&page=\d+/).join('');
  return cleanSearch === '?' ? '' : cleanSearch;
};

const mapStateToProps = (state: IStore) => ({
  languages: state.settings.collection.get('languages'),
  i18nmode: state.inlineEdit.get('inlineEdit'),
  locale: state.locale,
});

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators({ toggleInlineEdit: actions.toggleInlineEdit }, dispatch);

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector> & WithRouterProps;

const getDropDownList = (
  languages: LanguagesListSchema,
  urlLocation: WithRouterProps['location'],
  locale: string
) =>
  languages.map(language => {
    const path = urlLocation.pathname.replace(new RegExp(`^/?${locale}/|^/?${locale}$`), '/');
    const url = `/${language.key}${path}${path.match('document') ? '' : urlLocation.search}`;

    return (
      <li key={language._id as string} className="menuNav-item">
        <a href={url} className="btn menuNav-btn">
          {language.localized_label || language.label}
        </a>
      </li>
    );
  });

const i18NMenuComponent = ({
  location,
  languages: languageMap,
  i18nmode,
  locale,
  toggleInlineEdit,
}: mappedProps) => {
  if (!languageMap || languageMap!.size < 1) {
    return <div className="no-i18nmenu" />;
  }

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef(null);
  const urlLocation = location;
  const { languages, selectedLanguage } = prepareLanguageValues(languageMap!, locale);

  useOnClickOutsideElement<HTMLDivElement>(
    menuRef,
    useCallback(() => {
      setDropdownOpen(false);
    }, [])
  );

  if (location.search.match(/page=/)) {
    urlLocation.search = locationSearch(location);
  }

  return (
    <div
      className={`menuNav-I18NMenu ${languageMap!.size === 1 ? 'one-language' : null}`}
      role="navigation"
      aria-label="Languages"
      ref={menuRef}
    >
      {i18nmode ? (
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
      ) : (
        <div className="menuNav-language">
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
          </div>

          <ul className={`dropdown-menu ${dropdownOpen ? 'expanded' : ''} `}>
            {getDropDownList(languages, urlLocation, locale)}

            <NeedAuthorization roles={['admin', 'editor']}>
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
            </NeedAuthorization>
          </ul>
        </div>
      )}
    </div>
  );
};

const container = withRouter(connector(i18NMenuComponent));

export { container as i18NMenuComponent };
