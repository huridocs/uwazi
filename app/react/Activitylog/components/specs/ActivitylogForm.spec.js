import React from 'react';
import { shallow } from 'enzyme';
import * as redux from 'redux';
import { LocalForm } from 'react-redux-form';
import Immutable from 'immutable';
import ActivitylogForm, { mapStateToProps, mapDispatchToProps } from '../ActivitylogForm.js';
import * as actions from '../../actions/activitylogActions';

describe('ActivitylogForm', () => {
  let state;
  let props;
  let component;

  beforeEach(() => {
    spyOn(actions, 'activitylogSearch');
    spyOn(actions, 'activitylogSearchMore');
    spyOn(redux, 'bindActionCreators').and.callFake(propsToBind => propsToBind);
    state = { activitylog: { search: Immutable.fromJS({ page: 1, pageSize: 5, totalRows: 12 }) } };
  });

  const render = () => {
    props = { };
    const fullProps = Object.assign({}, props, mapStateToProps(state), mapDispatchToProps());
    component = shallow(<ActivitylogForm.WrappedComponent {...fullProps}/>);
  };

  it('should render a form', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should submit the values', () => {
    render();
    component.find(LocalForm).simulate('submit', { limit: 100 });
    expect(component.state().query).toEqual({ limit: 100 });
    expect(actions.activitylogSearch).toHaveBeenCalledWith({ limit: 100 });
  });

  it('should load more values when available', () => {
    render();

    const button = component.find('button');
    expect(button.hasClass('disabled')).toBe(false);

    button.simulate('click');
    expect(actions.activitylogSearchMore).toHaveBeenCalledWith({ page: 2 });
  });

  it('should not load more values if all are loaded', () => {
    state.activitylog.search = state.activitylog.search.set('totalRows', 4);

    render();

    const button = component.find('button');
    button.simulate('click');

    expect(actions.activitylogSearchMore).not.toHaveBeenCalled();
    expect(button.hasClass('disabled')).toBe(true);
  });
});
