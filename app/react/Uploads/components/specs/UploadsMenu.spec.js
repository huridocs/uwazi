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
      active: true,
      showModal: jasmine.createSpy('showModal'),
      templates: Immutable.fromJS([]),
      newEntity: jasmine.createSpy('newEntity')
    };
  });

  describe('submit button', () => {
    it('should be rendered when metadata is defined', () => {
      props.metadataBeingEdited = Immutable.fromJS({});
      render();
      expect(component.find('[type="submit"]').props().form).toBe('metadataForm');
    });
  });

  describe('delete button', () => {
    it('should call deleteDocument', () => {
      props.metadataBeingEdited = Immutable.fromJS({template: '1', title: 'test'});
      render();
      let instance = component.instance();
      spyOn(instance, 'deleteDocument');
      component.find('.delete').simulate('click');
      expect(instance.deleteDocument).toHaveBeenCalled();
    });
  });

  describe('publish button', () => {
    it('should not be rendered when document has no template', () => {
      render();
      expect(component.find('.publish').length).toBe(0);
    });

    it('should call publish method', () => {
      props.metadataBeingEdited = Immutable.fromJS({template: '1', title: 'test'});
      render();
      let instance = component.instance();
      spyOn(instance, 'publish');
      component.find('.publish').simulate('click');
      expect(instance.publish).toHaveBeenCalled();
    });
  });
});
