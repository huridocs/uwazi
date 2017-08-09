import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';

import {CreateConnectionPanel} from '../CreateConnectionPanel';

import SidePanel from 'app/Layout/SidePanel';
import SearchForm from '../SearchForm';
import ActionButton from '../ActionButton';
import SearchResults from '../SearchResults';

describe('CreateConnectionPanel', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      connection: Immutable({
        relationType: 'rt3',
        type: 'basic',
        sourceDocument: 'sourceId',
        targetDocument: 'targetId'
      }),
      pdfInfo: Immutable([]),
      relationTypes: Immutable([{_id: 'rt1', name: 'relationType1'}, {_id: 'rt2', name: 'relationType2'}]),
      searchResults: Immutable([{_id: 'sr1'}, {_id: 'sr2'}]),
      uiState: Immutable({searching: true}),
      setRelationType: jasmine.createSpy('setRelationType'),
      setTargetDocument: () => {},
      onCreate: jasmine.createSpy('onCreate'),
      onRangedConnect: () => {}
    };
  });

  function render() {
    component = shallow(<CreateConnectionPanel {...props} />);
  }

  it('should allow to select the connection types and set its value', () => {
    render();
    const options = component.find('.connections-list li');

    expect(options.at(0).text()).toBe('relationType1');
    expect(options.at(1).text()).toBe('relationType2');

    options.at(0).simulate('click');
    expect(props.setRelationType).toHaveBeenCalledWith('rt1');

    options.at(1).simulate('click');
    expect(props.setRelationType).toHaveBeenCalledWith('rt2');
  });

  it('should mark the connnection type passed', () => {
    props.connection = Immutable({
      relationType: 'rt1',
      type: 'basic',
      sourceDocument: 'sourceId',
      targetDocument: 'targetId'
    });

    render();
    let options = component.find('.connections-list li');
    expect(options.at(0).find('i').props().className).toBe('fa fa-check');
    expect(options.at(1).find('i').props().className).not.toBe('fa fa-check');

    props.connection = Immutable({
      relationType: 'rt2',
      type: 'basic',
      sourceDocument: 'sourceId',
      targetDocument: 'targetId'
    });

    render();
    options = component.find('.connections-list li');
    expect(options.at(0).find('i').props().className).not.toBe('fa fa-check');
    expect(options.at(1).find('i').props().className).toBe('fa fa-check');
  });

  it('should have a search form with the connection type', () => {
    render();
    expect(component.find(SearchForm).props().connectionType).toBe('basic');
  });

  it('should have save button with an onCreate callback for most connection types', () => {
    render();
    const saveButton = component.find(ActionButton).at(0);
    expect(saveButton.props().action).toBe('save');
    saveButton.props().onCreate();
    expect(props.onCreate).toHaveBeenCalled();
    expect(saveButton.parent().props().if).toBe(true);
    expect(component.find(ActionButton).at(1).parent().props().if).toBe(false);
  });

  it('should have connect button with an onRangedConnect callback for targetRanged connections', () => {
    props.connection = props.connection.set('type', 'targetRanged');
    render();
    const connectButton = component.find(ActionButton).at(1);
    expect(connectButton.props().action).toBe('connect');
    expect(connectButton.props().onRangedConnect).toBe(props.onRangedConnect);
    expect(connectButton.parent().props().if).toBe(true);
    expect(component.find(ActionButton).at(0).parent().props().if).toBe(false);
  });

  it('should list the search results and pass props required', () => {
    render();
    const searchResults = component.find(SearchResults);
    expect(searchResults.props().results).toBe(props.searchResults);
    expect(searchResults.props().searching).toBe(true);
    expect(searchResults.props().selected).toBe('targetId');
    expect(searchResults.props().onClick).toBe(props.setTargetDocument);
  });

  describe('Open behavior', () => {
    it('should stay closed if uiState open is false', () => {
      props.uiState = props.uiState.set('open', false);
      props.containerId = 'sourceId';
      render();
      expect(component.find(SidePanel).props().open).toBe(false);
    });

    it('should stay closed if uiState open is true and the container is different from the connection source', () => {
      props.uiState = props.uiState.set('open', true);
      props.containerId = 'wrongMatch';
      render();
      expect(component.find(SidePanel).props().open).toBe(false);
    });

    it('should only open if uiState open is true and the container matches the connection source', () => {
      props.uiState = props.uiState.set('open', true);
      props.containerId = 'sourceId';
      render();
      expect(component.find(SidePanel).props().open).toBe(true);
    });
  });
});
