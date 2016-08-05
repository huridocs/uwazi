import React, {PropTypes} from 'react';
import Helmet from 'react-helmet';
import {connect} from 'react-redux';

import RouteHandler from 'app/App/RouteHandler';
import SettingsNavigation from './components/SettingsNavigation';
import AccountSettings from './components/AccountSettings';
import CollectionSettings from './components/CollectionSettings';
import DocumentTypesList from './components/DocumentTypesList';
import UsersAPI from './UsersAPI';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import RelationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import {actions} from 'app/BasicReducer';

export class Settings extends RouteHandler {

  static requestState() {
    return Promise.all([
      UsersAPI.currentUser(),
      TemplatesAPI.get(),
      ThesaurisAPI.get(),
      RelationTypesAPI.get()
    ])
    .then(([user, templates, thesauris, relationTypes]) => {
      return {user, templates, thesauris, relationTypes};
    });
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('auth/user', state.user));
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
              if (section === 'documentTypes') {
                return <DocumentTypesList/>;
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
