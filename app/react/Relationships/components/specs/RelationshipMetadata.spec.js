import Immutable from 'immutable';

import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import { ShowMetadata, MetadataForm } from 'app/Metadata';
import { api as entitiesAPI } from 'app/Entities';
import { RequestParams } from 'app/utils/RequestParams';
import RelationshipMetadata from '../RelationshipMetadata';

describe('RelationshipMetadata', () => {
  let component;
  let props;
  let instance;

  beforeEach(() => {
    spyOn(entitiesAPI, 'save').and.returnValue(Promise.resolve());
  });

  const testingEntity = {
    title: 'A test to remember',
    metadata: {},
  };

  function renderComponent(editing = false) {
    const storeState = {
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

    component = renderConnected(RelationshipMetadata, props, storeState);
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
});
