import React from 'react';
import {shallow} from 'enzyme';
import configureMockStore from 'redux-mock-store';
import Immutable from 'immutable';
import {formater} from 'app/Metadata';

import PanelContainer, {ViewMetadataPanel} from '../ViewMetadataPanel';
import SidePanel from 'app/Layout/SidePanel';

describe('ViewMetadataPanel', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      metadata: {metadata: []},
      metadataForm: {},
      unselectDocument: jasmine.createSpy('unselectDocument'),
      resetForm: jasmine.createSpy('resetForm'),
      showModal: jasmine.createSpy('showModal'),
      formState: {}
    };
  });

  let render = () => {
    component = shallow(<ViewMetadataPanel {...props}/>);
  };

  it('should render a SidePanel', () => {
    render();

    expect(component.find(SidePanel).length).toBe(1);
    expect(component.find(SidePanel).props().open).toBeUndefined();
  });

  describe('when props.open', () => {
    it('should open SidePanel', () => {
      props.open = true;
      render();

      expect(component.find(SidePanel).props().open).toBe(true);
    });
  });

  describe('on close', () => {
    it('should should unselectDocument', () => {
      render();
      component.find('i.close-modal').simulate('click');
      expect(props.unselectDocument).toHaveBeenCalled();
      expect(props.resetForm).toHaveBeenCalledWith('library.metadata');
    });

    describe('when the form is dirty', () => {
      it('should open the confirmation modal', () => {
        render();
        props.formState.dirty = true;
        component.find('i.close-modal').simulate('click');
        expect(props.showModal).toHaveBeenCalledWith('ConfirmCloseForm', props.metadata);
      });
    });
  });

  describe('PanelContainer', () => {
    let state = {
      library: {
        ui: Immutable.fromJS({
          selectedDocument: Immutable.fromJS({})
        }),
        metadata: {},
        metadataForm: {},
        filters: Immutable.fromJS({templates: ['templates'], thesauris: ['thesauris']})
      }
    };

    const mockStore = configureMockStore([]);

    let renderContainer = () => {
      spyOn(formater, 'prepareMetadata');
      let store = mockStore(state);
      component = shallow(<PanelContainer />, {context: {store}});
    };

    it('should prepare doc with template and thesauris', () => {
      renderContainer();
      expect(formater.prepareMetadata).toHaveBeenCalledWith(
        state.library.ui.get('selectedDocument').toJS(),
        state.library.filters.get('templates').toJS(),
        state.library.filters.get('thesauris').toJS()
      );
    });

    it('should be closed when panel is not viewMetadataPanel', () => {
      state.library.ui = state.library.ui.remove('selectedDocument');
      renderContainer();
      expect(component.props().open).toBe(false);
    });

    it('should be open when panel is ViewMetadataPanel', () => {
      state.library.ui = state.library.ui.set('selectedDocument', Immutable.fromJS({}));
      renderContainer();
      expect(component.props().open).toBe(true);
    });
  });
});
