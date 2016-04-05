import React, {Component, PropTypes} from 'react';
import {reduxForm} from 'redux-form';
import {Link} from 'react-router';

export class FormControls extends Component {
  render() {
    return (
      <form onSubmit={this.props.handleSubmit}>
        <Link to="/templates" className="btn btn-default">Cancel</Link>
        <button className="btn btn-success save-template">
          <i className="fa fa-save"/> Save Template
        </button>
      </form>
    );
  }
}

FormControls.propTypes = {
  fields: PropTypes.object,
  values: PropTypes.object,
  handleSubmit: PropTypes.func
};

const validate = (values) => {
  let errors = {};

  if (!values.name) {
    errors.name = 'Required';
  }
  errors.properties = [];
  values.properties.forEach((property, index) => {
    errors.properties[index] = {};
    if (!property.label) {
      errors.properties[index].label = 'Required';
    }

    let isSelect = property.type === 'list' || property.type === 'select';
    if (isSelect && !property.content) {
      errors.properties[index].content = 'Required';
    }
  });

  return errors;
};

export function mapStateToProps(state) {
  let template = state.template.data.toJS();
  let fields = ['name', 'properties[]'];
  return {
    initialValues: template,
    fields: fields,
    validate,
    onSubmit: (data) => {
      console.log('SUBMITED: ', data);
    }
  };
}

let form = reduxForm({
  form: 'template'
},
mapStateToProps)(FormControls);

export default form;
