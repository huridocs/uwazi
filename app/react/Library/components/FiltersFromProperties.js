import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

import { t } from 'app/I18N';
import FormGroup from 'app/DocumentForm/components/FormGroup';
import { getAggregationSuggestions } from 'app/Library/actions/libraryActions';
import { selectTemplates } from 'app/utils/coreSelectors';
import DateFilter from './DateFilter';
import NestedFilter from './NestedFilter';
import NumberRangeFilter from './NumberRangeFilter';
import SelectFilter from './SelectFilter';
import TextFilter from './TextFilter';

const prepareOptions = property => {
  const filteredProperty = {
    ...property,
    options: property.options.filter(option => option.id !== 'any'),
  };
  return filteredProperty.options.map(option => {
    const finalTranslatedOption = {
      ...option,
      label: t(filteredProperty.content, option.label, undefined, false),
    };

    if (option.options) {
      const translatedSubOptions = option.options.map(subOption => ({
        ...subOption,
        label: t(filteredProperty.content, subOption.label, undefined, false),
      }));
      finalTranslatedOption.options = translatedSubOptions;
    }
    return finalTranslatedOption;
  });
};

export const FiltersFromProperties = ({
  onChange,
  properties,
  translationContext,
  modelPrefix = '',
  storeKey,
  templates,
  ...props
}) => (
  <>
    {properties.map(property => {
      const { type } = property.inherit?.property ? property.inherit : property;

      const commonProps = {
        model: `.filters${modelPrefix}.${property.name}`,
        label: t(translationContext, property.label),
        onChange,
      };

      const propertyOptions = property.options ? prepareOptions(property) : [];

      let filter = <TextFilter {...commonProps} />;

      if (type === 'numeric') {
        filter = <NumberRangeFilter {...commonProps} />;
      }

      if (['select', 'multiselect', 'relationship'].includes(type)) {
        filter = (
          <SelectFilter
            {...commonProps}
            lookup={getAggregationSuggestions.bind(null, storeKey, property.name)}
            options={propertyOptions}
            prefix={property.name}
            showBoolSwitch={property.type === 'multiselect' || property.type === 'relationship'}
            sort={property.type === 'relationship'}
            totalPossibleOptions={property.totalPossibleOptions}
            allowSelectGroup
          />
        );
      }

      if (type === 'nested') {
        filter = (
          <NestedFilter {...commonProps} property={property} aggregations={props.aggregations} />
        );
      }

      if (
        type === 'date' ||
        type === 'multidate' ||
        type === 'multidaterange' ||
        type === 'daterange'
      ) {
        filter = <DateFilter {...commonProps} format={props.dateFormat} />;
      }

      return <FormGroup key={property.name}>{filter}</FormGroup>;
    })}
  </>
);

FiltersFromProperties.defaultProps = {
  onChange: () => {},
  dateFormat: '',
  modelPrefix: '',
  translationContext: '',
};

FiltersFromProperties.propTypes = {
  templates: PropTypes.instanceOf(Array).isRequired,
  onChange: PropTypes.func,
  dateFormat: PropTypes.string,
  modelPrefix: PropTypes.string,
  translationContext: PropTypes.string,
  storeKey: PropTypes.string.isRequired,
  aggregations: PropTypes.instanceOf(Immutable.Map).isRequired,
  properties: PropTypes.array.isRequired,
};

export function mapStateToProps(state, props) {
  return {
    dateFormat: state.settings.collection.get('dateFormat'),
    aggregations: state[props.storeKey].aggregations,
    storeKey: props.storeKey,
    templates: selectTemplates(state),
  };
}

export default connect(mapStateToProps)(FiltersFromProperties);
