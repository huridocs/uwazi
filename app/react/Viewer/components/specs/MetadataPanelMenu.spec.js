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
        saveDocument: jasmine.createSpy('saveDocument'),
        formState: {dirty: false}
      };
      render();

      let button = component.find(MenuButtons.Main).find('button');
      expect(button.props().form).toBe('documentForm');
    });

    describe('when form is pristine', () => {
      it('should disable the buttons', () => {
        props = {
          docForm: {_id: 1},
          formState: {dirty: false}
        };
        render();

        let mainButton = component.find(MenuButtons.Main);
        expect(mainButton.props().disabled).toBe(true);
        let submitButton = component.find(MenuButtons.Main).find('button');
        expect(submitButton.props().disabled).toBe(true);
      });
    });

    describe('when form is dirty', () => {
      it('should not disable the buttons', () => {
        props = {
          docForm: {_id: 1},
          formState: {dirty: true}
        };
        render();

        let mainButton = component.find(MenuButtons.Main);
        expect(mainButton.props().disabled).toBe(false);
        let submitButton = mainButton.find('button');
        expect(submitButton.props().disabled).toBe(false);
      });
    });
  });
});
