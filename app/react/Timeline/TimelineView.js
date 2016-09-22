import React from 'react';
import RouteHandler from 'app/App/RouteHandler';

export class TimelineView extends RouteHandler {

  static requestState(state) {
    console.log('En RS:', state);
    return Promise.resolve();
  }

  setReduxState(state) {
    console.log('EN STS:', state);
    // this.context.store.dispatch(actions.set('page/TimelineView', state.page.TimelineView));
  }

  render() {
    return (
      <div>
        Estoy aquí
      </div>
    );
  }
}

export default TimelineView;
