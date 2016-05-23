import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {reduxForm} from 'redux-form';
import {validateProperty} from 'app/Templates/components/ValidateTemplate';

import {updateProperty} from 'app/Templates/actions/templateActions';
import FilterSuggestions from 'app/Templates/components/FilterSuggestions';

export class FormConfigSelect extends Component {
  render() {
    const {fields: {label, content, required, filter, type}} = this.props;
    return (
      <form onChange={() => {
        setTimeout(() => {
          this.props.updateProperty(this.props.values, this.props.index);
        });
      }}>
        <div className="row">
          <div className="col-sm-4">
            <div className={'input-group' + (label.touched && label.invalid ? ' has-error' : '')}>
              <span className="input-group-addon">Label</span>
              <input className="form-control" type="text" {...label} />
            </div>
          </div>
          <div className="col-sm-4">
            <div className={'input-group' + (content.touched && content.invalid ? ' has-error' : '')}>
              <span className="input-group-addon">Thesauri</span>
              <select value='' className="form-control" type="text" {...content}>
                <option value='' disabled>Select thesauri</option>
                {this.props.thesauris.map((thesauri) => {
                  return <option key={thesauri._id} value={thesauri._id}>{thesauri.name}</option>;
                })}
              </select>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="input-group">
              <span className="input-group-addon">
                <input id={'required' + this.props.index} type="checkbox" {...required} />
              </span>
              <label htmlFor={'required' + this.props.index} className="form-control">Required field</label>
            </div>
          </div>
        </div>
        <div className="well">
          <div className="row">
            <div className="col-sm-4">
              <input id={'filter' + this.props.index} type="checkbox" {...filter}/>
              &nbsp;
              <label htmlFor={'filter' + this.props.index}>Use as library filter</label>
              <small>This property will be used togheter for filtering with other equal to him.</small>
            </div>
            <div className="col-sm-8">
              <FilterSuggestions label={label.value} type={type.value} filter={filter.value} content={content.value} />
            </div>
          </div>
        </div>
      </form>
    );
  }
}

FormConfigSelect.propTypes = {
  fields: PropTypes.object,
  updateProperty: PropTypes.func,
  values: PropTypes.object,
  thesauris: PropTypes.array,
  index: PropTypes.number
};

export function mapStateToProps(state, props) {
  let properties = state.template.data.toJS().properties;
  return {
    initialValues: properties[props.index],
    thesauris: state.template.uiState.toJS().thesauris,
    fields: ['label', 'content', 'required', 'filter', 'type'],
    validate: () => {
      return validateProperty(properties[props.index], properties);
    }
  };
}

let form = reduxForm({form: 'template'},
mapStateToProps,
(dispatch) => {
  return bindActionCreators({updateProperty}, dispatch);
}
)(FormConfigSelect);

export default form;
