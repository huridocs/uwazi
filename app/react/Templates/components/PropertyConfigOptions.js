import PropTypes from 'prop-types';
import React, { Component } from 'react';
import FilterSuggestions from 'app/Templates/components/FilterSuggestions';

import PropertyConfigOption from './PropertyConfigOption';
import Tip from '../../Layout/Tip';

class PropertyConfigOptions extends Component {
  render() {
    const { index, property, type, canBeFilter } = this.props;
    return (
      <div>
        <PropertyConfigOption label="Hide label" model={`template.data.properties[${index}].noLabel`}>
          <Tip>This property will be shown without the label.</Tip>
        </PropertyConfigOption>
        <PropertyConfigOption label="Required property" model={`template.data.properties[${index}].required`}>
          <Tip>You won&#39;t be able to publish a document if this property is empty.</Tip>
        </PropertyConfigOption>
        <PropertyConfigOption label="Show in cards" model={`template.data.properties[${index}].showInCard`}>
          <Tip>This property will appear in the library cards as part of the basic info.</Tip>
        </PropertyConfigOption>

        {canBeFilter && (
          <div className="inline-group">
            <PropertyConfigOption label="Use as filter" model={`template.data.properties[${index}].filter`}>
              <Tip>
                This property will be used for filtering the library results.
                When properties match in equal name and field type with other document types, they will be combined for filtering.
              </Tip>
            </PropertyConfigOption>
            {property.filter && (
              <React.Fragment>
                <PropertyConfigOption label="Default filter" model={`template.data.properties[${index}].defaultfilter`}>
                  <Tip>
                    Use this property as a default filter in the library.
                    When there are no document types selected, this property will show as a default filter for your collection.
                  </Tip>
                </PropertyConfigOption>
                {['text', 'date', 'numeric', 'select'].includes(type) && (
                  <PropertyConfigOption label="Priority sorting" model={`template.data.properties[${index}].prioritySorting`}>
                    <Tip>
                      Properties marked as priority sorting will be used as default sorting criteria.
                      If more than one property is marked as priority sorting the system will try to pick-up the best fit.
                      When listing mixed template types, the system will pick-up the best combined priority sorting.
                    </Tip>
                  </PropertyConfigOption>
                )}
              </React.Fragment>)
            }
            <FilterSuggestions {...property} />
          </div>
        )}
      </div>
    );
  }
}

PropertyConfigOptions.defaultProps = {
  canBeFilter: true,
};

PropertyConfigOptions.propTypes = {
  property: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  canBeFilter: PropTypes.bool,
};


export default PropertyConfigOptions;
