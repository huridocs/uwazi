import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import api from 'app/utils/api';

import ActivitylogForm from './components/ActivitylogForm';
import ActivitylogList from './components/ActivitylogList';

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
        <ActivitylogForm />
        <ActivitylogList />
      </div>
    );
  }
}

export default ActivityLog;
