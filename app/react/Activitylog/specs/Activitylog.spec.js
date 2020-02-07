import React from 'react';
import { shallow } from 'enzyme';
import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';
import Activitylog from '../Activitylog.js';

describe('Activitylog', () => {
  let component;
  let context;
  let props;

  beforeEach(() => {
    context = { store: { getState: () => ({}) } };
    backend.restore();
    backend.get(`${APIURL}activitylog`, { body: JSON.stringify([{ url: '/api/entities' }]) });
  });

  const render = () => {
    component = shallow(<Activitylog {...props} />, { context });
  };

  it('should render an ActivitylogForm and ActivitylogList', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should request the activitylog', async () => {
    const actions = await Activitylog.requestState();
    expect(actions).toMatchSnapshot();
  });
});
