import React from 'react';
import {shallow} from 'enzyme';
import {fromJS} from 'immutable';

import DocumentSidePanel from '../DocumentSidePanel';
import SidePanel from 'app/Layout/SidePanel';
import Connections from 'app/Viewer/components/ConnectionsList';
import Immutable from 'immutable';

describe('DocumentSidePanel', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      doc: Immutable.fromJS({metadata: [], attachmenas: [], type: 'document'}),
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
    component = shallow(<DocumentSidePanel {...props}/>);
  };

  it('should render a SidePanel', () => {
    render();

    expect(component.find(SidePanel).length).toBe(1);
    expect(component.find(SidePanel).props().open).toBeUndefined();
  });

  it('should split references acording to their type', () => {
    render();
    expect(component.find(Connections).first().parent().props().for).toBe('references');
    expect(component.find(Connections).first().props().references.toJS()).toEqual([props.references.get(0).toJS(), props.references.get(3).toJS()]);
    expect(component.find(Connections).last().parent().props().for).toBe('connections');
    expect(component.find(Connections).last().props().references.toJS()).toEqual([props.references.get(1).toJS(), props.references.get(2).toJS()]);
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
        props.formPath = 'formPath';
        render();

        component.find('i.close-modal').simulate('click');

        expect(props.closePanel).toHaveBeenCalled();
        expect(props.resetForm).toHaveBeenCalledWith('formPath');
        expect(props.showTab).toHaveBeenCalled();
      });
    });
  });

  describe('onSubmit', () => {
    it('should saveDocument', () => {
      props.saveDocument = jasmine.createSpy('saveDocument');
      props.docBeingEdited = true;
      const DocumentForm = () => {};
      props.DocumentForm = DocumentForm;
      render();

      let doc = 'doc';
      component.find(DocumentForm).simulate('submit', doc);

      expect(props.saveDocument).toHaveBeenCalledWith(doc);
    });
  });
});
