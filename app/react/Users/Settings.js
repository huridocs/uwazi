import React, {PropTypes} from 'react';
import Helmet from 'react-helmet';
import {connect} from 'react-redux';

import RouteHandler from 'app/App/RouteHandler';
import SettingsNavigation from './components/SettingsNavigation';
import AccountSettings from './components/AccountSettings';
import CollectionSettings from './components/CollectionSettings';
import UsersAPI from './UsersAPI';
import SettingsAPI from './SettingsAPI';
import {actions} from 'app/BasicReducer';

export class Settings extends RouteHandler {

  static requestState() {
    return Promise.all([
      UsersAPI.currentUser(),
      SettingsAPI.get()
    ])
    .then(([user, settings]) => {
      return {
        users: {
          user,
          settings
        }
      };
    });
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('users/user', state.users.user));
  }

  render() {
    let section = this.props.section;
    return (
      <div className="row admin-content">
        <Helmet title="Settings" />
        <div className="col-xs-12 col-sm-4">
          <SettingsNavigation/>
        </div>
        <div className="col-xs-12 col-sm-8">
          {(()=>{
            if (section === 'account') {
              return <AccountSettings/>;
            }
            if (section === 'collection') {
              return <CollectionSettings/>;
            }
          })()}
        </div>
      </div>
    );
  }
}

Settings.propTypes = {
  section: PropTypes.string
};

export function mapStateToProps(state) {
  return {section: state.users.section};
}

export default connect(mapStateToProps)(Settings);
