import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {MetadataPanelMenu} from '../MetadataPanelMenu';
import {MenuButtons} from 'app/ContextMenu';

describe('MetadataPanelMenu', () => {
  let component;
  let props;

  let render = () => {
    component = shallow(<MetadataPanelMenu {...props}/>);
  };

  describe('when document is not being edited', () => {
    it('should open viewReferencesPanel on click references button', () => {
      props = {
        doc: Immutable.fromJS({_id: 1}),
        templates: Immutable.fromJS({templates: 'tempaltes'}),
        loadDocument: jasmine.createSpy('loadDocument')
      };
      render();

      component.find(MenuButtons.Main).simulate('click');
      expect(props.loadDocument).toHaveBeenCalledWith('documentViewer.docForm', props.doc.toJS(), props.templates.toJS());
    });
  });

  describe('when document is being edited', () => {
    it('should submit documentForm form', () => {
      props = {
        docForm: {_id: 1},
        doc: Immutable.fromJS({_id: 1}),
        templates: {templates: 'tempaltes'},
        saveDocument: jasmine.createSpy('saveDocument')
      };
      render();

      let button = component.find(MenuButtons.Main).find('button');
      expect(button.props().form).toBe('documentForm');
    });
  });
});
