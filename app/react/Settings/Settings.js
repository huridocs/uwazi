import React from 'react';
import Helmet from 'react-helmet';

import RouteHandler from 'app/App/RouteHandler';
import SettingsNavigation from './components/SettingsNavigation';
import UsersAPI from 'app/Users/UsersAPI';
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
      ThesaurisAPI.getDictionaries(),
      RelationTypesAPI.get()
    ])
    .then(([user, templates, thesauris, dictionaries, relationTypes]) => {
      return {user, templates, thesauris, dictionaries, relationTypes};
    });
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('auth/user', state.user));
    this.context.store.dispatch(actions.set('templates', state.templates));
    this.context.store.dispatch(actions.set('thesauris', state.thesauris));
    this.context.store.dispatch(actions.set('dictionaries', state.dictionaries));
    this.context.store.dispatch(actions.set('relationTypes', state.relationTypes));
  }

  render() {
    return (
        <div className="row admin-content">
          <Helmet title="Settings" />
          <div className="col-xs-12 col-sm-4">
            <SettingsNavigation/>
          </div>
          <div className="col-xs-12 col-sm-8">
            {this.props.children}
          </div>
        </div>
    );
  }
}

export default Settings;
