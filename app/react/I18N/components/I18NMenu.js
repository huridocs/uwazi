import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from 'UI';
import { actions, Translate, t } from 'app/I18N';

import { DropdownList } from 'app/Forms';

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

const listItem = (item, i18nmode) => {
  if (!item.type) {
    return <span>{item.localized_label || item.label}</span>;
  }

  return (
    <div className="live-translate">
      <Icon icon="circle" className={i18nmode ? 'live-on' : 'live-off'} />
      <Translate>{item.label}</Translate>
    </div>
  );
};
class I18NMenu extends Component {
  static reload(url) {
    window.location.href = url;
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
      const cleanSearch = location.search.split(/page=\d+|&page=\d+/).join('');
      location.search = cleanSearch === '?' ? '' : cleanSearch;
    }

    const regexp = new RegExp(`^/?${locale}/|^/?${locale}$`);
    const path = location.pathname.replace(regexp, '/');

    if (languageMap.size === 0) {
      return null;
    }
    return languageMap.count() > 1 || user.size ? (
      <div
        className={`menuNav-I18NMenu ${!loggedUser === false ? ' only-language' : ' '} ${
          languageMap.count() === 1 ? ' one-language' : ' '
        } `}
        role="navigation"
        aria-label="Languages"
      >
        {!i18nmode && (
          <DropdownList
            data={languages}
            id="key"
            defaultValue={selectedLanguage}
            textField="localized_label"
            className="menuNav-language"
            itemComponent={({ item }) => listItem(item)}
            valueField="key"
            valueComponent={({ item }) => listItem(item)}
            onSelect={selected => {
              if (selected.type === 'livetranslate') {
                toggleInlineEdit();
              } else {
                const url = `/${selected.key}${path}${
                  path.match('document') ? '' : location.search
                }`;
                I18NMenu.reload(url);
              }
            }}
          />
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
