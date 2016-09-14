import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import {NeedAuthorization} from 'app/Auth';
import {searchDocuments} from 'app/Library/actions/libraryActions';
import {bindActionCreators} from 'redux';

class Menu extends Component {

  goToLibrary() {
    this.props.searchDocuments(this.props.search);
  }

  render() {
    const {links} = this.props;
    const user = this.props.user.toJS();

    const navLinks = links.map(link =>
      <li key={link.get('localID')}>
        <Link to={link.get('url') || '/'} className="btn btn-default">{link.get('title')}</Link>
      </li>
    );

    return (
      <ul onClick={this.props.onClick} className={this.props.className}>
        <li className="menuItems">
          <ul>{navLinks}</ul>
        </li>
        <li className="menuActions">
          <ul>
            <li><a onClick={this.goToLibrary.bind(this)} className="btn btn-default"><i className="fa fa-th"></i></a></li>
            <NeedAuthorization>
              <li><Link to='/uploads' className="btn btn-default"><span><i className="fa fa-cloud-upload"></i></span></Link></li>
            </NeedAuthorization>
            <NeedAuthorization>
              <li><Link to='/settings/account' className="btn btn-default"><i className="fa fa-cog"></i></Link></li>
            </NeedAuthorization>
            {(() => {
              if (!user._id) {
                return <li><Link to='/login' className="btn btn-default"><i className="fa fa-power-off"></i></Link></li>;
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
