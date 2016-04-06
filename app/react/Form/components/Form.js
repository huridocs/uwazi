import React, {Component, PropTypes} from 'react';
import {reduxForm} from 'redux-form';

import Input from 'app/Form/components/Input';
import Select from 'app/Form/components/Select';
import Textarea from 'app/Form/components/Textarea';

export class Form extends Component {

  render() {
    const {fieldsConfig, fields} = this.props;
    return (
      <form>
      {fieldsConfig.map((field, index) => {
        if (field.type === 'select') {
          return <Select key={index} properties={fields[field.name]} label={field.label} options={field.options} />;
        }
        if (field.type === 'textarea') {
          return <Textarea key={index} properties={fields[field.name]} label={field.label} options={field.options} />;
        }
        return <Input key={index} properties={fields[field.name]} label={field.label} />;
      })}
      </form>
    );
  }

}

Form.propTypes = {
  fieldsConfig: PropTypes.array,
  fields: PropTypes.object
};

export function mapStateToProps(state, props) {
  return {
    fields: props.fieldsConfig.map((field) => field.name),
    fieldsConfig: props.fieldsConfig
  };
}

let form = reduxForm(null,
mapStateToProps
)(Form);

export default form;
