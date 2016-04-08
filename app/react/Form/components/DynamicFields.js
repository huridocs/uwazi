import React, {Component, PropTypes} from 'react';

import Input from 'app/Form/components/Input';
import Select from 'app/Form/components/Select';
import Textarea from 'app/Form/components/Textarea';

export class DynamicFields extends Component {

  render() {
    const {template, fields} = this.props;
    return (
      <div>
      {template.map((field) => {
        if (field.type === 'select') {
          return <Select key={field.name} properties={fields[field.name]} label={field.label} options={field.options} />;
        }
        if (field.type === 'textarea') {
          return <Textarea key={field.name} properties={fields[field.name]} label={field.label} options={field.options} />;
        }
        return <Input key={field.name} properties={fields[field.name]} label={field.label} />;
      })}
      </div>
    );
  }

}

DynamicFields.propTypes = {
  template: PropTypes.array,
  fields: PropTypes.object
};

export default DynamicFields;
