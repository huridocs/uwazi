import React from 'react';
import {shallow} from 'enzyme';

import {ViewerSaveReferenceMenu} from 'app/Viewer/components/ViewerSaveReferenceMenu';

describe('ViewerSaveReferenceMenu', () => {
  let component;
  let props;

  let render = () => {
    component = shallow(<ViewerSaveReferenceMenu {...props}/>);
  };

  describe('Basic reference', () => {
    it('should render save button when reference is complete and pass connections as tab to activate', () => {
      props = {
        basic: true,
        saveReference: jasmine.createSpy('saveReference'),
        reference: {
          targetDocument: 'target',
          relationType: 'relation'
        },
        sourceDocument: 'source'
      };
      render();

      let button = component.find('button');
      expect(button.props().disabled).toBe(false);
      button.simulate('click');
      expect(props.saveReference).toHaveBeenCalledWith({
        targetDocument: 'target',
        relationType: 'relation',
        sourceDocument: 'source'
      }, 'connections');
    });

    it('should delete any range if passed', () => {
      props = {
        basic: true,
        saveReference: jasmine.createSpy('saveReference'),
        reference: {
          sourceRange: 'passed range',
          targetDocument: 'target',
          relationType: 'relation'
        },
        sourceDocument: 'source'
      };
      render();

      let button = component.find('button');
      expect(button.props().disabled).toBe(false);
      button.simulate('click');
      expect(props.saveReference).toHaveBeenCalledWith({
        targetDocument: 'target',
        relationType: 'relation',
        sourceDocument: 'source'
      }, 'connections');
    });

    it('should render a disabled button when reference doesnt have a target', () => {
      props = {
        saveReference: jasmine.createSpy('saveReference'),
        reference: {
          targetDocument: '',
          relationType: 'relation'
        },
        sourceDocument: 'source'
      };
      render();

      let button = component.find('button');
      expect(button.props().disabled).toBe(true);
      button.simulate('click');
      expect(props.saveReference).not.toHaveBeenCalled();
    });

    it('should render a disabled button when reference doesnt have a relation type', () => {
      props = {
        saveReference: jasmine.createSpy('saveReference'),
        reference: {
          targetDocument: 'target',
          relationType: ''
        },
        sourceDocument: 'source'
      };
      render();

      let button = component.find('button');
      expect(button.props().disabled).toBe(true);
      button.simulate('click');
      expect(props.saveReference).not.toHaveBeenCalled();
    });
  });

  describe('Ranged references', () => {
    it('should render save button when reference is complete', () => {
      props = {
        saveReference: jasmine.createSpy('saveReference'),
        reference: {
          sourceRange: 'range',
          targetDocument: 'target',
          relationType: 'relation'
        },
        sourceDocument: 'source'
      };
      render();

      let button = component.find('button');
      expect(button.props().disabled).toBe(false);
      button.simulate('click');
      expect(props.saveReference).toHaveBeenCalledWith({
        sourceRange: 'range',
        targetDocument: 'target',
        relationType: 'relation',
        sourceDocument: 'source'
      }, 'references');
    });

    it('should render a disabled button when reference it missing range', () => {
      props = {
        saveReference: jasmine.createSpy('saveReference'),
        reference: {
          sourceRange: '',
          targetDocument: 'target',
          relationType: 'relation'
        },
        sourceDocument: ''
      };
      render();

      let button = component.find('button');
      expect(button.props().disabled).toBe(true);
      button.simulate('click');
      expect(props.saveReference).not.toHaveBeenCalled();
    });
  });
});
