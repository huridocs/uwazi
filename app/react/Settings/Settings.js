import React from 'react';
import { Helmet } from 'react-helmet';
import { Outlet } from 'react-router';
import { withOutlet, withRouter } from 'app/componentWrappers';
import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import { I18NApi, t } from 'app/I18N';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import UsersAPI from 'app/Users/UsersAPI';
import { UserRole } from 'shared/types/userSchema';

import { SettingsNavigation } from './components/SettingsNavigation';
import SettingsAPI from './SettingsAPI';

class SettingsComponent extends RouteHandler {
  static async requestState(requestParams) {
    const request = requestParams.onlyHeaders();
    const [user, thesauri, translations, collection] = await Promise.all([
      UsersAPI.currentUser(request),
      ThesauriAPI.getThesauri(request),
      I18NApi.get(request),
      SettingsAPI.get(request),
    ]);

    const stats = user.role === UserRole.ADMIN ? await SettingsAPI.stats(request) : {};

    return [
      actions.set('auth/user', user),
      actions.set('dictionaries', thesauri),
      actions.set('translations', translations),
      actions.set('settings/collection', collection),
      actions.set('settings/stats', stats),
    ];
  }

  render() {
    const isSettingsParentRoute = !this.props.outlet;
    return (
      <div className="row settings">
        <Helmet>
          <title>{t('System', 'Settings', null, false)}</title>
        </Helmet>
        <div className={`settings-navigation ${isSettingsParentRoute ? '' : 'only-desktop'}`}>
          <SettingsNavigation />
        </div>
        <Outlet />
      </div>
    );
  }
}

const Settings = withRouter(withOutlet(SettingsComponent));

export { Settings, SettingsComponent };
