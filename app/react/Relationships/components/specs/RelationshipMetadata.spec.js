import Immutable from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';
import { ShowMetadata, MetadataForm } from 'app/Metadata';
import { api as entitiesAPI } from 'app/Entities';
import * as saveEntityWithFiles from '../../../Library/actions/saveEntityWithFiles';
import { RelationshipMetadata, mapStateToProps } from '../RelationshipMetadata';
import * as routeUtils from '../../utils/routeUtils';

import * as actions from '../../actions/actions';

describe('RelationshipMetadata', () => {
  let component;
  let props;
  let instance;
  let storeState;

  const testingEntity = {
    sharedId: 'ab146',
    title: 'A test to remember',
    metadata: {},
  };

  beforeEach(() => {
    spyOn(saveEntityWithFiles, 'saveEntityWithFiles').and.returnValue({
      entity: testingEntity,
      errors: [''],
    });
    spyOn(entitiesAPI, 'delete').and.callFake(async () => Promise.resolve());
  });

  function renderComponent(editing = false, hubIndex = null, rightRelationshipIndex = null) {
    storeState = {
      templates: Immutable.fromJS([
        {
          _id: 'template1',
          properties: [{ localID: 1, label: 'label 1', filter: true, type: 'text' }],
        },
        {
          _id: 'template2',
          name: 'Template 2',
          properties: [{ label: 'Date', type: 'date', filter: true }],
        },
      ]),
      thesauris: Immutable.fromJS([
        { _id: 'abc1', name: 'Best SCI FI Authors' },
        { _id: 'abc2', name: 'Favourite dessert recipes' },
      ]),
      relationships: {
        metadata: editing ? testingEntity : {},
        connection: Immutable.fromJS(testingEntity),
        hubActions: Immutable.fromJS({ addTo: { hubIndex, rightRelationshipIndex } }),
        formState: {},
        list: { sharedId: '123' },
      },
    };

    const mappedProps = mapStateToProps(storeState);
    props = {
      unselectConnection: jasmine.createSpy('unselectConnection'),
      changeTemplate: jasmine.createSpy('changeTemplate'),
      updateRelationshipEntityData: jasmine.createSpy('updateRelationshipEntityData'),
      addEntity: jasmine.createSpy('addEntity'),
      setAddToData: jasmine.createSpy('setAddToData'),
      resetForm: jasmine.createSpy('resetForm'),
      reloadRelationships: jasmine.createSpy('reloadRelationships'),
      mainContext: { confirm: jasmine.createSpy('confirm') },
    };

    component = shallow(<RelationshipMetadata {...mappedProps} {...props} />);

    instance = component.instance();
    spyOn(actions, 'addEntity');
  }

  it('should render the current connection metdata', () => {
    renderComponent();
    const metadataComponent = component.find(ShowMetadata);
    expect(metadataComponent.props().entity).toEqual(testingEntity);
  });

  describe('when editing', () => {
    it('should render a metadata form', () => {
      renderComponent(true);
      const metadataComponent = component.find(MetadataForm);
      expect(metadataComponent.props().model).toEqual('relationships.metadata');
    });

    it('should reset the metadata form when closing entity edition', () => {
      renderComponent(true);
      const closeButton = component.find('.closeSidepanel');
      closeButton.simulate('click');
      expect(props.resetForm).toBeCalledWith('relationships.metadata');
      expect(props.unselectConnection).not.toBeCalled();
    });

    it('should unselect the connection when closing the side panel', () => {
      renderComponent(false);
      const closeButton = component.find('.closeSidepanel');
      closeButton.simulate('click');
      expect(props.resetForm).not.toBeCalledWith('relationships.metadata');
      expect(props.unselectConnection).toBeCalled();
    });

    describe('save', () => {
      it('should save the entity', async () => {
        renderComponent(true);

        await instance.saveEntity(testingEntity, 'relationships.metadata');
        expect(saveEntityWithFiles.saveEntityWithFiles).toHaveBeenCalledWith({
          metadata: {},
          sharedId: 'ab146',
          title: 'A test to remember',
        });
      });

      describe('when the values to add a new connection are set', () => {
        it('should add the connection after save', async () => {
          renderComponent(true, 0, 0);
          await instance.saveEntity(testingEntity, 'relationships.metadata');
          expect(props.addEntity).toHaveBeenLastCalledWith(
            0,
            0,
            {
              metadata: {},
              sharedId: 'ab146',
              title: 'A test to remember',
            },
            ['']
          );
          expect(props.setAddToData).toHaveBeenLastCalledWith(null, null);
        });
      });
    });
  });

  describe('deleting', () => {
    it('should request a delete and reload all the connections', async () => {
      renderComponent();
      spyOn(routeUtils, 'requestState').and.callFake(async () => Promise.resolve([{}, {}]));
      instance.deleteDocument();
      await props.mainContext.confirm.calls.allArgs()[0][0].accept();
      expect(entitiesAPI.delete).toHaveBeenCalledWith({
        data: { sharedId: 'ab146' },
        headers: {},
      });

      expect(props.reloadRelationships).toHaveBeenCalledWith('123');
    });
  });

  describe('toggleCopyFrom', () => {
    it('should toggle the show coppy form boolean', () => {
      renderComponent();
      expect(instance.state.copyFrom).toBe(false);
      instance.toggleCopyFrom();
      expect(instance.state.copyFrom).toBe(true);
      instance.toggleCopyFrom();
      expect(instance.state.copyFrom).toBe(false);
    });
  });
});
