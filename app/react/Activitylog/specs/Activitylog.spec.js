import React from 'react';
import { shallow } from 'enzyme';
import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';
import Activitylog from '../Activitylog.js';

describe('Activitylog', () => {
  let props;
  let component;

  beforeEach(() => {
    backend
    .get(`${APIURL}activitylog`, { body: JSON.stringify([
      { rul: '/api/entities' }
    ]) });
  });

  const render = () => {
    component = shallow(<Activitylog {...props}/>);
  };

  it('should render an ActivitylogForm and ActivitylogList', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should request the activitylog', async () => {
    const state = await Activitylog.requestState();
    expect(state).toEqual({ activitylog: [{ rul: '/api/entities' }] });
  });
});
