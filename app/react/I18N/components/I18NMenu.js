import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Icon } from 'UI';
import { NeedAuthorization } from 'app/Auth';
import { actions } from 'app/I18N';

import utils from '../utils';

export class I18NMenu extends Component {
  static reload(url) {
    window.location.href = url;
  }

  static saveCookie(locale) {
    utils.saveLocale(locale);
  }

  static changeLanguage(locale, url) {
    I18NMenu.saveCookie(locale);
    I18NMenu.reload(url);
  }

  constructor(props, context) {
    super(props, context);
    this.state = { open: false };
  }

  toggle() {
    this.setState({ open: !this.state.open });
  }

  render() {
    const languages = this.props.languages.toJS();
    let locale = this.props.language;

    if (!locale || this.props.params.lang) {
      locale = utils.getLocale(this.props.params.lang, languages);
    }

    let path = this.props.location.pathname;
    const regexp = new RegExp(`^/?${locale}/|^/?${locale}$`);
    path = path.replace(regexp, '/');

    return (
      <ul className="menuNav-I18NMenu">
        <NeedAuthorization roles={['admin', 'editor']}>
          <button
            className={this.props.i18nmode ? 'inlineEdit menuNav-btn btn btn-default active' : 'menuNav-btn btn btn-default'}
            onClick={this.props.toggleInlineEdit}
          >
            <Icon icon="language" size="lg" />
          </button>
        </NeedAuthorization>
        {languages.length > 1 && languages.map((lang) => {
          const url = `/${lang.key}${path}${path.match('document') ? '' : this.props.location.search}`;
          return (
            <li className={`menuNav-item${locale === lang.key ? ' is-active' : ''}`} key={lang.key}>
              <a
                className="menuNav-btn btn btn-default"
                href={url}
                onClick={() => {
                  I18NMenu.changeLanguage(lang.key, `/${lang.key}${path}${path.match('document') ? '' : this.props.location.search}`);
                }}
              >
                {lang.key}
              </a>
            </li>
          );
        })}
      </ul>
    );
  }
}

I18NMenu.defaultProps = {
  params: {},
  language: null,
};

I18NMenu.propTypes = {
  location: PropTypes.instanceOf(Object).isRequired,
  languages: PropTypes.instanceOf(Object).isRequired,
  toggleInlineEdit: PropTypes.func.isRequired,
  i18nmode: PropTypes.bool.isRequired,
  language: PropTypes.string,
  params: PropTypes.shape({
    lang: PropTypes.string
  })
};

I18NMenu.contextTypes = {
  router: PropTypes.object
};

export function mapStateToProps(state) {
  return {
    languages: state.settings.collection.get('languages'),
    i18nmode: state.inlineEdit.get('inlineEdit')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ toggleInlineEdit: actions.toggleInlineEdit }, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(I18NMenu));
