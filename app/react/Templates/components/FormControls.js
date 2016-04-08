import React, {Component, PropTypes} from 'react';
import {reduxForm, touchWithKey, touch, touchAll} from 'redux-form';
import {Link} from 'react-router';
import {bindActionCreators} from 'redux';

import {resetTemplate, saveTemplate} from 'app/Templates/actions/templateActions';

export class FormControls extends Component {


  submit(e) {
    e.preventDefault();

    this.props.properties.forEach((prop, index) => {
      this.props.touchWithKey('template', index.toString(), 'content', 'label', 'required', 'filter');
    });

    this.props.touch('template', 'name');
    this.props.handleSubmit(this.props.saveTemplate)();
  }

  render() {
    return (
      <form onSubmit={this.submit.bind(this)}>
        <Link to="/metadata" className="btn btn-default">Cancel</Link>
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
  handleSubmit: PropTypes.func,
  touchWithKey: PropTypes.func,
  touch: PropTypes.func,
  touchAll: PropTypes.func,
  properties: PropTypes.array
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

FormControls.propTypes = {
  saveTemplate: PropTypes.func
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({resetTemplate, saveTemplate, touchWithKey, touch, touchAll}, dispatch);
}

export function mapStateToProps(state) {
  let template = state.template.data.toJS();
  let fields = ['name', 'properties[]', '_id', '_rev'];
  return {
    initialValues: template,
    fields: fields,
    properties: template.properties,
    validate
  };
}

let form = reduxForm({
  form: 'template'
},
mapStateToProps, mapDispatchToProps)(FormControls);

export default form;
