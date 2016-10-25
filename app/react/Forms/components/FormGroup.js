import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import FormField from './FormField';

export class FormGroup extends Component {

  shouldComponentUpdate(nextProps) {
    return this.props.hasError !== nextProps.hasError;
  }

  render() {
    let className = 'form-group';
    if (this.props.hasError) {
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
  hasError: PropTypes.bool,
  children: childrenType
};

export const mapStateToProps = ({}, props) => {
  return {hasError: (props.touched || props.submitFailed) && props.valid === false};
};

export default connect(mapStateToProps)(FormGroup);
