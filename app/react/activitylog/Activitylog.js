import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import api from 'app/utils/api';

import ActivityLogForm from './components/ActivityLogForm';
import ActivityLogList from './components/ActivityLogList';

export class ActivityLog extends RouteHandler {
  static requestState() {
    return api.get('activitylog')
    .then(response => ({ activitylog: response.json }));
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('activitylog', state.activitylog));
  }

  render() {
    return (
      <div className="activity-log">
        <ActivityLogForm />
        <ActivityLogList />
      </div>
    );
  }
}

export default ActivityLog;
