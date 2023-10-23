import { shallow, ShallowWrapper } from 'enzyme';
import React from 'react';
import Immutable from 'immutable';
import { store } from 'app/store';
import { CopyFromEntity, CopyFromEntityProps, CopyFromEntityState } from '../CopyFromEntity';
import { SearchEntities } from '../SearchEntities';

describe('CopyFromEntity', () => {
  let component: ShallowWrapper<CopyFromEntityProps, CopyFromEntityState, CopyFromEntity>;
  let props: CopyFromEntityProps;

  beforeEach(() => {
    if (store) {
      spyOn(store, 'dispatch');
    }
    props = {
      isVisible: true,
      onSelect: jasmine.createSpy('onSelect'),
      onCancel: jasmine.createSpy('onCancel'),
      formModel: 'myForm',
      templates: Immutable.fromJS([
        {
          _id: 'template_1',
          properties: [
            { name: 'one', type: 'text' },
            { name: 'two', type: 'text' },
            { name: 'id', type: 'generatedid' },
          ],
        },
        {
          _id: 'template_2',
          properties: [
            { name: 'two', type: 'text' },
            { name: 'three', type: 'text' },
            { name: 'id', type: 'generatedid' },
          ],
        },
      ]),
      originalEntity: {
        title: 'I want to be like you',
        template: 'template_1',
        metadata: {
          one: [{ value: 'number one' }],
          two: [{ value: 'number wrong' }],
          id: [{ value: 'ABC123' }],
        },
      },
    };
  });

  const render = () => {
    component = shallow(<CopyFromEntity {...props} />);
  };

  const entityToBeSelected = {
    title: 'Choose me!',
    template: 'template_2',
    metadata: {
      two: [{ value: 'number two' }],
      three: [{ value: 'number three' }],
      id: [{ value: 'ABC123' }],
    },
  };

  describe('render', () => {
    it('should render a search entities component with onSelect callback', async () => {
      render();
      const searcher = component.find(SearchEntities);
      expect(searcher.props().onSelect).toBe(component.instance().onSelect);
    });
  });

  describe('when an entity is selected', () => {
    it('should render the entity an set the common props in the state', () => {
      render();
      component.instance().onSelect(entityToBeSelected);

      expect(component.instance().state.propsToCopy).toEqual(['two']);
      expect(component.instance().state.selectedEntity).toEqual(entityToBeSelected);
    });
  });

  describe('copy()', () => {
    it('should load in the redux form the entity with matched values', () => {
      render();
      component.instance().onSelect(entityToBeSelected);
      component.instance().copy();
      expect(store?.dispatch).toHaveBeenCalledWith({ type: 'entityThesauris/SET', value: {} });
      expect(store?.dispatch).toHaveBeenCalledWith({ model: 'myForm', type: 'rrf/setPristine' });
      expect(store?.dispatch).toHaveBeenCalledWith({
        external: true,
        load: true,
        model: 'myForm',
        multi: false,
        silent: true,
        type: 'rrf/change',
        value: {
          metadata: {
            id: {
              value: 'ABC123',
            },
            one: {
              value: 'number one',
            },
            two: 'number two',
          },
          template: 'template_1',
          title: 'I want to be like you',
        },
      });
    });
  });
});
