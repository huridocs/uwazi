import Immutable from 'immutable';

import { renderConnected } from 'app/utils/test/renderConnected';
import { FilterSuggestions } from '../FilterSuggestions';

describe('FilterSuggestions', () => {
  let component: any;

  function renderComponent(
    label = 'test',
    type = 'text',
    content: any = undefined,
    relationType: any = undefined
  ) {
    const storeState = {
      templates: Immutable.fromJS([
        {
          _id: 'template1',
          properties: [
            { localID: 1, label, filter: true, type },
            { localID: 2, label: 'something else' },
            { label: 'Date', type: 'date', filter: true },
          ],
        },
        {
          _id: 'template2',
          name: 'Template 2',
          properties: [
            { label: 'Date', type: 'date', filter: true },
            { label: 'Author', type: 'text', filter: true },
            { label: 'filterFalse', type: 'text', filter: false },
            { label: 'Authors', type: 'select', filter: true, content: 'abc1' },
          ],
        },
        {
          _id: 'template3',
          name: 'Template 3',
          properties: [
            { label: 'date ', type: 'date', filter: true },
            { label: 'filterFalse', type: 'text', filter: true },
            { label: 'Keywords', type: 'text', filter: true },
            {
              label: 'Relation',
              type: 'relationship',
              content: 'template1',
              relationType: 'relation1',
            },
          ],
        },
      ]),
      thesauris: Immutable.fromJS([
        { _id: 'abc1', name: 'Best SCI FI Authors' },
        { _id: 'abc2', name: 'Favourite dessert recipes' },
      ]),
      relationTypes: Immutable.fromJS([
        { _id: 'relation1', name: 'Relation 1' },
        { _id: 'relation2', name: 'Relation 2' },
      ]),
      template: {
        data: {
          name: 'Current template',
          properties: [
            {
              type,
              label,
              content,
              relationType,
            },
          ],
          commonProperties: [],
        },
        formState: {
          fields: [],
          $form: {
            errors: {},
          },
        },
      },
    };

    const props = {
      index: 0,
    };

    component = renderConnected(FilterSuggestions, props, storeState);
  }

  it('should always render the current property as a guide', () => {
    renderComponent('Year', 'date');
    const suggestion = component.find({
      templateProperty: { template: 'Current template (this template)' },
    });
    expect(suggestion.props().templateProperty.type).toBe('date');
  });

  describe('when there are other templates properties with the same label', () => {
    it('should render all the matched properties in other templates', () => {
      renderComponent('Date', 'text');
      const suggestion = component.find({ templateProperty: {} });
      expect(suggestion.length).toBe(3);
      expect(suggestion.get(0).props.templateProperty.template).toBe(
        'Current template (this template)'
      );
      expect(suggestion.get(1).props.templateProperty.template).toBe('Template 2');
      expect(suggestion.get(2).props.templateProperty.template).toBe('Template 3');
    });

    it('should not be a type conflict if type+ matches', () => {
      renderComponent('author', 'text');
      const suggestion = component.find({
        templateProperty: { template: 'Template 2' },
      });
      expect(suggestion.props().templateProperty.typeConflict).toBe(false);
    });

    it('should be a type conflict if type does not match', () => {
      renderComponent('author', 'date');
      const suggestion = component.find({
        templateProperty: { template: 'Template 2' },
      });
      expect(suggestion.props().templateProperty.typeConflict).toBe(true);
    });

    it('should be a content conflict if content does not match ', () => {
      renderComponent('authors', 'select', 'abc2');
      const suggestion = component.find({
        templateProperty: { template: 'Template 2' },
      });
      expect(suggestion.props().templateProperty.contentConflict).toBe(true);
    });

    it('should be a content conflict if relationType does not match ', () => {
      renderComponent('Relation', 'relationship', 'template1', 'relation2');
      const suggestion = component.find({
        templateProperty: { template: 'Template 3' },
      });
      expect(suggestion.props().templateProperty.relationConflict).toBe(true);
    });
  });
});
