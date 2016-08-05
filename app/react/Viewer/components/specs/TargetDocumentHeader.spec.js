import React from 'react';
import {shallow} from 'enzyme';

import {TargetDocumentHeader} from 'app/Viewer/components/TargetDocumentHeader.js';

describe('TargetDocumentHeader', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      unset: jasmine.createSpy('unset'),
      unsetTargetSelection: jasmine.createSpy('unsetTargetSelection'),
      openPanel: jasmine.createSpy('openPanel'),
      sourceDocument: 'abc1',
      targetDocument: 'abc2',
      reference: {targetRange: {}, targetDocument: 'abc2'},
      saveReference: jasmine.createSpy('saveReference')
    };
  });

  let render = () => {
    component = shallow(<TargetDocumentHeader {...props}/>);
  };

  describe('back button', () => {
    it('should  unset targetDoc and target reference', () => {
      render();
      component.find('button').first().simulate('click');
      expect(props.unset).toHaveBeenCalledWith('viewer/targetDoc');
      expect(props.unset).toHaveBeenCalledWith('viewer/targetDocHTML');
      expect(props.unset).toHaveBeenCalledWith('viewer/targetDocReferences');
      expect(props.unsetTargetSelection).toHaveBeenCalled();
      expect(props.openPanel).toHaveBeenCalledWith('targetReferencePanel');
    });
  });

  describe('save button', () => {
    it('should save the reference', () => {
      render();
      component.find('button').last().simulate('click');
      expect(props.unset).toHaveBeenCalledWith('viewer/targetDocReferences');
      expect(props.saveReference).toHaveBeenCalledWith(props.reference);
    });

    describe('when there is no texrange selected', () => {
      it('should do nothing', () => {
        render();
        delete props.reference.targetRange;
        component.find('button').last().simulate('click');
        expect(props.saveReference).not.toHaveBeenCalled();
      });
    });
  });
});
