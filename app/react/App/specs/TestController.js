import React from 'react';
import RouteHandler from '../RouteHandler';

class TestController extends RouteHandler {
  static requestState() {
    return Promise.resolve({ initialData: 'data' });
  }

  render() {
    return <div />;
  }
}

export default TestController;
