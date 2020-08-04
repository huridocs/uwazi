import Immutable from 'immutable';

import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import { ShowMetadata, MetadataForm } from 'app/Metadata';
import { api as entitiesAPI } from 'app/Entities';
import { RequestParams } from 'app/utils/RequestParams';
import RelationshipMetadata from '../RelationshipMetadata';
import * as routeUtils from '../../utils/routeUtils';

describe('RelationshipMetadata', () => {
  let component;
  let props;
  let instance;
  let confirm;
  let storeState;

  beforeEach(() => {
    spyOn(entitiesAPI, 'save').and.returnValue(Promise.resolve());
    spyOn(entitiesAPI, 'delete').and.returnValue(Promise.resolve());
  });

  const testingEntity = {
    sharedId: 'ab146',
    title: 'A test to remember',
    metadata: {},
  };

  function renderComponent(editing = false) {
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
        hubActions: Immutable.fromJS({ addTo: { hubIndex: null, rightRelationshipIndex: null } }),
        formState: {},
        list: { sharedId: '123' },
      },
    };

    props = {};
    confirm = jasmine.createSpy('confirm');
    component = renderConnected(RelationshipMetadata, props, storeState, confirm);
    instance = component.instance();
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

    describe('save', () => {
      it('should save the entity', async () => {
        renderComponent(true);

        await instance.saveEntity(testingEntity, 'relationships.metadata');
        expect(entitiesAPI.save).toHaveBeenCalledWith(new RequestParams(testingEntity));
      });
    });
  });

  describe('deleting', () => {
    it('should request a delete and reload all the connections', async () => {
      spyOn(routeUtils, 'requestState').and.returnValue(Promise.resolve([{}, {}]));
      instance.deleteDocument();
      await confirm.calls.allArgs()[0][0].accept();
      expect(entitiesAPI.delete).toHaveBeenCalledWith({
        data: { sharedId: 'ab146' },
        headers: {},
      });

      expect(routeUtils.requestState).toHaveBeenCalledWith(
        {
          data: { sharedId: '123' },
          headers: {},
        },
        storeState
      );
    });
  });
});
