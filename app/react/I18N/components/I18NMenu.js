import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import utils from '../utils';

export class I18NMenu extends Component {

  constructor(props) {
    super(props);
    this.state = {open: false};
  }

  toggle() {
    this.setState({open: !this.state.open});
  }

  changeLanguage(locale) {
    utils.saveLocale(locale);
  }

  render() {
    const languages = this.props.languages.toJS();
    let path = this.props.location.pathname;
    let locale = utils.getUrlLocale(path, languages);

    if (locale) {
      let regexp = new RegExp(`^\/?${locale}\/|^\/?${locale}$`);
      path = path.replace(regexp, '/');
    }

    if (!locale) {
      locale = utils.getDefaultLocale(languages);
    }

    return (
      <div className={this.state.open ? 'Dropdown is-active' : 'Dropdown'} onClick={this.toggle.bind(this)}>
        <ul className="Dropdown-list language">
          {(() => {
            return languages.map((lang) => {
              return <li className={'Dropdown-option' + (locale === lang.key ? ' is-active' : '')} key={lang.key}>
                      <Link
                        activeClass='is-active'
                        onClick={this.changeLanguage.bind(this, lang.key)}
                        to={`/${lang.key}${path}${this.props.location.search}`}
                      >
                        {lang.key}
                      </Link>
                     </li>;
            });
          })()}
        </ul>
        <span className="Dropdown-label">
          <i className="fa fa-caret-down"></i>
        </span>
      </div>
    );
  }
}

I18NMenu.propTypes = {
  languages: PropTypes.object,
  location: PropTypes.object
};

export function mapStateToProps({settings}) {
  return {
    languages: settings.collection.get('languages')
  };
}

export default connect(mapStateToProps)(I18NMenu);
