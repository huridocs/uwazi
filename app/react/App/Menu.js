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
    const user = this.props.user.toJS();
    return (
      <ul onClick={this.props.onClick} className={this.props.className}>
        <li><a onClick={this.goToLibrary.bind(this)} className="btn"><i className="fa fa-th"></i>Library</a></li>
        <NeedAuthorization>
          <li><Link to='/uploads' className="btn"><span><i className="fa fa-cloud-upload"></i>Uploads</span></Link></li>
        </NeedAuthorization>
        <NeedAuthorization>
          <li><Link to='/settings/account' className="btn"><i className="fa fa-cog"></i>Settings</Link></li>
        </NeedAuthorization>
        {(() => {
          if (!user._id) {
            return <li><Link to='/login' className="btn"><i className="fa fa-power-off"></i>Login</Link></li>;
          }
        })()}
      </ul>
    );
  }
}

Menu.propTypes = {
  user: PropTypes.object,
  search: PropTypes.object,
  className: PropTypes.string,
  onClick: PropTypes.func,
  searchDocuments: PropTypes.func
};

export function mapStateToProps({user, search}) {
  return {user, search};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({searchDocuments}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Menu);
