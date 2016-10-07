import React from 'react';
import Immutable from 'immutable';
import {shallow} from 'enzyme';
import {fromJS} from 'immutable';

import SidePanel from 'app/Layout/SidePanel';
import SearchResults from 'app/Viewer/components/SearchResults';
import {Select} from 'app/Forms';
import CreateTargetConnectionPanel from '../ViewerSaveTargetReferenceMenu';
import CreateConnectionPanel from '../ViewerSaveReferenceMenu';

import {CreateReferencePanel, mapStateToProps} from 'app/Viewer/components/CreateReferencePanel';

describe('CreateReferencePanel', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      results: Immutable.fromJS([]),
      relationTypes: Immutable.fromJS([]),
      showModal: jasmine.createSpy('showModal'),
      reference: {}
    };
  });

  let render = () => {
    component = shallow(<CreateReferencePanel {...props}/>);
  };

  describe('close button', () => {
    it('should open confirm modal', () => {
      render();
      component.find('i.close-modal').simulate('click');
      expect(props.showModal).toHaveBeenCalledWith('ConfirmCloseReferenceForm', props.reference);
    });
  });

  it('should render a SidePanel', () => {
    render();

    expect(component.find(SidePanel).length).toBe(1);
    expect(component.find(SidePanel).props().open).toBeUndefined();
  });

  describe('Footer', () => {
    it('should render footer with a CreateConnectionPanel on referencePanel', () => {
      props.creatingToTarget = false;
      props.creatingBasicConnection = false;
      render();

      expect(component.find(CreateTargetConnectionPanel).parent().props().if).toBe(false);
      expect(component.find(CreateConnectionPanel).first().parent().props().if).toBe(true);
      expect(component.find(CreateConnectionPanel).first().props().basic).toBeUndefined();
      expect(component.find(CreateConnectionPanel).last().parent().props().if).toBe(false);
    });

    it('should render footer with a CreateConnectionPanel on targetReferencePanel', () => {
      props.creatingToTarget = true;
      props.creatingBasicConnection = false;
      render();

      expect(component.find(CreateTargetConnectionPanel).parent().props().if).toBe(true);
      expect(component.find(CreateConnectionPanel).first().parent().props().if).toBe(false);
      expect(component.find(CreateConnectionPanel).last().parent().props().if).toBe(false);
    });

    it('should render footer with a CreateConnectionPanel on connectionPanel', () => {
      props.creatingToTarget = false;
      props.creatingBasicConnection = true;
      render();

      expect(component.find(CreateTargetConnectionPanel).parent().props().if).toBe(false);
      expect(component.find(CreateConnectionPanel).first().parent().props().if).toBe(false);
      expect(component.find(CreateConnectionPanel).last().parent().props().if).toBe(true);
      expect(component.find(CreateConnectionPanel).last().props().basic).toBe(true);
    });
  });

  describe('when props.referencePanel', () => {
    it('should open SidePanel', () => {
      props.open = true;
      render();

      expect(component.find(SidePanel).props().open).toBe(true);
    });
  });

  describe('when relationType select changes', () => {
    it('should setRelationType', () => {
      props.setRelationType = jasmine.createSpy('setRelationType');
      render();

      let select = component.find(Select);

      expect(select.props().optionsValue).toBe('_id');
      expect(select.props().optionsLabel).toBe('name');
      select.simulate('change', {target: {value: 'value'}});
      expect(props.setRelationType).toHaveBeenCalled();
    });
  });

  it('should render SearchResults passing the results, searching flag and selected element', () => {
    props.results = Immutable.fromJS(['results']);
    props.searching = false;
    props.selected = 'selected';
    render();

    expect(component.find(SearchResults).props().results).toBe(props.results);
    expect(component.find(SearchResults).props().searching).toBe(props.searching);
    expect(component.find(SearchResults).props().selected).toBe(props.selected);
  });

  describe('onClick on a result', () => {
    it('should call props.selectTargetDocument', () => {
      props.selectTargetDocument = jasmine.createSpy('selectTargetDocument');
      render();

      component.find(SearchResults).simulate('click');
      expect(props.selectTargetDocument).toHaveBeenCalled();
    });
  });

  describe('mapStateToProps', () => {
    let state;
    let uiState;

    function prepareState() {
      state = {
        documentViewer: {
          uiState: fromJS(uiState)
        }
      };
    }

    beforeEach(() => {
      uiState = {
        panel: '',
        reference: {}
      };
      prepareState();
    });

    it('should not open on documentViewer state panel other than supported', () => {
      expect(mapStateToProps(state).open).toBe(false);
    });

    it('should open on documentViewer state referencePanel', () => {
      uiState.panel = 'referencePanel';
      prepareState();
      const restuls = mapStateToProps(state);

      expect(restuls.open).toBe(true);
      expect(restuls.creatingToTarget).toBe(false);
      expect(restuls.creatingBasicConnection).toBe(false);
    });

    it('should open on documentViewer state targetReferencePanel', () => {
      uiState.panel = 'targetReferencePanel';
      prepareState();
      const restuls = mapStateToProps(state);

      expect(restuls.open).toBe(true);
      expect(restuls.creatingToTarget).toBe(true);
      expect(restuls.creatingBasicConnection).toBe(false);
    });

    it('should open on documentViewer state targetReferencePanel', () => {
      uiState.panel = 'connectionPanel';
      prepareState();
      const restuls = mapStateToProps(state);

      expect(restuls.open).toBe(true);
      expect(restuls.creatingToTarget).toBe(false);
      expect(restuls.creatingBasicConnection).toBe(true);
    });
  });
});
