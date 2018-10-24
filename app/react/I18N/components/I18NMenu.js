import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions } from 'app/I18N';
import utils from '../utils';
import { NeedAuthorization } from 'app/Auth';
import { Icon } from 'UI';

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

  inlineEditButton() {
    return (
      <NeedAuthorization roles={['admin', 'editor']}>
        <button
          className={this.props.i18nmode ? 'inlineEdit menuNav-btn btn btn-default active' : 'menuNav-btn btn btn-default'}
          onClick={this.props.toggleInlineEdit}
        >
          <Icon icon="language" size="lg" />
        </button>
      </NeedAuthorization>
    );
  }

  render() {
    const languages = this.props.languages.toJS();
    let path = this.props.location.pathname;
    const locale = utils.getLocale(path, languages);

    const regexp = new RegExp(`^\/?${locale}\/|^\/?${locale}$`);
    path = path.replace(regexp, '/');

    if (languages.length <= 1) {
      return (
        <ul className="menuNav-I18NMenu">
          {this.inlineEditButton()}
        </ul>
      );
    }

    return (
      <ul className="menuNav-I18NMenu">
        {this.inlineEditButton()}
        {(() => languages.map((lang) => {
            const url = `/${lang.key}${path}${path.match('document') ? '' : this.props.location.search}`;
            return (
              <li className={`menuNav-item${locale === lang.key ? ' is-active' : ''}`} key={lang.key}>
                <a
                  className="menuNav-btn btn btn-default"
                  href={url}
                  onClick={() => {
                  I18NMenu.changeLanguage(lang.key, url);
                }}
                >
                  {lang.key}
                </a>
              </li>
          );
          }))()}
      </ul>
    );
  }
}

I18NMenu.propTypes = {
  location: PropTypes.instanceOf(Object).isRequired,
  languages: PropTypes.instanceOf(Object).isRequired,
  toggleInlineEdit: PropTypes.func.isRequired,
  i18nmode: PropTypes.bool.isRequired
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

export default connect(mapStateToProps, mapDispatchToProps)(I18NMenu);
