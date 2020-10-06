import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Icon } from 'UI';
import { NeedAuthorization } from 'app/Auth';
import { actions } from 'app/I18N';

class I18NMenu extends Component {
  static reload(url) {
    window.location.href = url;
  }

  render() {
    const { languages, locale, location, i18nmode, toggleInlineEdit } = this.props;

    let path = location.pathname;
    const regexp = new RegExp(`^/?${locale}/|^/?${locale}$`);
    path = path.replace(regexp, '/');

    return (
      <ul className="menuNav-I18NMenu">
        <NeedAuthorization roles={['admin', 'editor']}>
          <button
            className={`menuNav-btn btn btn-default${i18nmode ? ' inlineEdit active' : ''}`}
            type="button"
            onClick={toggleInlineEdit}
          >
            <Icon icon="language" size="lg" />
          </button>
        </NeedAuthorization>
        {languages.count() > 1 &&
          languages.map(lang => {
            const key = lang.get('key');
            const url = `/${key}${path}${path.match('document') ? '' : location.search}`;
            return (
              <li className={`menuNav-item${locale === key ? ' is-active' : ''}`} key={key}>
                <a className="menuNav-btn btn btn-default" href={url}>
                  {key}
                </a>
              </li>
            );
          })}
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

export function mapStateToProps(state) {
  return {
    languages: state.settings.collection.get('languages'),
    i18nmode: state.inlineEdit.get('inlineEdit'),
    locale: state.locale,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ toggleInlineEdit: actions.toggleInlineEdit }, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(I18NMenu));
