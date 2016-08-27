import React from 'react';
import {shallow} from 'enzyme';
import {TemplateCreator} from 'app/Templates/components/TemplateCreator';
import MetadataTemplate from 'app/Templates/components/MetadataTemplate';

describe('TemplateCreator', () => {
  let template = {id: '1', properties: [{label: 'label1'}, {label: 'label2'}]};
  let component;
  let saveTemplate = jasmine.createSpy('saveTemplate');
  let saveEntity = jasmine.createSpy('saveEntity');
  let resetTemplate = jasmine.createSpy('resetTemplate');
  let props;
  let context;

  beforeEach(() => {
    props = {resetTemplate, saveTemplate, saveEntity, template};
    context = {router: {isActive: jasmine.createSpy('isActive')}};
  });

  let render = () => {
    component = shallow(<TemplateCreator {...props} />, {context});
  };

  it('should pass the saveTemplate action to the MetadataTemplate component', () => {
    render();
    expect(component.find(MetadataTemplate).props().saveTemplate).toBe(saveTemplate);
  });

  describe('when creating a new entity', () => {
    it('should pass the saveEntity action to the MetadataTemplate component', () => {
      props.entity = true;
      render();
      expect(component.find(MetadataTemplate).props().saveTemplate).toBe(saveEntity);
    });
  });

  describe('on unmount', () => {
    it('should resetTemplate', () => {
      render();
      component.unmount();
      expect(resetTemplate).toHaveBeenCalledWith();
    });
  });
});
