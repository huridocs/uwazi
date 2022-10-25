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

import { withRouter } from 'react-router';
import rison from 'rison-node';

const optionUrl = (value, name, query) => {
  const q = rison.encode({
    ...query,
    filters: { ...query.filters, [name]: { values: [value] } },
    from: 0,
    limit: 30,
    includeUnpublished: false,
    order: 'desc',
    sort: 'creationDate',
    unpublished: false,
    allAggregations: false,
  });

  return `/library/?q=${q}`;
};

const prepareOptions = (property, location) => {
  const { q = '(filters:())' } = location.query;

  const query = rison.decode(q);
  const filteredProperty = {
    ...property,
    options: property.options.filter(option => option.id !== 'any'),
  };
  return filteredProperty.options.map(option => {
    const finalTranslatedOption = {
      ...option,
      label:
        option.id === 'missing'
          ? t('System', 'No Label', undefined, false)
          : t(filteredProperty.content, option.label, undefined, false),
      url: optionUrl(option.value, property.name, query),
    };

    if (option.options) {
      const translatedSubOptions = option.options.map(subOption => ({
        ...subOption,
        label: t(filteredProperty.content, subOption.label, undefined, false),
        url: optionUrl(subOption.value, property.name, query),
      }));
      finalTranslatedOption.options = translatedSubOptions;
    }

    return finalTranslatedOption;
  });
};

const FiltersFromProperties = ({
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

      console.log(props);
      const propertyOptions = property.options ? prepareOptions(property, props.location) : [];

      let filter = <TextFilter {...commonProps} />;

      switch (type) {
        case 'numeric':
          filter = <NumberRangeFilter {...commonProps} />;
          break;

        case 'select':
        case 'multiselect':
        case 'relationship':
          filter = (
            <SelectFilter
              {...commonProps}
              lookup={getAggregationSuggestions.bind(null, storeKey, property.name)}
              options={propertyOptions}
              prefix={property.name}
              showBoolSwitch={property.type === 'multiselect' || property.type === 'relationship'}
              sort={property.type === 'relationship'}
              totalPossibleOptions={propertyOptions.length}
              allowSelectGroup
            />
          );
          break;

        case 'nested':
          filter = (
            <NestedFilter {...commonProps} property={property} aggregations={props.aggregations} />
          );
          break;

        case 'date':
        case 'multidate':
        case 'multidaterange':
        case 'daterange':
          filter = <DateFilter {...commonProps} format={props.dateFormat} />;
          break;

        default:
          break;
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
  location: PropTypes.object.isRequired,
};

export function mapStateToProps(state, props) {
  return {
    dateFormat: state.settings.collection.get('dateFormat'),
    aggregations: state[props.storeKey].aggregations,
    storeKey: props.storeKey,
    templates: selectTemplates(state),
  };
}

export { FiltersFromProperties };
export default connect(mapStateToProps)(withRouter(FiltersFromProperties));
