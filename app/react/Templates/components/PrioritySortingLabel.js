import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';

export class PrioritySortingLabel extends Component {

  render() {
    return (
      <label className="property-label" htmlFor={this.props.htmlFor}>
        Priority sorting
        <i className="property-help fa fa-question-circle">
          <div className="property-description">
            Properties marked as priority sorting will be used as default sorting criteria.
            If more than one property is marked as priority sorting the system will try to pick-up the best fit.
            When listing mixed template types, the system will pick-up the best combined priority sorting.
          </div>
        </i>
      </label>
    );
  }
}

PrioritySortingLabel.propTypes = {
  htmlFor: PropTypes.string
};

export default connect()(PrioritySortingLabel);
