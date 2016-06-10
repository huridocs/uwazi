import React from 'react';
import {shallow} from 'enzyme';

import {ViewerSaveTargetReferenceMenu} from 'app/Viewer/components/ViewerSaveTargetReferenceMenu';
import {MenuButtons} from 'app/ContextMenu';

describe('ViewerSaveTargetReferenceMenu', () => {
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

    let button = component.find(MenuButtons.Main);
    expect(button.props().disabled).toBe(false);
    button.simulate('click');
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

    let button = component.find(MenuButtons.Main);
    expect(button.props().disabled).toBe(true);
    button.simulate('click');
    expect(props.loadTargetDocument).not.toHaveBeenCalled();
  });

  describe('when targetRange is selected', () => {
    it('should render saveReference button', () => {
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

      component.find(MenuButtons.Main).simulate('click');
      expect(props.saveReference).toHaveBeenCalledWith({
        sourceRange: 'range',
        targetDocument: 'target',
        targetRange: 'range',
        sourceDocument: 'source'
      });
    });
  });
});
