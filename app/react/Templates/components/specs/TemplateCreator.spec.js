import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { TemplateCreator } from '../TemplateCreator';
import MetadataTemplate from '../MetadataTemplate';

describe('TemplateCreator', () => {
  const template = { id: '1', properties: [{ label: 'label1' }, { label: 'label2' }] };
  const saveTemplate = jasmine.createSpy('saveTemplate');
  const saveEntity = jasmine.createSpy('saveEntity');
  const saveRelationType = jasmine.createSpy('saveRelationType');
  const resetTemplate = jasmine.createSpy('resetTemplate');
  const settings = { collection: Immutable.fromJS({}) };

  let component;
  let props;
  let context;

  beforeEach(() => {
    props = { resetTemplate, saveTemplate, saveEntity, saveRelationType, template, settings };
    context = { router: { isActive: jasmine.createSpy('isActive') } };
  });

  const render = () => {
    component = shallow(<TemplateCreator {...props} />, { context });
  };

  const expectSave = expectedSave => {
    render();
    expect(component.find(MetadataTemplate).props().saveTemplate).toBe(expectedSave);
  };

  it('should pass the saveTemplate action to the MetadataTemplate component', () => {
    expectSave(saveTemplate);
  });

  describe('Property Options', () => {
    it('should include most common options by default (entity)', () => {
      props.entity = true;
      render();
      expect(component).toMatchSnapshot();
    });

    it('should include document specific options', () => {
      render();
      expect(component).toMatchSnapshot();
    });

    it('should remove all options for relationship', () => {
      props.relationType = true;
      render();
      expect(component).toMatchSnapshot();
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
