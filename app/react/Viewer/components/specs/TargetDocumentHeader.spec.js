import React from 'react';
import { shallow } from 'enzyme';
import { fromJS as Immutable } from 'immutable';

import { TargetDocumentHeader } from 'app/Viewer/components/TargetDocumentHeader.js';

describe('TargetDocumentHeader', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      connection: Immutable({ _id: 'connection' }),
      uiState: Immutable({ connecting: false }),
      reference: { targetRange: { text: 'text' }, targetDocument: 'abc2', targetFile: 'fileId' },
      targetDocument: 'abc2',
      saveTargetRangedReference: jasmine.createSpy('saveTargetRangedReference'),
      cancelTargetDocument: jasmine.createSpy('cancelTargetDocument'),
      addReference: () => {},
      toggleReferences: jasmine.createSpy('toggleReferences'),
    };
  });

  const render = () => {
    component = shallow(<TargetDocumentHeader {...props} />);
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
      expect(props.saveTargetRangedReference).toHaveBeenCalledWith(
        { _id: 'connection' },
        { text: 'text' },
        'fileId',
        jasmine.any(Function)
      );
    });
  });

  describe('reference status', () => {
    it('should toggle references when connecting', () => {
      render();
      component.setProps({ uiState: Immutable({ connecting: true }) }, () => {
        expect(props.toggleReferences).toHaveBeenCalledWith(false);
      });
      component.setProps({ uiState: Immutable({ connecting: false }) }, () => {
        expect(props.toggleReferences).toHaveBeenCalledWith(true);
      });
    });
  });
});
