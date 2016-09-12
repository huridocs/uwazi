import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import {NeedAuthorization} from 'app/Auth';
import {toUrlParams} from 'shared/JSONRequest';

class Menu extends Component {

  render() {
    const user = this.props.user.toJS();
    return (
      <ul onClick={this.props.onClick} className={this.props.className}>
        <li><Link to={'/' + toUrlParams(this.props.search)} className="btn"><i className="fa fa-th"></i>Library</Link></li>
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
  onClick: PropTypes.func
};

export function mapStateToProps({user, search}) {
  return {user, search};
}

export default connect(mapStateToProps)(Menu);
