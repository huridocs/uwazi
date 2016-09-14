import React, {Component} from 'react';
import {Link} from 'react-router';

export class SettingsNavigation extends Component {

  render() {
    return <div>
    <div className="panel panel-default">
      <div className="panel-heading">Settings</div>
        <div className="list-group">
          <Link to='/settings/account' activeClassName="active" className="list-group-item">Account</Link>
          <Link to='/settings/collection' activeClassName="active" className="list-group-item">Collection</Link>
          <Link to='/settings/navlinks' activeClassName="active" className="list-group-item">Menu</Link>
          <Link to='/settings/pages' activeClassName="active" className="list-group-item">Pages</Link>
        </div>
      </div>
      <div className="panel panel-default">
        <div className="panel-heading">Metadata</div>
        <div className="list-group">
          <Link to='/settings/documents' activeClassName="active" className="list-group-item">Documents</Link>
          <Link to='/settings/connections' activeClassName="active" className="list-group-item">Connections</Link>
          <Link to='/settings/dictionaries' activeClassName="active" className="list-group-item">Dictionaries</Link>
          <Link to='/settings/entities' activeClassName="active" className="list-group-item">Entities</Link>
        </div>
      </div>
    </div>;
  }
}

export default SettingsNavigation;
