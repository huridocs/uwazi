import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from 'UI';
import { actions, Translate, t } from 'app/I18N';

const prepareDropdownValues = (languageMap, locale, user) => {
  const languages = languageMap.toJS();

  const selectedLanguage =
    languages.find(lang => lang.key === locale) || languages.find(lang => lang.default);

  const loggedUser = user.get('_id') && user.get('role') !== 'collaborator';

  if (loggedUser) {
    languages.push({ label: 'Live translate', key: 'livetranslate', type: 'livetranslate' });
  }

  return { languages, selectedLanguage, loggedUser };
};

const locationSearch = location => {
  const cleanSearch = location.search.split(/page=\d+|&page=\d+/).join('');
  return cleanSearch === '?' ? '' : cleanSearch;
};

class I18NMenu extends Component {
  static reload(url) {
    window.location.href = url;
  }

  constructor(props) {
    super(props);
    this.state = { currentLanguage: props.locale, showing: false };
  }

  render() {
    const {
      languages: languageMap,
      locale,
      location,
      i18nmode,
      toggleInlineEdit,
      user,
    } = this.props;

    const { languages, selectedLanguage, loggedUser } = prepareDropdownValues(
      languageMap,
      locale,
      user
    );

    if (location.search.match(/page=/)) {
      location.search = locationSearch(location);
    }

    const path = location.pathname.replace(new RegExp(`^/?${locale}/|^/?${locale}$`), '/');

    if (languageMap.size === 0) {
      return null;
    }

    if (this.state.currentLanguage !== selectedLanguage.key) {
      I18NMenu.reload(path);
    }

    return languageMap.count() > 1 || user.size ? (
      <div
        className={`menuNav-I18NMenu ${!loggedUser === false ? ' only-language' : null} ${
          languageMap.count() === 1 ? ' one-language' : ' '
        } `}
        role="navigation"
        aria-label="Languages"
      >
        {!i18nmode && (
          <div className="menuNav-language">
            <div className="menuNav-language">
              <button
                className="singleItem"
                type="button"
                onClick={() => this.setState(prevState => ({ showing: !prevState.showing }))}
              >
                <span>{selectedLanguage.localized_label}</span>
              </button>
            </div>

            <ul className={`dropdown-menu ${this.state.showing ? 'expanded' : ''} `}>
              {languages.map(language => {
                const url = `/${language.key}${path}${
                  path.match('document') ? '' : location.search
                }`;

                if (!language.type) {
                  return (
                    <li key={language._id} className="menuNav-item">
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
                    onClick={() => toggleInlineEdit()}
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
  }
}

I18NMenu.defaultProps = {
  locale: null,
};

I18NMenu.propTypes = {
  location: PropTypes.instanceOf(Object).isRequired,
  languages: PropTypes.instanceOf(Object).isRequired,
  user: PropTypes.instanceOf(Object).isRequired,
  i18nmode: PropTypes.bool.isRequired,
  toggleInlineEdit: PropTypes.func.isRequired,
  locale: PropTypes.string,
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ toggleInlineEdit: actions.toggleInlineEdit }, dispatch);
}

export function mapStateToProps(state) {
  return {
    languages: state.settings.collection.get('languages'),
    i18nmode: state.inlineEdit.get('inlineEdit'),
    locale: state.locale,
    user: state.user,
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(I18NMenu));
