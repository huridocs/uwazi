import React from 'react';
import {shallow} from 'enzyme';

import {TargetDocumentHeader} from 'app/Viewer/components/TargetDocumentHeader.js';

fdescribe('TargetDocumentHeader', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      unset: jasmine.createSpy('unset'),
      unsetTargetSelection: jasmine.createSpy('unsetTargetSelection'),
      unsetSelection: jasmine.createSpy('unsetTargetSelection')
    };
  });

  let render = () => {
    component = shallow(<TargetDocumentHeader {...props}/>);
  };

  describe('back button', () => {
    it('should  unset targetDoc and target reference', () => {
      render();
      component.find('button').simulate('click');
      expect(props.unset).toHaveBeenCalledWith('viewer/targetDoc');
      expect(props.unset).toHaveBeenCalledWith('viewer/targetDocHTML');
      expect(props.unsetTargetSelection).toHaveBeenCalled();
      expect(props.unsetSelection).toHaveBeenCalled();
    });
  });
});
