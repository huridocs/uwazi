import React from 'react';
import { shallow } from 'enzyme';
import { CurrentLocationLink } from '../CurrentLocationLink';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: 'pathanem', search: 'param=value&param2=value2' }),
}));

describe('Link', () => {
  let component;
  const props = { queryParams: {}, to: '', className: '', prop: '' };

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
    expect(component.props().to).toEqual('pathanem?param=value&param2=new+value&test=test');
  });
});
