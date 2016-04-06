import React from 'react';
import {shallow} from 'enzyme';
import {TemplateCreator} from 'app/Templates/components/TemplateCreator';

describe('TemplateCreator', () => {
  let template = {id: '1', properties: [{label: 'label1'}, {label: 'label2'}]};
  let component;
  let saveTemplate = jasmine.createSpy('saveTemplate');
  let resetTemplate = jasmine.createSpy('resetTemplate');
  let props;

  beforeEach(() => {
    props = {resetTemplate, saveTemplate, template};
    component = shallow(<TemplateCreator {...props} />);
  });

  describe('on unmount', () => {
    it('should resetTemplate', () => {
      component.unmount();
      expect(resetTemplate).toHaveBeenCalledWith();
    });
  });
});
