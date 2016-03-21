import React from 'react';
import RouteHandler from '../RouteHandler';

class TestController extends RouteHandler {

  static emptyState() {
    return {message: 'requesting data'};
  }

  static requestState() {
    return Promise.resolve({initialData: 'data'});
  }

  render() {
    return <div></div>;
  }
}

export default TestController;
