import React, { Component } from 'react'
import { Link } from 'react-router'

class Menu extends Component {

  render = () => {
    return (
      <ul className={this.props.className}>
        <li><Link to='/'><span>Library</span></Link></li>
        {(() => {
          if(this.props.user){
            return    [<li key="0"><Link to='/template'>Metadata</Link></li>,
                      <li key="1"><Link to='/uploads'><span>Uploads</span></Link></li>,
                      <li key="2"><Link to='/my_account'> {this.props.user.username}</Link></li>]
          }
          else {
            return [<li key="3"><Link to='/login'>Login</Link></li>]
          }
        })()}
      </ul>
    )
  };
}

export default Menu;
