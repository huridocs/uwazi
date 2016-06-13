import React from 'react';
import {shallow} from 'enzyme';

import {ViewerSaveReferenceMenu} from 'app/Viewer/components/ViewerSaveReferenceMenu';
import {MenuButtons} from 'app/ContextMenu';

describe('ViewerSaveReferenceMenu', () => {
  let component;
  let props;

  let render = () => {
    component = shallow(<ViewerSaveReferenceMenu {...props}/>);
  };

  it('shuld render save button when reference is complete', () => {
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

    let button = component.find(MenuButtons.Main);
    expect(button.props().disabled).toBe(false);
    button.simulate('click');
    expect(props.saveReference).toHaveBeenCalledWith({
      sourceRange: 'range',
      targetDocument: 'target',
      sourceDocument: 'source',
      relationType: 'relation'
    });
  });

  it('should render a disabled button when reference its not complete', () => {
    props = {
      saveReference: jasmine.createSpy('saveReference'),
      reference: {
        sourceRange: '',
        targetDocument: ''
      },
      sourceDocument: ''
    };
    render();

    let button = component.find(MenuButtons.Main);
    expect(button.props().disabled).toBe(true);
    button.simulate('click');
    expect(props.saveReference).not.toHaveBeenCalled();
  });
});
