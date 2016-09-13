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
    console.log('EN MENU:', this.props.links);
    const user = this.props.user.toJS();
    return (
      <ul onClick={this.props.onClick} className={this.props.className}>
        <li className="menuItems">
          <ul>
            <li><Link to="/" className="btn btn-default">Item 1</Link></li>
            <li><Link to="/" className="btn btn-default">Item 2</Link></li>
            <li><Link to="/" className="btn btn-default">Item 3</Link></li>
            <li><Link to="/" className="btn btn-default">Item 4</Link></li>
          </ul>
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
