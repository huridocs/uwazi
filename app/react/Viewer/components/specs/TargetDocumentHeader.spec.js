import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';

import {TargetDocumentHeader} from 'app/Viewer/components/TargetDocumentHeader.js';

describe('TargetDocumentHeader', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      connection: Immutable({_id: 'connection'}),
      reference: {targetRange: {text: 'text'}, targetDocument: 'abc2'},
      targetDocument: 'abc2',
      saveTargetRangedReference: jasmine.createSpy('saveTargetRangedReference'),
      cancelTargetDocument: jasmine.createSpy('cancelTargetDocument'),
      addReference: () => {}
    };
  });

  let render = () => {
    component = shallow(<TargetDocumentHeader {...props}/>);
  };

  describe('back button', () => {
    it('should cancelTargetDocument', () => {
      render();
      component.find('button').first().simulate('click');
      expect(props.cancelTargetDocument).toHaveBeenCalled();
    });
  });

  describe('save button', () => {
    it('should save the reference', () => {
      render();
      component.find('button').last().simulate('click');
      expect(props.saveTargetRangedReference).toHaveBeenCalledWith({_id: 'connection'}, {text: 'text'}, jasmine.any(Function));
    });
  });
});
