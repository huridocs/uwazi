/** @format */

import { MetadataObject } from 'api/entities/entitiesModel';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { actions as formActions, getModel } from 'react-redux-form';
import { Icon } from 'UI';
import { propertyTypes } from 'shared/propertyTypes';

export interface MultiSuggestProps {
  // model: state model of suggestions, required through <Control>.

  propertyType: string;

  // The state model path of the 'main' multi-select.
  // Accepted suggestions will be added there.
  selectModel: string;

  // redux-form-provided
  value?: MetadataObject<string>[];
  onChange: (event: any) => void;

  // connect-provided
  selectValue?: string[];
  acceptSuggestion: (
    suggestion: string,
    propertyType: string,
    selectModel: string,
    selectValue: string[]
  ) => any;
}

function acceptSuggestion(
  suggestion: string,
  propertyType: string,
  selectModel: string,
  selectValue: string[]
) {
  return (dispatch: (_: any) => void) => {
    if (propertyType === propertyTypes.multiselect) {
      if (!selectValue.includes(suggestion)) {
        dispatch(formActions.change(selectModel, [...selectValue, suggestion]));
      }
    } else if (propertyType === propertyTypes.select) {
      if (!selectValue || selectValue[0] !== suggestion) {
        dispatch(formActions.change(selectModel, suggestion));
      }
    }
  };
}

function mapStateToProps(state: any, props: MultiSuggestProps) {
  let { selectModel } = props;
  if (selectModel && selectModel[0] === '.') {
    // TODO(bdittes): Correctly inherit parent path.
    selectModel = `entityView.entityForm${selectModel}`;
  }
  const rawValue = getModel<any, string[] | string>(state, selectModel) || [];
  return { selectModel, selectValue: Array.isArray(rawValue) ? rawValue : [rawValue] };
}

export const MultiSuggest = connect(
  mapStateToProps,
  { acceptSuggestion }
)(
  class MultiSuggestBase extends Component<MultiSuggestProps> {
    rejectSuggestion(id: string, e: any) {
      e.preventDefault();
      const suggestedValues = (this.props.value || []).slice();
      const index = suggestedValues.findIndex(v => v.value === id);
      if (index < 0) {
        return;
      }
      suggestedValues.splice(index, 1);
      this.props.onChange(suggestedValues);
    }

    render() {
      const { propertyType, selectModel, selectValue, value: proposedValues } = this.props;
      const filteredValues = !proposedValues
        ? []
        : proposedValues.filter(value => value.value && !selectValue!.includes(value.value));
      if (!filteredValues.length) {
        return null;
      }
      return (
        <div className="multiselect">
          <b>Suggestions ({filteredValues.length}):</b>
          {(() =>
            filteredValues.map(value => (
              <div key={value.value!} className="multiselectItem">
                <label className="multiselectItem-label">
                  <span className="multiselectItem-icon">
                    <Icon
                      icon={['far', 'square']}
                      className="checkbox-empty"
                      onClick={() =>
                        this.props.acceptSuggestion(
                          value.value || '',
                          propertyType,
                          selectModel,
                          selectValue!
                        )
                      }
                    />
                  </span>
                  <span
                    className="multiselectItem-name"
                    onClick={() =>
                      this.props.acceptSuggestion(
                        value.value || '',
                        propertyType,
                        selectModel,
                        selectValue!
                      )
                    }
                  >
                    {value.label}
                    {value.suggestion_confidence && value.suggestion_confidence < 0.6 ? ' ?' : ''}
                  </span>
                  <div
                    className="multiselectItem-button"
                    onClick={this.rejectSuggestion.bind(this, value.value!)}
                  >
                    Reject
                  </div>
                </label>
              </div>
            )))()}
          <b>Selected item(s):</b>
        </div>
      );
    }
  }
);
