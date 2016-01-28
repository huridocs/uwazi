import React, { Component } from 'react'
import { Link } from 'react-router'

class Menu extends Component {

  render = () => {
    return (
      <ul className={this.props.className}>
        <li><Link to='/'><i className="fa fa-home"></i> <span>Home</span></Link></li>
        <li><Link to='/template'><i className="fa fa-tag"></i> <span>Metadata</span> templates</Link></li>
        <li><Link to='/library'><i className="fa fa-book"></i> <span>Library</span></Link></li>
        <li><Link to='/uploads'><i className="fa fa-cloud-upload"></i> <span>Uploads</span></Link></li>
      </ul>
    )
  };
}

export default Menu;
