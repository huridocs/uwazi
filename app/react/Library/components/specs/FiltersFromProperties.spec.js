import Immutable from 'immutable';
import React from 'react';

import { shallow } from 'enzyme';

import { FiltersFromProperties, mapStateToProps } from '../FiltersFromProperties';
import DateFilter from '../DateFilter';
import NestedFilter from '../NestedFilter';
import NumberRangeFilter from '../NumberRangeFilter';
import SelectFilter from '../SelectFilter';
import TextFilter from '../TextFilter';
import RelationshipFilter from '../RelationshipFilter';

describe('FiltersFromProperties', () => {
  let props = {};

  beforeEach(() => {
    const state = {
      settings: { collection: Immutable.fromJS({ dateFormat: 'dateFormat' }) },
      library: { aggregations: Immutable.fromJS({ aggregations: 'aggregations' }) },
    };

    props = mapStateToProps(state, { storeKey: 'library' });
  });

  it('should concat the modelPrefix with the model', () => {
    props.properties = [{ name: 'textFilter', label: 'textLabel' }];

    props.modelPrefix = '.prefix';

    const component = shallow(<FiltersFromProperties {...props} />).find(TextFilter);
    expect(component).toMatchSnapshot();
  });

  describe('when type is text', () => {
    it('should render a text filter', () => {
      props.properties = [{ name: 'textFilter', label: 'textLabel' }];

      const component = shallow(<FiltersFromProperties {...props} />).find(TextFilter);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when type is select, multiselect or relationship', () => {
    it('should render a select filter', () => {
      props.properties = [
        {
          name: 'selectFilter',
          label: 'selectLabel',
          type: 'select',
          options: [{ label: 'option1' }],
        },
        {
          name: 'multiselectFilter',
          label: 'multiselectLabel',
          type: 'multiselect',
          options: [{ label: 'option3' }],
        },
        {
          name: 'relationshipFilter',
          label: 'relationshipLabel',
          type: 'relationship',
          options: [{ label: 'option2' }],
        },
      ];

      const component = shallow(<FiltersFromProperties {...props} />).find(SelectFilter);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when type is date, multidate, multidaterange or daterange', () => {
    it('should render a date filter', () => {
      props.properties = [
        { name: 'dateFilter', label: 'dateLabel', type: 'date' },
        { name: 'daterange', label: 'daterangeLabel', type: 'daterange' },
        { name: 'multidate', label: 'multidateLabel', type: 'multidate' },
        { name: 'multidaterange', label: 'multidaterangeLabel', type: 'multidaterange' },
      ];

      const component = shallow(<FiltersFromProperties {...props} />).find(DateFilter);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when type is numeric', () => {
    it('should render a number range filter', () => {
      props.properties = [{ name: 'numericFilter', label: 'numericLabel', type: 'numeric' }];

      const component = shallow(<FiltersFromProperties {...props} />).find(NumberRangeFilter);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when type is nested', () => {
    it('should render a number range filter', () => {
      props.properties = [{ name: 'nestedFilter', label: 'nestedLabel', type: 'nested' }];

      const component = shallow(<FiltersFromProperties {...props} />).find(NestedFilter);
      expect(component).toMatchSnapshot();
    });
  });
  describe('when type is relationshipFilter', () => {
    it('should render a relationshipFilter', () => {
      props.properties = [
        {
          name: 'relationshipfilter',
          label: 'relationshipfilterLabel',
          type: 'relationshipfilter',
          filters: [{ name: 'filter' }],
        },
      ];

      const component = shallow(<FiltersFromProperties {...props} />).find(RelationshipFilter);
      expect(component).toMatchSnapshot();
    });
  });
});
