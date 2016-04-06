import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {reduxForm} from 'redux-form';

import {updateTemplate} from 'app/Templates/actions/templateActions';

export class FormName extends Component {
  render() {
    const {fields: {name}} = this.props;
    return (
      <form onChange={() => {
        setTimeout(() => {
          this.props.updateTemplate(this.props.values);
        });
      }}>
        <div className={'form-group' + (name.touched && name.invalid ? ' has-error' : '')}>
          <input className="form-control" placeholder="Template name" type="text" {...name}/>
        </div>
      </form>
    );
  }
}

FormName.propTypes = {
  fields: PropTypes.object,
  updateTemplate: PropTypes.func,
  values: PropTypes.object
};

const validate = (values) => {
  let errors = {};

  if (!values.name) {
    errors.name = 'Required';
  }

  return errors;
};

export function mapStateToProps(state) {
  return {
    initialValues: {name: state.template.data.toJS().name},
    fields: ['name'],
    validate
  };
}

let form = reduxForm({
  form: 'template'
},
mapStateToProps,
(dispatch) => {
  return bindActionCreators({updateTemplate}, dispatch);
}
)(FormName);

export default form;
