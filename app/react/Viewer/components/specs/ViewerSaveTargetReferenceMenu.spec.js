import React from 'react';
import {shallow} from 'enzyme';

import {ViewerSaveTargetReferenceMenu} from 'app/Viewer/components/ViewerSaveTargetReferenceMenu';

describe('ViewerSaveReferenceMenu', () => {
  let component;
  let props;

  let render = () => {
    component = shallow(<ViewerSaveTargetReferenceMenu {...props}/>);
  };

  it('should render loadTargetDocument button when target is selected', () => {
    props = {
      loadTargetDocument: jasmine.createSpy('loadTargetDocument'),
      reference: {
        targetDocument: 'targetId'
      }
    };
    render();

    component.find('.float-btn__main').simulate('click');
    expect(props.loadTargetDocument).toHaveBeenCalledWith('targetId');
  });

  it('should no loadTargetDocument when targetDocument is not selected', () => {
    props = {
      loadTargetDocument: jasmine.createSpy('loadTargetDocument'),
      reference: {
        targetDocument: ''
      }
    };
    render();

    component.find('.float-btn__main').simulate('click');
    expect(props.loadTargetDocument).not.toHaveBeenCalled();
  });

  describe('when target document is loaded', () => {
    it('shuld render saveReference button', () => {
      props = {
        saveReference: jasmine.createSpy('saveReference'),
        reference: {
          sourceRange: 'range',
          targetDocument: 'target',
          targetRange: 'range'
        },
        sourceDocument: 'source',
        targetDocument: 'targetDocument'
      };
      render();

      component.find('.float-btn__main').simulate('click');
      expect(props.saveReference).toHaveBeenCalledWith({
        sourceRange: 'range',
        targetDocument: 'target',
        targetRange: 'range',
        sourceDocument: 'source'
      });
    });
  });
});
