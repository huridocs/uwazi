/** @format */

import { Dispatch } from 'redux';
import { MetadataObject } from 'api/entities/entitiesModel';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { actions as formActions, getModel } from 'react-redux-form';
import { Icon } from 'UI';
import { propertyTypes } from 'shared/propertyTypes';
import { t } from 'app/I18N';

const defaultProps = {
  // The suggestions value, provided by redux Component.
  value: [] as MetadataObject<string>[],
  // The 'main' value, provided by mapStateToProps.
  selectValue: [] as string[],
  acceptSuggestion: (
    _suggestion: string,
    _propertyType: string,
    _selectModel: string,
    _selectValue: string[]
  ) => {},
  onChange: (_event: any) => {},
};

export type MultiSuggestProps = typeof defaultProps & {
  // The template property type.
  propertyType: string;

  // The state model path of the suggestions.
  // Rejected suggestions will be removed from here.
  model: string;

  // The state model path of the 'main' multi-select.
  // Accepted suggestions will be added there.
  selectModel: string;
};

export function acceptSuggestion(
  suggestion: string,
  propertyType: string,
  selectModel: string,
  selectValue: string[]
) {
  return (dispatch: Dispatch<{}>) => {
    switch (propertyType) {
      case propertyTypes.multiselect:
        if (!selectValue.includes(suggestion)) {
          dispatch(formActions.change(selectModel, [...selectValue, suggestion]));
        }
        break;
      case propertyTypes.select:
        if (!selectValue.length || selectValue[0] !== suggestion) {
          dispatch(formActions.change(selectModel, suggestion));
        }
        break;
      default:
        break;
    }
  };
}

export class MultiSuggestBase extends Component<MultiSuggestProps> {
  public static defaultProps = defaultProps;

  static confidenceBlob(suggestionConfidence?: number) {
    let label = 'low';
    if ((suggestionConfidence ?? 0.0) >= 0.75) {
      label = 'high';
    } else if ((suggestionConfidence ?? 0.0) >= 0.5) {
      label = 'medium';
    }
    return <span className={`multiselectItem-confidence ${label}`}>{label}</span>;
  }

  acceptSuggestion(id: string) {
    const { propertyType, selectModel, selectValue } = this.props;
    this.props.acceptSuggestion(id, propertyType, selectModel, selectValue);
  }

  rejectSuggestion(id: string, e: any) {
    // Don't bubble the event up to onClick handlers of parents.
    e.stopPropagation();
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
    const { selectValue, value: proposedValues } = this.props;
    const filteredValues = proposedValues.filter(
      value => value.value && !selectValue.includes(value.value)
    );
    if (!filteredValues.length) {
      return null;
    }
    return (
      <div className="suggestions multiselect">
        <b className="suggestions-title">
          {t('System', 'Suggestions')} <span>({filteredValues.length})</span>
        </b>
        {filteredValues.map(value => (
          <div key={value.value!} className="multiselectItem">
            <label
              className="multiselectItem-label"
              onClick={this.acceptSuggestion.bind(this, value.value!)}
            >
              <span className="multiselectItem-icon">
                <Icon icon={['far', 'square']} className="checkbox-empty" />
              </span>
              <span className="multiselectItem-name">{value.label}</span>
              {MultiSuggestBase.confidenceBlob(value.suggestion_confidence)}
              <div
                className="multiselectItem-button"
                onClick={this.rejectSuggestion.bind(this, value.value!)}
              >
                Reject
              </div>
            </label>
          </div>
        ))}
      </div>
    );
  }
}

export function mapStateToProps(state: any, props: Pick<MultiSuggestProps, 'selectModel'>) {
  let { selectModel } = props;
  if (selectModel && selectModel[0] === '.') {
    // TODO(bdittes): Correctly inherit parent path.
    selectModel = `entityView.entityForm${selectModel}`;
  }
  const rawValue = getModel<any, string[] | string>(state, selectModel) || [];
  return { selectModel, selectValue: Array.isArray(rawValue) ? rawValue : [rawValue] };
}

export const MultiSuggest = connect(mapStateToProps, { acceptSuggestion })(MultiSuggestBase);
