import React from 'react';
import {shallow} from 'enzyme';

import {ViewerSaveReferenceMenu} from 'app/Viewer/components/ViewerSaveReferenceMenu';

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
        targetDocument: 'target'
      },
      sourceDocument: 'source'
    };
    render();
    component.find('.float-btn__main').simulate('click');

    expect(props.saveReference).toHaveBeenCalledWith({
      sourceRange: 'range',
      targetDocument: 'target',
      sourceDocument: 'source'
    });
  });

  it('should render a default button when reference its not complete', () => {
    props = {
      saveReference: jasmine.createSpy('saveReference'),
      reference: {
        sourceRange: '',
        targetDocument: ''
      },
      sourceDocument: ''
    };
    render();

    component.find('.float-btn__main').simulate('click');
    expect(props.saveReference).not.toHaveBeenCalled();
  });
});
