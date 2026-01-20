import React from 'react';
import RouteHandler from '#app/App/RouteHandler.jsx';

class TestController extends RouteHandler {
  static requestState() {
    return Promise.resolve({ initialData: 'data' });
  }

  render() {
    return <div />;
  }
}

export default TestController;
