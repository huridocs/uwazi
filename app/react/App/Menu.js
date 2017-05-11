import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {NeedAuthorization} from 'app/Auth';
import {toUrlParams} from '../../shared/JSONRequest';
import {I18NLink, I18NMenu, t} from 'app/I18N';
import {processFilters} from 'app/Library/actions/libraryActions';

class Menu extends Component {

  libraryUrl() {
    const params = processFilters(this.props.librarySearch, this.props.libraryFilters.toJS());
    return '/library/' + toUrlParams(params);
  }

  uploadsUrl() {
    const params = processFilters(this.props.uploadsSearch, this.props.uploadsFilters.toJS());
    return '/uploads/' + toUrlParams(params);
  }

  render() {
    const {links} = this.props;
    const user = this.props.user.toJS();

    const navLinks = links.map(link =>
      <li key={link.get('_id')} className="menuNav-item">
        <I18NLink to={link.get('url') || '/'} className="btn menuNav-btn">{t('Menu', link.get('title'))}</I18NLink>
      </li>
    );

    return (
      <ul onClick={this.props.onClick} className={this.props.className}>
        <li className="menuItems">
          <ul className="menuNav-list">{navLinks}</ul>
        </li>
        <li className="menuActions">
          <ul className="menuNav-list">
            <li className="menuNav-item">
              <I18NLink to={this.libraryUrl()} className="menuNav-btn btn btn-default">
                  <i className="fa fa-th"></i>
              </I18NLink>
            </li>
            <NeedAuthorization roles={['admin', 'editor']}>
              <li className="menuNav-item">
                <I18NLink to={this.uploadsUrl()} className="menuNav-btn btn btn-default">
                  <span><i className="fa fa-cloud-upload"></i></span>
                </I18NLink>
              </li>
            </NeedAuthorization>
            <NeedAuthorization roles={['admin', 'editor']}>
              <li className="menuNav-item">
                <I18NLink to='/settings/account' className="menuNav-btn btn btn-default">
                  <i className="fa fa-cog"></i>
                </I18NLink>
              </li>
            </NeedAuthorization>
            {(() => {
              if (!user._id) {
                return (
                  <li className="menuNav-item">
                    <I18NLink to='/login' className="menuNav-btn btn btn-default">
                      <i className="fa fa-power-off"></i>
                    </I18NLink>
                  </li>
                );
              }
            })()}
          </ul>
          <I18NMenu location={this.props.location}/>
        </li>
      </ul>
    );
  }
}

Menu.propTypes = {
  user: PropTypes.object,
  location: PropTypes.object,
  librarySearch: PropTypes.object,
  libraryFilters: PropTypes.object,
  uploadsSearch: PropTypes.object,
  uploadsFilters: PropTypes.object,
  className: PropTypes.string,
  onClick: PropTypes.func,
  links: PropTypes.object
};

export function mapStateToProps({user, settings, library, uploads}) {
  return {
    user,
    librarySearch: library.search,
    libraryFilters: library.filters,
    uploadsSearch: uploads.search,
    uploadsFilters: uploads.filters,
    links: settings.collection.get('links')};
}

export default connect(mapStateToProps)(Menu);
