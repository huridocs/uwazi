/** @format */

import { MetadataObject } from 'api/entities/entitiesModel';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { actions as formActions, getModel } from 'react-redux-form';
import { Icon } from 'UI';

export interface MultiSuggestProps {
  // model: state model of suggestions, required through <Control>.

  // The state model path of the 'main' multi-select.
  // Accepted suggestions will be added there.
  selectModel: string;

  // redux-form-provided
  value?: MetadataObject<string>[];
  onChange: (event: any) => void;

  // connect-provided
  selectValue?: string[];
  acceptSuggestion: (suggestion: string, selectModel: string, selectValue?: string[]) => any;
}

function acceptSuggestion(suggestion: string, selectModel: string, selectValue?: string[]) {
  return (dispatch: (_: any) => void) => {
    if (!(selectValue || []).includes(suggestion)) {
      dispatch(formActions.change(selectModel, [...(selectValue || []), suggestion]));
    }
  };
}

function mapStateToProps(state: any, props: MultiSuggestProps) {
  let { selectModel } = props;
  if (selectModel && selectModel[0] === '.') {
    // TODO(bdittes): Correctly inherit parent path.
    selectModel = `entityView.entityForm${selectModel}`;
  }
  return { selectModel, selectValue: getModel<any, string[]>(state, selectModel) };
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
      const { selectModel, selectValue, value: proposedValues } = this.props;
      const filteredValues = !proposedValues
        ? []
        : proposedValues.filter(value => value.value && !(selectValue || []).includes(value.value));
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
                        this.props.acceptSuggestion(value.value || '', selectModel, selectValue)
                      }
                    />
                  </span>
                  <span
                    className="multiselectItem-name"
                    onClick={() =>
                      this.props.acceptSuggestion(value.value || '', selectModel, selectValue)
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
          <b>Selected items:</b>
        </div>
      );
    }
  }
);
