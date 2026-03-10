import React from 'react';

import { shallow } from 'enzyme';

import { ShowSidepanelMenu } from '../ShowSidepanelMenu';

describe('ShowSidepanelMenu', () => {
  let component;
  let props;
  beforeEach(() => {
    props = {
      active: false,
      panelIsOpen: true,
      openPanel: jest.fn(),
    };
  });

  function render() {
    component = shallow(<ShowSidepanelMenu {...props} />);
  }

  beforeEach(() => {
    render();
  });

  it('should show button if panel is not open', () => {
    props.panelIsOpen = false;
    render();
    expect(component).toMatchSnapshot();
  });

  it('should call openPanel when button is clicked', () => {
    props.panelIsOpen = false;
    render();
    component.find('.btn').simulate('click');
    expect(props.openPanel).toHaveBeenCalled();
  });
});
