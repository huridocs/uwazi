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

  describe('when targetDocument is loaded', () => {
    it('should render disabled saveReference button', () => {
      props = {
        saveReference: jasmine.createSpy('saveReference'),
        reference: {
          sourceRange: 'range',
          targetDocument: 'target'
        },
        sourceDocument: 'source',
        targetDocument: 'target'
      };
      render();

      let button = component.find(MenuButtons.Main);
      expect(button.props().disabled).toBe(true);
      button.simulate('click');
      expect(props.saveReference).not.toHaveBeenCalled();
    });

    describe('and targetRange is selected', () => {
      it('should render save reference button enabled and save reference on click', () => {
        props = {
          saveReference: jasmine.createSpy('saveReference'),
          reference: {
            sourceRange: 'range',
            targetDocument: 'target',
            targetRange: 'targetRange'
          },
          sourceDocument: 'source',
          targetDocument: 'target'
        };
        render();

        let button = component.find(MenuButtons.Main);
        expect(button.props().disabled).toBe(false);
        button.simulate('click');
        expect(props.saveReference).toHaveBeenCalledWith({
          sourceRange: 'range',
          targetDocument: 'target',
          targetRange: 'targetRange',
          sourceDocument: 'source'
        });
      });
    });
  });
});
