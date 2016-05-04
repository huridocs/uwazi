import React, {Component, PropTypes} from 'react';
import {Link} from 'react-router';

class Menu extends Component {

  render() {
    return (
      <ul className={this.props.className}>
        <li><Link to='/' className="btn"><i className="fa fa-th"></i>Library</Link></li>
        {(() => {
          if (this.props.user) {
            return [
              <li key="0"><Link to='/metadata' className="btn"><i className="fa fa-list-alt"></i>Metadata</Link></li>,
              <li key="1"><Link to='/uploads' className="btn"><span><i className="fa fa-cloud-upload"></i>Uploads</span></Link></li>,
              <li key="2"><Link to='/my_account' className="btn"><i className="fa fa-user"></i> {this.props.user.username}</Link></li>
            ];
          }
          return <li key="3"><Link to='/login' className="btn"><i className="fa fa-power-off"></i>Login</Link></li>;
        })()}
      </ul>
    );
  }
}

Menu.propTypes = {
  user: PropTypes.object,
  className: PropTypes.string
};

export default Menu;
