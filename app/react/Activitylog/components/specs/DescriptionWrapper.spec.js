import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import DescriptionWrapper from '../DescriptionWrapper';

describe('DescriptionWrapper', () => {
  let props;
  let component;
  let children;
  let toggleExpand;

  beforeEach(() => {
    toggleExpand = jasmine.createSpy('toggleExpand');
    props = {
      entry: Immutable.fromJS({
        semantic: { beautified: false },
        url: '/api/route/called',
        method: 'POST, PUT or DELETE',
        query: 'Long text for query',
        body: 'Very complex body text',
      }),
      toggleExpand,
    };
    children = <span>Some children</span>;
  });

  const render = () => {
    component = shallow(<DescriptionWrapper {...props}>{children}</DescriptionWrapper>);
  };

  const testExpanded = () => {
    props.expanded = true;
    render();
    expect(component).toMatchSnapshot();
  };

  it('should render the component with correct children', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should render expanded data', () => {
    testExpanded();
  });

  it('should render extra info when expanded and beautified', () => {
    props.entry = props.entry.set('semantic', Immutable.fromJS({ beautified: true }));
    testExpanded();
  });

  describe('toggleExpand', () => {
    it('should trigger when the main section is clicked', () => {
      render();
      expect(toggleExpand).not.toHaveBeenCalled();
      component.find('.expand').simulate('click');
      expect(toggleExpand).toHaveBeenCalled();
    });
  });
});
