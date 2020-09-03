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

jest.mock('app/I18N', () => ({
  __esModule: true,
  t: jest.fn(),
  default: jest.fn(),
}));

describe('FiltersFromProperties', () => {
  let props = {};

  beforeEach(() => {
    t.mockImplementation((_context, label) => label);
    const state = {
      settings: { collection: Immutable.fromJS({ dateFormat: 'dateFormat' }) },
      library: { aggregations: Immutable.fromJS({ aggregations: 'aggregations' }) },
    };

    props = mapStateToProps(state, { storeKey: 'library' });
  });

  it('should concat the modelPrefix with the model', () => {
    props.properties = [
      {
        name: 'textFilter',
        label: 'textLabel',
      },
    ];
    props.translationContext = 'oneContext';
    props.modelPrefix = '.prefix';

    const component = shallow(<FiltersFromProperties {...props} />).find(TextFilter);
    expect(component).toMatchSnapshot();
  });

  describe('when type is text', () => {
    it('should render a text filter', () => {
      props.properties = [
        {
          name: 'textFilter',
          label: 'textLabel',
        },
      ];
      props.translationContext = 'oneContext';

      const component = shallow(<FiltersFromProperties {...props} />).find(TextFilter);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when type is select, multiselect or relationship', () => {
    it('should render a select filter', () => {
      props.properties = [
        {
          content: 'aContent',
          name: 'selectFilter',
          label: 'selectLabel',
          type: 'select',
          options: [{ label: 'option1' }],
        },
        {
          content: 'aContent',
          name: 'multiselectFilter',
          label: 'multiselectLabel',
          type: 'multiselect',
          options: [{ label: 'option3' }],
        },
        {
          content: 'aContent',
          name: 'relationshipFilter',
          label: 'relationshipLabel',
          type: 'relationship',
          options: [{ label: 'option2' }],
        },
      ];
      props.translationContext = 'oneContext';

      const component = shallow(<FiltersFromProperties {...props} />).find(SelectFilter);
      expect(component).toMatchSnapshot();
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
      props.translationContext = 'oneContext';
      t.mockImplementation(() => 'translatedOption');
      const component = shallow(<FiltersFromProperties {...props} />).find(SelectFilter);
      expect(t).toHaveBeenCalledWith('thesaurus1', 'option1');
      expect(t).toHaveBeenCalledWith('thesaurus2', 'option2');
      expect(component.get(0).props.options[0].label).toBe('translatedOption');
      expect(component.get(1).props.options[0].label).toBe('translatedOption');
    });
  });

  describe('when type is date, multidate, multidaterange or daterange', () => {
    it('should render a date filter', () => {
      props.properties = [
        {
          content: 'oneContent',
          name: 'dateFilter',
          label: 'dateLabel',
          type: 'date',
        },
        {
          content: 'oneContent',
          name: 'daterange',
          label: 'daterangeLabel',
          type: 'daterange',
        },
        {
          content: 'oneContent',
          name: 'multidate',
          label: 'multidateLabel',
          type: 'multidate',
        },
        {
          content: 'oneContent',
          name: 'multidaterange',
          label: 'multidaterangeLabel',
          type: 'multidaterange',
        },
      ];
      props.translationContext = 'oneContext';

      const component = shallow(<FiltersFromProperties {...props} />).find(DateFilter);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when type is numeric', () => {
    it('should render a number range filter', () => {
      props.properties = [
        {
          name: 'numericFilter',
          label: 'numericLabel',
          type: 'numeric',
        },
      ];
      props.translationContext = 'oneContext';

      const component = shallow(<FiltersFromProperties {...props} />).find(NumberRangeFilter);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when type is nested', () => {
    it('should render a number range filter', () => {
      props.properties = [
        {
          name: 'nestedFilter',
          label: 'nestedLabel',
          type: 'nested',
        },
      ];
      props.translationContext = 'oneContext';

      const component = shallow(<FiltersFromProperties {...props} />).find(NestedFilter);
      expect(component).toMatchSnapshot();
    });
  });
});
