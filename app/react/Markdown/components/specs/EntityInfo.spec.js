import React from 'react';
import { shallow } from 'enzyme';

import * as libraryActions from 'app/Library/actions/libraryActions';
import EntityInfo, { mapDispatchToProps } from '../EntityInfo.js';

describe('EntityInfo', () => {
  let props;
  let component;
  const dispatch = {};

  beforeEach(() => {
    spyOn(libraryActions, 'getAndSelectDocument');
  });

  const render = (customProps) => {
    props = {
      entity: 'sharedId',
      classname: 'passed classnames',
      children: [<span key="1">multiple</span>, <b key="2">children</b>]
    };
    const mappedProps = { ...props, ...customProps, ...mapDispatchToProps(dispatch) };
    component = shallow(<EntityInfo.WrappedComponent {...mappedProps}/>);
  };

  it('should wrap children in a div, passing classname', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should allow changing the tag wrapping element', () => {
    render({ tag: 'p' });
    expect(component).toMatchSnapshot();
  });

  it('should get and select the entity', () => {
    render();
    component.simulate('click');
    expect(libraryActions.getAndSelectDocument).toHaveBeenCalledWith('sharedId');
  });
});
