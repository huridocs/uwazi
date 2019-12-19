/** @format */

import React, { Component } from 'react';
import { MetadataObject } from 'api/entities/entitiesModel';
import { actions as formActions, getModel } from 'react-redux-form';
import { connect } from 'react-redux';

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
    selectModel = `entityView.entityForm${selectModel}`;
  }
  return { selectModel, selectValue: getModel<any, string[]>(state, selectModel) };
}

export const MultiSuggest = connect(
  mapStateToProps,
  { acceptSuggestion }
)(
  class MultiSuggestBase extends Component<MultiSuggestProps> {
    rejectSuggestion(index: number, e: any) {
      e.preventDefault();
      const suggestedValues = (this.props.value || []).slice();
      suggestedValues.splice(index, 1);
      this.props.onChange(suggestedValues);
    }

    render() {
      const { selectModel, selectValue, value: proposedValue } = this.props;
      if (!proposedValue || !proposedValue.length) {
        return null;
      }
      return (
        <div className="MultiDate">
          {(() =>
            proposedValue
              .filter(value => value.value)
              .map((value, index) =>
                (selectValue || []).includes(value.value || '') ? null : (
                  <div key={index} className="MultiDate-item">
                    {value.label}
                    {value.suggestion_confidence && value.suggestion_confidence < 0.6 ? ' ?' : ''}
                    <button
                      className="btn"
                      onClick={() =>
                        this.props.acceptSuggestion(value.value || '', selectModel, selectValue)
                      }
                    >
                      +
                    </button>
                    <button className="btn" onClick={this.rejectSuggestion.bind(this, index)}>
                      -
                    </button>
                  </div>
                )
              ))()}
        </div>
      );
    }
  }
);
