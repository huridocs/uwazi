import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

import { t } from 'app/I18N';
import FormGroup from 'app/DocumentForm/components/FormGroup';

import DateFilter from './DateFilter';
import NestedFilter from './NestedFilter';
import NumberRangeFilter from './NumberRangeFilter';
import SelectFilter from './SelectFilter';
import TextFilter from './TextFilter';
import RelationshipFilter from './RelationshipFilter';

const translatedOptions = property =>
  property.options.map(option => {
    option.label = t(property.content, option.label, null, false);
    if (option.values) {
      option.options = option.values.map(val => {
        val.label = t(property.content, val.label, null, false);
        return val;
      });
    }
    return option;
  });

export const FiltersFromProperties = ({
  onChange,
  properties,
  translationContext,
  modelPrefix = '',
  ...props
}) => (
  <React.Fragment>
    {properties.map(property => {
      const commonProps = {
        model: `.filters${modelPrefix}.${property.name}`,
        label: t(translationContext, property.label),
        onChange,
      };

      let filter = <TextFilter {...commonProps} />;

      if (property.type === 'relationshipfilter') {
        filter = (
          <RelationshipFilter
            {...commonProps}
            storeKey={props.storeKey}
            translationContext={translationContext}
            property={property}
          />
        );
      }

      if (property.type === 'numeric') {
        filter = <NumberRangeFilter {...commonProps} />;
      }

      if (
        property.type === 'select' ||
        property.type === 'multiselect' ||
        property.type === 'relationship'
      ) {
        filter = (
          <SelectFilter
            {...commonProps}
            options={translatedOptions(property)}
            prefix={property.name}
            showBoolSwitch={property.type === 'multiselect' || property.type === 'relationship'}
            sort={property.type === 'relationship'}
          />
        );
      }

      if (property.type === 'nested') {
        filter = (
          <NestedFilter {...commonProps} property={property} aggregations={props.aggregations} />
        );
      }

      if (
        property.type === 'date' ||
        property.type === 'multidate' ||
        property.type === 'multidaterange' ||
        property.type === 'daterange'
      ) {
        filter = <DateFilter {...commonProps} format={props.dateFormat} />;
      }

      return <FormGroup key={property.name}>{filter}</FormGroup>;
    })}
  </React.Fragment>
);

FiltersFromProperties.defaultProps = {
  onChange: () => {},
  dateFormat: '',
  modelPrefix: '',
  translationContext: '',
};

FiltersFromProperties.propTypes = {
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
  };
}

export default connect(mapStateToProps)(FiltersFromProperties);
