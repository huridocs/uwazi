import React from 'react';
import {shallow} from 'enzyme';
import configureMockStore from 'redux-mock-store';
import {fromJS} from 'immutable';
import {formater} from 'app/Metadata';

import DocumentForm from '../../containers/DocumentForm';
import PanelContainer, {ViewMetadataPanel} from 'app/Viewer/components/ViewMetadataPanel';
import SidePanel from 'app/Layout/SidePanel';
import Connections from '../ConnectionsList';

describe('ViewMetadataPanel', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      doc: {metadata: []},
      rawDoc: fromJS({}),
      showModal: jasmine.createSpy('showModal'),
      openPanel: jasmine.createSpy('openPanel'),
      startNewConnection: jasmine.createSpy('startNewConnection'),
      references: fromJS([
        {_id: 'reference1', range: {start: 0}},
        {_id: 'reference2', range: {}},
        {_id: 'reference3', range: {}},
        {_id: 'reference4', range: {start: 0}}
      ])
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

  it('should split references acording to their type', () => {
    render();
    expect(component.find(Connections).first().parent().props().for).toBe('references');
    expect(component.find(Connections).first().props().references).toEqual(fromJS([props.references.get(0).toJS(), props.references.get(3).toJS()]));
    expect(component.find(Connections).last().parent().props().for).toBe('connections');
    expect(component.find(Connections).last().props().references).toEqual(fromJS([props.references.get(1).toJS(), props.references.get(2).toJS()]));
    expect(component.find(Connections).last().props().referencesSection).toBe('connections');
  });

  describe('when props.open', () => {
    it('should open SidePanel', () => {
      props.open = true;
      render();

      expect(component.find(SidePanel).props().open).toBe(true);
    });
  });

  describe('close', () => {
    describe('when form is dirty', () => {
      it('should showModal ConfirmCloseForm', () => {
        props.formDirty = true;
        render();
        component.find('i.close-modal').simulate('click');
        expect(props.showModal).toHaveBeenCalledWith('ConfirmCloseForm', props.doc);
      });
    });

    describe('when form is not dirty', () => {
      it('should close panel and reset form', () => {
        props.closePanel = jasmine.createSpy('closePanel');
        props.resetForm = jasmine.createSpy('resetForm');
        props.showTab = jasmine.createSpy('showConnections');
        props.formDirty = false;
        props.docBeingEdited = true;
        render();

        component.find('i.close-modal').simulate('click');

        expect(props.closePanel).toHaveBeenCalled();
        expect(props.resetForm).toHaveBeenCalledWith('documentViewer.docForm');
        expect(props.showTab).toHaveBeenCalled();
      });
    });
  });

  describe('onSubmit', () => {
    it('should saveDocument', () => {
      props.saveDocument = jasmine.createSpy('saveDocument');
      props.docBeingEdited = true;
      render();

      let doc = 'doc';
      component.find(DocumentForm).simulate('submit', doc);

      expect(props.saveDocument).toHaveBeenCalledWith(doc);
    });
  });

  describe('PanelContainer', () => {
    let state = {
      documentViewer: {
        uiState: fromJS({
          panel: ''
        }),
        doc: fromJS({}),
        docFormState: {dirty: false},
        targetDoc: fromJS({}),
        references: fromJS([{_id: 'reference'}]),
        templates: fromJS(['template']),
        thesauris: fromJS(['thesauris']),
        docForm: {}
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
        state.documentViewer.doc.toJS(),
        state.documentViewer.templates.toJS(),
        state.documentViewer.thesauris.toJS()
      );
    });

    it('should be closed when panel is not viewMetadataPanel', () => {
      renderContainer();
      expect(component.props().open).toBe(false);
    });

    it('should be open when panel is ViewMetadataPanel', () => {
      state.documentViewer.uiState = state.documentViewer.uiState.set('panel', 'viewMetadataPanel');
      renderContainer();
      expect(component.props().open).toBe(true);
    });
  });
});
