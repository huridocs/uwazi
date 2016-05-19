import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {reduxForm} from 'redux-form';
import {validateProperty} from 'app/Templates/components/ValidateTemplate';

import {updateProperty} from 'app/Templates/actions/templateActions';
import FilterSuggestions from 'app/Templates/components/FilterSuggestions';

export class FormConfigInput extends Component {

  render() {
    const {fields: {label, required, filter, type}} = this.props;
    return (
      <form onChange={() => {
        setTimeout(() => {
          this.props.updateProperty(this.props.values, this.props.index);
        });
      }}>
        <div className="row">
          <div className="col-sm-4">
            <div className={'input-group ' + (label.touched && label.invalid ? ' has-error' : '')}>
              <span className="input-group-addon">Label</span>
              <input className="form-control" type="text" {...label} onChange={(e) => label.onChange(e)}/>
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
              <input type="checkbox" {...filter}/>
              &nbsp;
              <label>Use as library filter</label><small>This property will be used togheter for filtering with other equal to him.</small>
            </div>
            <div className="col-sm-8">
              <FilterSuggestions label={label.value} type={type.value} filter={filter.value} />
            </div>
          </div>
        </div>
      </form>
    );
  }
}

FormConfigInput.propTypes = {
  fields: PropTypes.object,
  updateProperty: PropTypes.func,
  values: PropTypes.object,
  index: PropTypes.number
};

export function mapStateToProps(state, props) {
  let properties = state.template.data.toJS().properties;
  return {
    initialValues: properties[props.index],
    fields: ['label', 'required', 'filter', 'type'],
    validate: () => {
      return validateProperty(properties[props.index], properties);
    },
    parentTemplateId: state.template.data.toJS()._id
  };
}

let form = reduxForm({form: 'template'},
mapStateToProps,
(dispatch) => {
  return bindActionCreators({updateProperty}, dispatch);
}
)(FormConfigInput);

export default form;
