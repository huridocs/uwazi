import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';

export class I18NMenu extends Component {

  constructor(props) {
    super(props);
    this.state = {open: false};
  }

  toggle() {
    this.setState({open: !this.state.open});
  }

  render() {
    const languages = this.props.languages.toJS();
    let path = this.props.location.pathname;
    let language;

    languages.forEach((lang) => {
      let regexp = new RegExp(`^\/?${lang.key}\/|^\/?${lang.key}$`);

      if (path.match(regexp)) {
        language = path.match(regexp)[0].replace(/\//g, '');
      }

      path = path.replace(regexp, '/');
    });

    if (!language) {
      language = languages.find((lang) => lang.default).key;
    }

    return (
      <div className={this.state.open ? 'Dropdown is-active': 'Dropdown'} onClick={this.toggle.bind(this)}>
        <ul className="Dropdown-list language">
          {(() => {
            return languages.map((lang) => {
              return <li className={'Dropdown-option' + (language === lang.key ? ' is-active' : '')} key={lang.key}>
                      <Link activeClass='is-active' to={`/${lang.key}${path}${this.props.location.search}`} >{lang.key}</Link>
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
