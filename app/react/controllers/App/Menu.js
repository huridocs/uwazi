import React, {Component, PropTypes} from 'react';
import {Link} from 'react-router';

class Menu extends Component {

  render() {
    return (
      <ul className={this.props.className}>
        <li><a href='/' className="btn btn-default"><i className="fa fa-th"></i>Library</a></li>
        {(() => {
          if (this.props.user) {
            return    [
                      <li key="0"><a href='/template' className="btn btn-default"><i className="fa fa-list-alt"></i>Metadata</a></li>,
                      <li key="1"><a href='/uploads' className="btn btn-default"><span><i className="fa fa-cloud-upload"></i>Uploads</span></a></li>,
                      <li key="2"><a href='/my_account' className="btn btn-success"><i className="fa fa-user"></i> {this.props.user.username}</a></li>
                    ]
          }
          else {
            return [<li key="3"><Link to='/login' className="btn btn-success"><i className="fa fa-power-off"></i>Login</Link></li>]
          }
          return [<li key="3"><Link to='/login'>Login</Link></li>];
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
