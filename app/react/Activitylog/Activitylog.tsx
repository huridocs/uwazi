import React from 'react';
import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { Translate } from 'app/I18N';
import { SettingsHeader } from 'app/Settings/components/SettingsHeader';
import ActivitylogForm from './components/ActivitylogForm';
import { ActivitylogList } from './components/ActivitylogList';

export class ActivityLog extends RouteHandler {
  static async requestState(requestParams: RequestParams) {
    const logs = await api.get('activitylog', requestParams);
    return [
      actions.set('activitylog/search', logs.json),
      actions.set('activitylog/list', logs.json.rows),
    ];
  }

  render() {
    return (
      <div className="settings-content without-footer">
        <div className="activity-log panel panel-default">
          <SettingsHeader>
            <Translate>Activity log</Translate>
          </SettingsHeader>
          <ActivitylogForm>
            <ActivitylogList />
          </ActivitylogForm>
        </div>
      </div>
    );
  }
}

export default ActivityLog;
