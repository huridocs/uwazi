import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {UploadsMenu} from 'app/Uploads/components/UploadsMenu';

describe('UploadsMenu', () => {
  let component;
  let props;
  let confirm = jasmine.createSpy('confirm');

  let render = () => {
    component = shallow(<UploadsMenu {...props}/>, {context: {confirm}});
  };

  beforeEach(() => {
    props = {
      templates: Immutable.fromJS([{_id: 1}, {_id: 2, isEntity: true}]),
      newEntity: jasmine.createSpy('newEntity')
    };
  });

  it('should have a new entity button', () => {
    render();
    const button = component.find('div.btn');
    button.simulate('click');
    expect(props.newEntity).toHaveBeenCalledWith([{_id: 2, isEntity: true}]);
  });

  describe('When props have hide', () => {
    it('should not show any contextual button', () => {
      props.hide = true;
      render();
      expect(component.children().length).toBe(0);
    });
  });
});
