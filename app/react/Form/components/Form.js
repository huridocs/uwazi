import React, {Component, PropTypes} from 'react';

import ID from 'app/utils/uniqueID';

export class Form extends Component {

  render() {
    const {fieldsConfig, fields} = this.props;
    return (
      <form>
      {fieldsConfig.map((field) => {
        if (field.type === 'select') {
          return <select key={ID()} {...fields[field.name]}/>;
        }
        return <input key={ID()} {...fields[field.name]}/>;
      })}
      </form>
    );
  }

}

Form.propTypes = {
  fieldsConfig: PropTypes.array,
  fields: PropTypes.object
};

export default Form;
