import React from 'react';
import { shallow } from 'enzyme';

import GeolocationViewer from '../GeolocationViewer';

describe('GeolocationViewer', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      points: [
        { lat: 13, lon: 7, label: 'home' },
        { lat: 5, lon: 10, label: 'work', color: 'red' },
        null,
        { lat: 23, lon: 8, label: '' },
      ],
    };
  });

  const render = () => {
    component = shallow(<GeolocationViewer {...props} />);
  };

  it('should render the coordinate values', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should render a map with markers when onlyForCards is false, not failing on nulls', () => {
    props.onlyForCards = false;
    render();
    expect(component).toMatchSnapshot();
  });

  it('should not fail if points is just an empty array', () => {
    props.onlyForCards = false;
    props.points = [];
    render();
    expect(component).toMatchSnapshot();
  });
});
