import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { FilterSuggestions } from 'app/Templates/components/FilterSuggestions';
import { connect } from 'react-redux';
import { Translate } from 'app/I18N';
import PropertyConfigOption from './PropertyConfigOption';
import Tip from '../../Layout/Tip';

class PropertyConfigOptions extends Component {
  render() {
    const { index, filter, type, canBeFilter } = this.props;
    return (
      <div>
        <PropertyConfigOption
          label="Hide label"
          model={`template.data.properties[${index}].noLabel`}
        >
          <Tip>
            <Translate>This property will be shown without the label.</Translate>
          </Tip>
        </PropertyConfigOption>
        <PropertyConfigOption
          label="Required property"
          model={`template.data.properties[${index}].required`}
        >
          <Tip>
            <Translate translationKey="empty property tip">
              You won&#39;t be able to save an entity if this property is empty.
            </Translate>
          </Tip>
        </PropertyConfigOption>
        <PropertyConfigOption
          label="Show in cards"
          model={`template.data.properties[${index}].showInCard`}
        >
          <Tip>
            <Translate>
              This property will appear in the library cards as part of the basic info.
            </Translate>
          </Tip>
        </PropertyConfigOption>

        {canBeFilter && (
          <div className="inline-group">
            <PropertyConfigOption
              label="Use as filter"
              model={`template.data.properties[${index}].filter`}
            >
              <Tip>
                <Translate translationKey="Property as filter description">
                  This property will be used for filtering the library results. When properties
                  match in equal name and field type with other entity types, they will be combined
                  for filtering.
                </Translate>
              </Tip>
            </PropertyConfigOption>
            {filter && (
              <>
                <PropertyConfigOption
                  label="Default filter"
                  model={`template.data.properties[${index}].defaultfilter`}
                >
                  <Tip>
                    <Translate translationKey="Property as default filter description">
                      Use this property as a default filter in the library. When there are no entity
                      types selected, this property will show as a default filter for your
                      collection.
                    </Translate>
                  </Tip>
                </PropertyConfigOption>
                {['text', 'date', 'numeric', 'select'].includes(type) && (
                  <PropertyConfigOption
                    label="Priority sorting"
                    model={`template.data.properties[${index}].prioritySorting`}
                  >
                    <Tip>
                      <Translate translationKey="Priority sorting description">
                        Properties marked as priority sorting will be used as default sorting
                        criteria. If more than one property is marked as priority sorting the system
                        will try to pick-up the best fit. When listing mixed template types, the
                        system will pick-up the best combined priority sorting.
                      </Translate>
                    </Tip>
                  </PropertyConfigOption>
                )}
              </>
            )}
          </div>
        )}
        <FilterSuggestions index={index} />
      </div>
    );
  }
}

PropertyConfigOptions.defaultProps = {
  canBeFilter: true,
  filter: false,
};

PropertyConfigOptions.propTypes = {
  filter: PropTypes.bool,
  index: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  canBeFilter: PropTypes.bool,
};

export function mapStateToProps({ template }, props) {
  return {
    filter: template.data.properties[props.index].filter,
  };
}

export default connect(mapStateToProps)(PropertyConfigOptions);
