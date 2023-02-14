import Immutable from 'immutable';
import React from 'react';

import { shallow } from 'enzyme';

import { t } from 'app/I18N';
import { FiltersFromProperties, mapStateToProps } from '../FiltersFromProperties';
import DateFilter from '../DateFilter';
import NestedFilter from '../NestedFilter';
import NumberRangeFilter from '../NumberRangeFilter';
import SelectFilter from '../SelectFilter';
import TextFilter from '../TextFilter';
import { defaultProperties } from './fixtures/FiltersFromPropertiesFixtures';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => jest.fn(),
}));
jest.mock('app/I18N', () => ({
  __esModule: true,
  t: jest.fn(),
  default: jest.fn(),
}));

let props = {};
let component;

beforeEach(() => {
  t.mockImplementation((_context, label) => label);
  const state = {
    settings: { collection: Immutable.fromJS({ dateFormat: 'dateFormat' }) },
    library: { aggregations: Immutable.fromJS({ aggregations: 'aggregations' }) },
    templates: Immutable.fromJS([
      {
        name: 'blah',
        properties: [
          { _id: '1234', type: 'date', name: 'age' },
          { _id: '4567', type: 'text', name: 'name' },
        ],
      },
    ]),
  };
  props = mapStateToProps(state, { storeKey: 'library' });
  props.translationContext = 'oneContext';
});

const render = () => {
  component = shallow(<FiltersFromProperties {...props} />);
};

describe('FiltersFromProperties', () => {
  beforeEach(() => {
    props.properties = defaultProperties;
  });

  it('should concat the modelPrefix with the model', () => {
    props.modelPrefix = '.prefix';

    render();
    const textFilter = component.find(TextFilter);
    expect(textFilter).toMatchSnapshot();
  });

  describe('when type is text', () => {
    it('should render a text filter', () => {
      render();
      const textFilter = component.find(TextFilter);
      expect(textFilter).toMatchSnapshot();
    });
  });

  describe('when type is select, multiselect or relationship', () => {
    it('should render a select filter', () => {
      render();
      const selectFilter = component.find(SelectFilter);
      expect(selectFilter).toMatchSnapshot();
    });

    it('should translate the options of filter with thesaurus', () => {
      props.properties = [
        {
          content: 'thesaurus1',
          name: 'selectFilter',
          label: 'selectLabel',
          type: 'select',
          options: [{ label: 'option1' }],
        },
        {
          content: 'thesaurus2',
          name: 'relationshipFilter',
          label: 'relationshipLabel',
          type: 'relationship',
          options: [{ label: 'option2' }],
        },
      ];

      t.mockImplementation(() => 'translatedOption');

      render();

      const selectFilter = component.find(SelectFilter);
      const _text = undefined;
      const returnComponent = false;
      expect(t).toHaveBeenCalledWith('thesaurus1', 'option1', _text, returnComponent);
      expect(t).not.toHaveBeenCalledWith('thesaurus2', 'option2', _text, returnComponent);
      expect(selectFilter.get(0).props.options[0].label).toBe('translatedOption');
      expect(selectFilter.get(1).props.options[0].label).toBe('option2');
    });

    it('should not translate the options for relationships', () => {
      props.properties = [
        {
          content: '',
          name: 'selectFilter',
          label: 'selectLabel',
          type: 'select',
          options: [{ label: 'option1' }],
        },
        {
          content: '',
          name: 'relationshipFilter',
          label: 'relationshipLabel',
          type: 'relationship',
          options: [{ label: 'option2' }],
        },
      ];

      t.mockImplementation(() => 'translatedOption');

      render();

      const selectFilter = component.find(SelectFilter);
      expect(selectFilter.get(0).props.options[0].label).toBe('translatedOption');
      expect(selectFilter.get(1).props.options[0].label).toBe('option2');
    });

    it('should translate the options of filter with nested thesauris', () => {
      props.properties = [
        {
          content: 'thesaurus1',
          name: 'selectFilter',
          label: 'selectLabel',
          type: 'select',
          options: [{ label: 'option1', options: [{ label: 'suboption1' }] }],
        },
        {
          content: 'thesaurus2',
          name: 'relationshipFilter',
          label: 'relationshipLabel',
          type: 'relationship',
          options: [{ label: 'option2', options: [{ label: 'suboption2' }] }],
        },
      ];

      t.mockImplementation(() => 'translatedOption');

      render();

      const selectFilter = component.find(SelectFilter);
      const _text = undefined;
      const returnComponent = false;
      expect(t).toHaveBeenCalledWith('thesaurus1', 'suboption1', _text, returnComponent);
      expect(t).toHaveBeenCalledWith('thesaurus2', 'suboption2', _text, returnComponent);
      expect(selectFilter.get(0).props.options[0].options[0].label).toBe('translatedOption');
      expect(selectFilter.get(1).props.options[0].options[0].label).toBe('translatedOption');
    });
  });

  describe('when inheriting properties', () => {
    it('should render the appropriate filter for the inherited property', () => {
      props.properties = [
        {
          content: 'aContent',
          name: 'countries',
          label: 'Countries',
          type: 'relationship',
          inherit: { property: '1234', type: 'date' },
          options: [{ label: 'option2' }],
        },
      ];

      render();

      const dateFilter = component.find(DateFilter);
      expect(dateFilter.length).toBe(1);
    });
  });

  describe('when type is date, multidate, multidaterange or daterange', () => {
    it('should render a date filter', () => {
      render();
      const dateFilter = component.find(DateFilter);
      expect(dateFilter).toMatchSnapshot();
    });
  });

  describe('when type is numeric', () => {
    it('should render a number range filter', () => {
      render();
      const numberRangeFilter = component.find(NumberRangeFilter);
      expect(numberRangeFilter).toMatchSnapshot();
    });
  });

  describe('when type is nested', () => {
    it('should render a number range filter', () => {
      render();
      const nestedFilter = component.find(NestedFilter);
      expect(nestedFilter).toMatchSnapshot();
    });
  });

  it('should not render `any` options', () => {
    props.properties = [
      {
        localID: 'srhkbn1bbqi',
        name: 'property',
        type: 'multiselect',
        options: [
          {
            id: '7ycel666l65vobt9',
            value: '7ycel666l65vobt9',
            label: 'Option 1',
            results: 10,
          },
          {
            id: 'mbpzxhzlfep6tj4i',
            value: 'mbpzxhzlfep6tj4i',
            label: 'Option 2',
            results: 5,
          },
          {
            id: 'any',
            value: 'any',
            label: 'Any',
            results: 15,
          },
        ],
      },
    ];

    render();
    const { options } = component.find(SelectFilter).props();
    expect(options).toMatchObject([
      {
        id: '7ycel666l65vobt9',
        value: '7ycel666l65vobt9',
        label: 'Option 1',
        results: 10,
      },
      {
        id: 'mbpzxhzlfep6tj4i',
        value: 'mbpzxhzlfep6tj4i',
        label: 'Option 2',
        results: 5,
      },
    ]);
  });
});
