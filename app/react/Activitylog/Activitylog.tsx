import React from 'react';
import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { Icon } from 'UI';
import { Translate, I18NLink } from 'app/I18N';
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
          <div className="panel-heading">
            <I18NLink to="settings/" className="only-mobile">
              <Icon icon="arrow-left" directionAware />
              <span className="btn-label">
                <Translate>Back</Translate>
              </span>
            </I18NLink>
            <Translate>Activity log</Translate>
          </div>
          <ActivitylogForm>
            <ActivitylogList />
          </ActivitylogForm>
        </div>
      </div>
    );
  }
}

export default ActivityLog;
