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
    const rows = [{ time: 8235 }, { time: 7614 }, { time: 6613 }, { time: 6187 }, { time: 6013 }];
    state = { activitylog: { search: Immutable.fromJS({ limit: 5, remainingRows: 7, rows }) } };
  });

  const render = () => {
    props = {};
    const fullProps = Object.assign({}, props, mapStateToProps(state), mapDispatchToProps());
    component = shallow(<ActivitylogForm.WrappedComponent {...fullProps} />);
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
    expect(actions.activitylogSearchMore).toHaveBeenCalledWith({ before: 6013 });
  });

  it('should not load more values if all are loaded', () => {
    state.activitylog.search = state.activitylog.search.set('remainingRows', 0);

    render();

    const button = component.find('button');
    button.simulate('click');

    expect(actions.activitylogSearchMore).not.toHaveBeenCalled();
    expect(button.hasClass('disabled')).toBe(true);
  });
});
