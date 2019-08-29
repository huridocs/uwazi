import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import api from 'app/utils/api';

import ActivitylogForm from './components/ActivitylogForm';
import ActivitylogList from './components/ActivitylogList';

export class ActivityLog extends RouteHandler {
  static async requestState(requestParams) {
    const logs = await api.get('activitylog', requestParams);
    return [
      actions.set('activitylog', logs.json)
    ];
  }

  render() {
    return (
      <div className="activity-log">
        <ActivitylogForm />
        <ActivitylogList />
      </div>
    );
  }
}

export default ActivityLog;
