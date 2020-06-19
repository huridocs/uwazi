import { shallow, ShallowWrapper } from 'enzyme';
import React from 'react';
import { CopyFromEntity, CopyFromEntityProps, CopyFromEntityState } from '../CopyFromEntity';

import Immutable from 'immutable';

import { SearchEntities } from '../SearchEntities';
import FormatMetadata from '../../containers/FormatMetadata';

describe('CopyFromEntity', () => {
  let component: ShallowWrapper<CopyFromEntityProps, CopyFromEntityState, CopyFromEntity>;
  let props: CopyFromEntityProps;

  beforeEach(() => {
    props = {
      onSelect: jasmine.createSpy('onSelect'),
      templates: Immutable.fromJS([
        {
          _id: 'template_1',
          properties: [
            { name: 'one', type: 'text' },
            { name: 'two', type: 'text' },
          ],
        },
        {
          _id: 'template_2',
          properties: [
            { name: 'two', type: 'text' },
            { name: 'three', type: 'text' },
          ],
        },
      ]),
      originalTemplateId: 'template_1',
    };
  });

  const render = () => {
    component = shallow(<CopyFromEntity {...props} />);
  };

  describe('render', () => {
    it('should render a search entities component with onSelect callback', async () => {
      render();
      const searcher = component.find(SearchEntities);
      expect(searcher.props().onSelect).toBe(component.instance().onSelect);
    });
  });

  describe('when an entity is selected', () => {
    it('should render the entity an set the comon props in the satet', () => {
      render();
      component.instance().onSelect({ title: 'Choose me!', template: 'template_2' });

      expect(component.instance().state.propsToCopy).toEqual(['two']);
      expect(component.instance().state.selectedEntity).toEqual({
        title: 'Choose me!',
        template: 'template_2',
      });
    });
  });
});
