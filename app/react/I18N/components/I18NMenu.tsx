import React, { useState } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { withRouter, WithRouterProps } from 'react-router';
import { IImmutable } from 'shared/types/Immutable';
import { LanguageSchema, LanguagesListSchema } from 'shared/types/commonTypes';
import { UserSchema } from 'shared/types/userType';
import { actions, Translate, t } from 'app/I18N';
import { IStore } from 'app/istore';
import { Icon } from 'UI';

const prepareDropdownValues = (
  languageMap: IImmutable<LanguagesListSchema>,
  locale: string,
  user: IImmutable<UserSchema>
) => {
  const languages: Array<LanguageSchema & { type?: string }> = languageMap.toJS();

  const selectedLanguage =
    languages.find(lang => lang.key === locale) || languages.find(lang => lang.default);

  const loggedUser = user.get('_id') && user.get('role') !== 'collaborator';

  if (loggedUser) {
    languages.push({ label: 'Live translate', key: 'livetranslate', type: 'livetranslate' });
  }

  return { languages, selectedLanguage, loggedUser };
};

const locationSearch = (location: WithRouterProps['location']) => {
  const cleanSearch = location.search.split(/page=\d+|&page=\d+/).join('');
  return cleanSearch === '?' ? '' : cleanSearch;
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
  user,
  i18nmode,
  locale,
  toggleInlineEdit,
}: mappedProps) => {
  if (!languageMap || languageMap.size === 0) {
    return null;
  }

  const [showing, setShowing] = useState(false);

  const { languages, selectedLanguage, loggedUser } = prepareDropdownValues(
    languageMap!,
    locale,
    user
  );

  const urlLocation = location;

  if (location.search.match(/page=/)) {
    urlLocation.search = locationSearch(location);
  }

  const path = location.pathname.replace(new RegExp(`^/?${locale}/|^/?${locale}$`), '/');

  return languageMap!.size > 1 || user.get('_id') ? (
    <div
      className={`menuNav-I18NMenu ${!loggedUser === false ? ' only-language' : null} ${
        languageMap!.size === 1 ? ' one-language' : ' '
      } `}
      role="navigation"
      aria-label="Languages"
    >
      {!i18nmode && (
        <div className="menuNav-language">
          <div className="menuNav-language">
            <button className="singleItem" type="button" onClick={() => setShowing(!showing)}>
              <span>{selectedLanguage?.localized_label}</span>
            </button>
          </div>

          <ul className={`dropdown-menu ${showing ? 'expanded' : ''} `}>
            {languages.map(language => {
              const url = `/${language.key}${path}${path.match('document') ? '' : location.search}`;

              if (!language.type) {
                return (
                  <li key={language._id as string} className="menuNav-item">
                    <a href={url} className="btn menuNav-btn">
                      {language.localized_label || language.label}
                    </a>
                  </li>
                );
              }

              return (
                <button
                  className="live-translate"
                  type="button"
                  onClick={() => {
                    toggleInlineEdit();
                    setShowing(false);
                  }}
                >
                  <Icon icon="circle" className={i18nmode ? 'live-on' : 'live-off'} />
                  <Translate>{language.label}</Translate>
                </button>
              );
            })}
          </ul>
        </div>
      )}

      {i18nmode && (
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
      )}
    </div>
  ) : (
    <div className="no-i18nmenu" />
  );
};

const container = withRouter(connector(i18NMenuComponent));

export { container as i18NMenuComponent };
