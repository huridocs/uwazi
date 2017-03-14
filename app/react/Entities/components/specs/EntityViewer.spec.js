import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';

import {EntityViewer} from '../EntityViewer';

import ReferencesGroup from '../ReferencesGroup';
import ReferencesList from '../ReferencesList';

describe('EntityViewer', () => {
  let component;
  let props;
  let context;
  let instance;

  beforeEach(() => {
    context = {confirm: jasmine.createSpy('confirm')};
    props = {
      entity: {title: 'Title'},
      templates: [
        {_id: 'template1', properties: [{name: 'source_property', label: 'label1'}], name: 'template1Name'},
        {_id: 'template2', properties: [{name: 'source_property', label: 'label2'}], name: 'template2Name'}
      ],
      relationTypes: [{_id: 'abc', name: 'relationTypeName'}],
      referenceGroups: Immutable([
        {key: 'g1', templates: [{_id: 't1', count: 1}]},
        {key: 'g2', templates: [{_id: 't2', count: 2}, {_id: 't3', count: 3}]}
      ]),
      deleteReference: jasmine.createSpy('deleteReference'),
      startNewConnection: jasmine.createSpy('startNewConnection')
    };
  });

  let render = () => {
    component = shallow(<EntityViewer {...props} />, {context});
    instance = component.instance();
  };

  it('should render the ReferencesGroup', () => {
    render();

    const ref1 = component.find(ReferencesGroup).at(0);
    const ref2 = component.find(ReferencesGroup).at(1);

    expect(ref1.props().group).toBe(props.referenceGroups.get(0));
    expect(ref2.props().group).toBe(props.referenceGroups.get(1));
  });

  it('should render the ReferencesList passing enitity and deleteReference as props', () => {
    render();

    expect(component.find(ReferencesList).props().entity).toBe(props.entity);
    expect(component.find(ReferencesList).props().deleteReference).toBe(component.deleteReference);
  });

  describe('deleteReference', () => {
    beforeEach(() => {
      render();
    });

    it('should confirm deleting a Reference', () => {
      instance.deleteReference({});
      expect(context.confirm).toHaveBeenCalled();
      expect(props.deleteReference).not.toHaveBeenCalled();
    });

    it('should delete the reference upon accepting', () => {
      const ref = {_id: 'r1'};
      instance.deleteReference(ref);
      context.confirm.calls.argsFor(0)[0].accept();
      expect(props.deleteReference).toHaveBeenCalledWith(ref);
    });

    it('should not atempt to delete references whos source is metadata', () => {
      const ref = {_id: 'r1', sourceType: 'metadata'};
      instance.deleteReference(ref);
      expect(context.confirm).not.toHaveBeenCalled();
      expect(props.deleteReference).not.toHaveBeenCalled();
    });
  });
});
