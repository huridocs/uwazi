import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from 'UI';
import { NeedAuthorization } from 'app/Auth';
import { actions } from 'app/I18N';
import { DropdownList } from 'app/Forms';

const listItem = (item, i18nmode) => {
  if (!item.type) {
    return <span>{item.label}</span>;
  }
  return (
    <NeedAuthorization roles={['admin', 'editor']}>
      <div className="live-translate">
        <Icon icon="circle" className={i18nmode ? 'live-on' : 'live-off'} />
        <span>{item.label}</span>
      </div>
    </NeedAuthorization>
  );
};

class I18NMenu extends Component {
  static reload(url) {
    window.location.href = url;
  }

  render() {
    const { languages: languageMap, locale, location, i18nmode, toggleInlineEdit } = this.props;
    const languages = languageMap.toJS();
    const selectedLanguage =
      languages.find(lang => lang.key === locale) || languages.find(lang => lang.default);
    languages.push({ label: 'Live translate', key: 'livetranslate', type: 'livetranslate' });

    if (location.search.match(/page=/)) {
      const cleanSearch = location.search.split(/page=\d+|&page=\d+/).join('');
      location.search = cleanSearch === '?' ? '' : cleanSearch;
    }

    const regexp = new RegExp(`^/?${locale}/|^/?${locale}$`);
    const path = location.pathname.replace(regexp, '/');

    return (
      <ul className="menuNav-I18NMenu" role="navigation" aria-label="Languages">
        <DropdownList
          data={languages}
          defaultValue={selectedLanguage}
          textField="label"
          onChange={selected => {
            if (selected.type === 'livetranslate') {
              toggleInlineEdit();
            } else {
              const url = `/${selected.key}${path}${path.match('document') ? '' : location.search}`;
              I18NMenu.reload(url);
            }
          }}
          className="menuNav-language"
          itemComponent={({ item }) => listItem(item, i18nmode)}
          valueComponent={({ item }) => listItem(item, i18nmode)}
        />
      </ul>
    );
  }
}

I18NMenu.defaultProps = {
  locale: null,
};

I18NMenu.propTypes = {
  location: PropTypes.instanceOf(Object).isRequired,
  languages: PropTypes.instanceOf(Object).isRequired,
  toggleInlineEdit: PropTypes.func.isRequired,
  i18nmode: PropTypes.bool.isRequired,
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
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(I18NMenu));
