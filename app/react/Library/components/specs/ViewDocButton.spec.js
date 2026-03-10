import React from 'react';
import { fromJS } from 'immutable';
import { shallow } from 'enzyme';

import { actions } from 'app/BasicReducer';

import { ViewDocButton, mapDispatchToProps } from '../ViewDocButton';

describe('ViewDocButton', () => {
  let props;
  let component;
  beforeEach(() => {
    props = {
      type: 'entity',
      format: 'format',
      sharedId: '123',
      searchTerm: '',
      openReferencesTab: jest.fn(),
    };
  });

  const render = () => {
    component = shallow(<ViewDocButton {...props} />);
    return component;
  };

  it('should render a view button poiting to the doc url with the searchTerm if pressent', () => {
    render();
    expect(component).toMatchSnapshot();

    props.searchTerm = 'something';
    render();
    expect(component).toMatchSnapshot();
  });
  describe('when targetReference is provided', () => {
    it('should render view button with reference id in the url query', () => {
      props.targetReference = fromJS({ _id: 'ref1', range: { start: 200, end: 300 } });
      render();
      expect(component).toMatchSnapshot();

      props.searchTerm = 'something';
      render();
      expect(component).toMatchSnapshot();
    });
    it('should call openReferencesTab when clicked', () => {
      const event = { stopPropagation: jest.fn() };
      props.targetReference = fromJS({ range: { start: 200, end: 300 } });
      render();
      component.simulate('click', event);
      expect(props.openReferencesTab).toHaveBeenCalled();
    });
  });

  describe('mapDispatchToProps', () => {
    describe('openReferencesTab', () => {
      it('should set the sidepanel tab to references', () => {
        const innerDispatch = jest.fn();
        const dispatch = jest.fn(fn => fn(innerDispatch));
        const mappedProps = mapDispatchToProps(dispatch);
        mappedProps.openReferencesTab();
        expect(innerDispatch).toHaveBeenCalledWith(
          actions.set('viewer.sidepanel.tab', 'references')
        );
      });
    });
  });
});
