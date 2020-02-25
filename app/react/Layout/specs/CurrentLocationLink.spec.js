import React from 'react';

import { shallow } from 'enzyme';

import { CurrentLocationLink } from '../CurrentLocationLink';

describe('Link', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      location: { pathname: 'pathanem', query: { param: 'value', param2: 'value2' } },
    };
  });

  const render = () => {
    component = shallow(<CurrentLocationLink {...props}>text</CurrentLocationLink>);
  };

  it('should render a link with current location as the url', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should pass all other props to Link', () => {
    props.queryParams = { param2: '', test: false };
    props.to = 'not to be passed';
    props.className = 'className';
    props.prop = 'value';

    render();
    expect(component).toMatchSnapshot();
  });

  it('should remove props when they are an empty string', () => {
    props.queryParams = { param2: '', test: false };
    render();
    expect(component).toMatchSnapshot();
  });

  it('should overwrite url query with query params passed (without mutating query)', () => {
    props.queryParams = { param2: 'new value', test: 'test' };
    render();
    expect(component).toMatchSnapshot();
    expect(props.location.query).toEqual({ param: 'value', param2: 'value2' });
  });
});
