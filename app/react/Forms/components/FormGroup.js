import React, {Component, PropTypes} from 'react';
import FormField from './FormField';

export class FormGroup extends Component {

  render() {
    let className = 'form-group';
    if ((this.props.touched === true || this.props.submitFailed) && this.props.valid === false) {
      className += ' has-error';
    }

    let children = React.Children.map(this.props.children, child => child);

    let field = children.filter(child => child.type === FormField);
    let label = children.filter(child => child.type !== FormField);

    return (
      <div className={className}>
        <ul className="search__filter">
          <li>{label}</li>
          <li className="wide">{field}</li>
        </ul>
      </div>
    );
  }

}

let childrenType = PropTypes.oneOfType([
  PropTypes.object,
  PropTypes.array
]);

FormGroup.propTypes = {
  touched: PropTypes.bool,
  valid: PropTypes.bool,
  submitFailed: PropTypes.bool,
  children: childrenType
};

export default FormGroup;
