import React, { Component } from 'react'
import { Link } from 'react-router'

class Menu extends Component {

  render = () => {
    return (
      <ul className={this.props.className}>
        <li><Link to='/'><span>Home</span></Link></li>
        <li><Link to='/library'><span>Library</span></Link></li>
        {(() => {
          if(this.props.user){
            return    [<li><Link to='/template'>Metadata</Link></li>,
                      <li><Link to='/uploads'><span>Uploads</span></Link></li>,
                      <li><Link to='/my_account'> {this.props.user.username}</Link></li>]
          }
          else {
            return [<li><Link to='/login'>Login</Link></li>]
          }
        })()}
      </ul>
    )
  };
}

export default Menu;
