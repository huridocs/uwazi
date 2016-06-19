import React, {PropTypes, Component} from 'react';
import Helmet from 'react-helmet';
import {connect} from 'react-redux';

import SettingsNavigation from './components/SettingsNavigation';
import AccountSettings from './components/AccountSettings';
import CollectionSettings from './components/CollectionSettings';

export class Settings extends Component {

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
