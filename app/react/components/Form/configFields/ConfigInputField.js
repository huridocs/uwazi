import React, {Component, PropTypes} from 'react';
import ConfigFieldPanel from '../ConfigFieldPanel';
import Field from '../fields/Field';

class ConfigInputField extends Component {

  render() {
    return (
      <div className="row config-field">
        <div className="col-xs-9">+
          <Field config={this.props.field}/>
        </div>
        <div className="col-xs-3 config-field_buttons">
          <ConfigFieldPanel remove={this.props.remove} field={this.props.field} save={this.props.save} />
        </div>
      </div>
    );
  }
}

ConfigInputField.propTypes = {
  field: PropTypes.string,
  remove: PropTypes.func,
  save: PropTypes.func
};

export default ConfigInputField;
