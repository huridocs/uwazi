import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {NeedAuthorization} from 'app/Auth';
import {searchDocuments} from 'app/Library/actions/libraryActions';
import {bindActionCreators} from 'redux';
import {I18NLink, I18NMenu, t} from 'app/I18N';

class Menu extends Component {

  goToLibrary() {
    this.props.searchDocuments(this.props.search);
  }

  render() {
    const {links} = this.props;
    const user = this.props.user.toJS();

    const navLinks = links.map(link =>
      <li key={link.get('localID')}>
        <I18NLink to={link.get('url') || '/'} className="btn btn-default">{t('Menu', link.get('title'))}</I18NLink>
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
              <I18NMenu location={this.props.location}/>
            </li>
            <li className="menuNav-item"><a onClick={this.goToLibrary.bind(this)} className="menuNav-btn btn btn-default"><i className="fa fa-th"></i></a></li>
            <NeedAuthorization>
              <li className="menuNav-item"><I18NLink to='/uploads' className="menuNav-btn btn btn-default"><span><i className="fa fa-cloud-upload"></i></span></I18NLink></li>
            </NeedAuthorization>
            <NeedAuthorization>
              <li className="menuNav-item"><I18NLink to='/settings/account' className="menuNav-btn btn btn-default"><i className="fa fa-cog"></i></I18NLink></li>
            </NeedAuthorization>
            {(() => {
              if (!user._id) {
                return <li className="menuNav-item"><I18NLink to='/login' className="menuNav-btn btn btn-default"><i className="fa fa-power-off"></i></I18NLink></li>;
              }
            })()}
          </ul>
        </li>
      </ul>
    );
  }
}

Menu.propTypes = {
  user: PropTypes.object,
  location: PropTypes.object,
  search: PropTypes.object,
  className: PropTypes.string,
  onClick: PropTypes.func,
  searchDocuments: PropTypes.func,
  links: PropTypes.object
};

export function mapStateToProps({user, search, settings}) {
  return {user, search, links: settings.collection.get('links')};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({searchDocuments}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Menu);
